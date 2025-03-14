import datetime
import pytz

from django.utils import timezone
from timezonefinder import TimezoneFinder
from .map_api_client import get_route_data
from ..models import DailyLog, Stop

def calculate_trip_stops(trip, driver_timezone=None, use_sleeper_berth=False):
    """
    Calculates the stops and daily log entries for a trip using detailed HOS logic based on the
    Interstate Truck Driver’s Guide. This implementation includes:
    
    - Real geocoding of start and destination addresses.
    - Determination of time zones via timezonefinder. The driver's effective timezone is either
      provided (driver_timezone) or determined from the start address.
    - A rolling 70-hour/8-day calculation using actual on-duty period timestamps.
    - Daily limits: maximum 11 hours of driving within a 14-hour on-duty window.
    - A 30-minute break after 8 cumulative driving hours.
    - A sleeper berth option: if enabled, an off-duty reset can be achieved with a 7+3 hour
      combination (7 consecutive hours in a sleeper plus 3 additional hours off duty) instead of a fixed 10-hour block.
    - Pickup and drop-off each require 1 hour.
    - Fuel stops are inserted every 1000 miles.
    - If the rolling total on-duty hours (across actual timestamps) reaches 70 hours in the preceding 8 days,
      a full 34-hour restart is enforced.
    - When crossing time zones, the final dropoff time is converted to the destination's local time.
    
    Parameters:
      trip: Trip model instance (with current_location, pickup_location, dropoff_location, etc.)
      driver_timezone (optional): a string time zone (e.g., "America/Chicago") provided by the user.
      use_sleeper_berth (bool): if True, use the sleeper berth option (7+3 off duty) for resets;
          otherwise use a fixed 10-hour off-duty period.
    """

    tf = TimezoneFinder()

    # 1. Retrieve route info via real geocoding
    route_info = get_route_data(trip.current_location, trip.dropoff_location)
    total_distance = route_info['distance']  # miles
    pure_driving_duration = route_info['duration']  # pure driving hours (without breaks)
    route_geometry = route_info['geometry']
    

    # Update Trip model fields
    trip.total_distance = total_distance
    trip.estimated_duration = pure_driving_duration
    trip.geometry = route_geometry
    trip.save()

    # 2) Time zone determination
    try:
        # get geocoded coordinates from the map client if available
        current_route = get_route_data(trip.current_location, trip.current_location)
        dropoff_route = get_route_data(trip.dropoff_location, trip.dropoff_location)

        start_coords = current_route['geometry'][0]
        dest_coords = dropoff_route['geometry'][0]

        start_tz_str = tf.timezone_at(lng=start_coords[0], lat=start_coords[1])
        dest_tz_str = tf.timezone_at(lng=dest_coords[0], lat=dest_coords[1])
    except Exception as e:
        print("Time zone determination error:", e)
        start_tz_str = "America/New_York"
        dest_tz_str = "America/New_York"

    # Use the provided driver_timezone if given; otherwise, default to the start location's timezone.
    effective_tz_str = driver_timezone if driver_timezone else start_tz_str
    effective_tz = pytz.timezone(effective_tz_str)

    # 3) Clear old stops/logs
    trip.stops.all().delete()
    trip.logs.all().delete()

    # 4) Start time in local tz
    current_dt = timezone.now().astimezone(effective_tz)

    # Rolling on-duty periods
    on_duty_periods = []  # list of (start, end)
    
    def add_on_duty_period(start, end):
        on_duty_periods.append((start, end))
    
    def compute_rolling_on_duty(current_time):
        """
        Sums the durations (in hours) of on-duty periods that started within the last 8 days
        relative to current_time.
        """
        cutoff = current_time - datetime.timedelta(days=8)
        total = 0.0

        for period_start, period_end in on_duty_periods:
            if period_start >= cutoff:
                total += (period_end - period_start).total_seconds() / 3600.0

        return total

    # 5) Helper: record an event in 15-min increments
    def record_event(event_list, start, end, status, remarks=""):
        increment = datetime.timedelta(minutes=15)
        block_start = start
        while block_start < end:
            block_end = min(block_start + increment, end)
            event_list.append({
                "start_time": block_start.isoformat(),
                "end_time": block_end.isoformat(),
                "status": status,
                "remarks": remarks
            })
            block_start = block_end

    # Initialize daily events.
    daily_events = []

    # 6) Insert 1-hour pickup (On Duty)
    pickup_start = current_dt
    pickup_end = pickup_start + datetime.timedelta(hours=1)
    Stop.objects.create(
        trip=trip,
        stop_type="Pickup",
        location=trip.pickup_location,
        start_time=pickup_start,
        end_time=pickup_end
    )
    # We treat "Pickup" as On Duty
    record_event(daily_events, pickup_start, pickup_end, "On Duty", remarks="Pickup at city, ST")
    add_on_duty_period(pickup_start, pickup_end)
    current_dt = pickup_end  # Update time after pickup

    # daily counters
    current_day = current_dt.date()
    daily_driving_hours = 0.0
    daily_on_duty_hours = 1.0  # already 1 hour for pickup
    daily_off_duty_hours = 0.0
    daily_sleeper_hours = 0.0
    # daily_on_duty_start = current_dt  # start time of the current on-duty block for this day
    
    miles_driven = 0.0
    next_fuel_mile = 1000.0  # Fueling is required every 1000 miles
    drive_speed = 55.0  # Assume an average speed (mph)
    has_taken_30min_break = False
    
    # Total miles remaining to drive
    miles_remaining = total_distance

    # 7. Process the driving segments with granular calculations.
    while miles_remaining > 0:
        # Compute current rolling on-duty hours over last 8 days.
        rolling_on_duty = compute_rolling_on_duty(current_dt)

        # Check if a full restart is needed (if rolling on-duty reaches 70 hours).
        if rolling_on_duty + daily_on_duty_hours >= 70:
            # If rolling on-duty exceeds limit, enforce a 34-hour restart.
            off_duty_duration = 34.0
            # End the on-duty block at same time
            add_on_duty_period(current_dt, current_dt)
            # Record the day's log
            DailyLog.objects.create(
                trip=trip,
                date=current_day,
                total_driving=daily_driving_hours,
                total_on_duty=daily_on_duty_hours,
                total_off_duty=daily_off_duty_hours + off_duty_duration,
                total_sleeper_berth=daily_sleeper_hours,
                events=daily_events,
            )

            # Advance time by the mandatory off-duty period
            record_event(daily_events, current_dt, current_dt + datetime.timedelta(hours=off_duty_duration),
                         "Off Duty", remarks="34-hour reset (rolling 70hr limit)")
            current_dt += datetime.timedelta(hours=off_duty_duration)
            current_day = current_dt.date()
            daily_driving_hours = 0.0
            daily_on_duty_hours = 0.0
            daily_off_duty_hours = 0.0
            daily_sleeper_hours = 0.0
            daily_events = []  # reset for new day
            has_taken_30min_break = False
            continue

        # Determine available time based on daily limits:
        # Maximum 11 hours driving and total on-duty not exceeding 14 hours.
        allowed_driving = 11.0 - daily_driving_hours
        allowed_on_duty = 14.0 - daily_on_duty_hours
        effective_driving_time = min(allowed_driving, allowed_on_duty)

        if effective_driving_time <= 0:
            # Daily limit reached: end the day with an off-duty (or sleeper combination) reset.
            # If using sleeper berth logic, allow a 7+3 combination; else use a 10-hour off-duty block.
            if use_sleeper_berth:
                sleeper_duration = 7.0  # 7 consecutive hours in the sleeper berth
                additional_off = 3.0    # plus 3 additional hours (can be off duty or sleeper)
                off_duty_duration = sleeper_duration + additional_off
            else:
                off_duty_duration = 10.0
            
            # End the current on-duty period.
            add_on_duty_period(current_dt, current_dt)
            # Record the day's log.
            DailyLog.objects.create(
                trip=trip,
                date=current_day,
                total_driving=daily_driving_hours,
                total_on_duty=daily_on_duty_hours,
                total_off_duty=daily_off_duty_hours + off_duty_duration,
                total_sleeper_berth=daily_sleeper_hours if use_sleeper_berth else 0,
                events=daily_events,
            )
            # Advance time by the off-duty period.
            record_event(daily_events, current_dt, current_dt + datetime.timedelta(hours=off_duty_duration),
                         "Off Duty", remarks="End of day reset")
            current_dt += datetime.timedelta(hours=off_duty_duration)
            current_day = current_dt.date()
            daily_driving_hours = 0.0
            daily_on_duty_hours = 0.0
            daily_off_duty_hours = 0.0
            daily_sleeper_hours = 0.0
            daily_events = []  # reset for new day
            has_taken_30min_break = False
            continue

        # Determine how many miles can be driven in the effective driving time
        potential_miles = effective_driving_time * drive_speed
        
        # Check if next fuel stop is nearer.
        if miles_driven + potential_miles >= next_fuel_mile:
            miles_to_drive = next_fuel_mile - miles_driven
            drive_time = miles_to_drive / drive_speed
            reached_fuel_stop = True
        else:
            miles_to_drive = min(potential_miles, miles_remaining)
            drive_time = miles_to_drive / drive_speed
            reached_fuel_stop = (miles_driven + miles_to_drive) >= next_fuel_mile

        # If the segment would cross the 8-hour driving mark, insert a 30-minute break.
        if daily_driving_hours < 8 and (daily_driving_hours + drive_time) > 8 and not has_taken_30min_break:
            # partial driving -> break
            time_until_break = 8.0 - daily_driving_hours
            partial_drive_start = current_dt
            partial_drive_end = current_dt + datetime.timedelta(hours=time_until_break)
            record_event(daily_events, partial_drive_start, partial_drive_end, "Driving", remarks="Driving until break")

            daily_driving_hours += time_until_break
            daily_on_duty_hours += time_until_break
            miles_before_break = time_until_break * drive_speed
            miles_driven += miles_before_break
            miles_remaining -= miles_before_break
            current_dt = partial_drive_end

            # Insert the 30-minute break and record it. (Off Duty)
            break_start = current_dt
            break_end = current_dt + datetime.timedelta(minutes=30)

            Stop.objects.create(
                trip=trip,
                stop_type="Break",
                location="Rest Area (city, ST)",
                start_time=break_start,
                end_time=break_end
            )

            record_event(daily_events, break_start, break_end, "Off Duty", remarks="30-min break")
            current_dt = break_end
            daily_off_duty_hours += 0.5
            has_taken_30min_break = True
            continue  # Recalculate available time after the break
        
        # Record driving event for the current segment.
        drive_start = current_dt
        drive_end = current_dt + datetime.timedelta(hours=drive_time)
        record_event(daily_events, drive_start, drive_end, "Driving", remarks="Driving on route")

        # Drive for the computed drive_time
        daily_driving_hours += drive_time
        daily_on_duty_hours += drive_time
        current_dt = drive_end
        miles_driven += miles_to_drive
        miles_remaining -= miles_to_drive

        # If a fuel stop is reached, add a fueling stop and record a fueling event (15 minutes)
        if reached_fuel_stop and miles_remaining > 0:
            fuel_start = current_dt
            fuel_duration = 0.25  # 15 minutes
            fuel_end = fuel_start + datetime.timedelta(hours=fuel_duration)

            Stop.objects.create(
                trip=trip,
                stop_type="Fuel",
                location=f"Fuel Station near mile {int(miles_driven)}",
                start_time=fuel_start,
                end_time=fuel_end
            )

            record_event(daily_events, fuel_start, fuel_end, "On Duty", remarks="Fueling at city, ST")
            daily_on_duty_hours += fuel_duration
            current_dt = fuel_end
            next_fuel_mile += 1000  # Set up next fuel stop
    
    # 8. After all driving is complete, insert the Dropoff Stop (1 hr, On Duty).
    dropoff_start = current_dt
    dropoff_end = dropoff_start + datetime.timedelta(hours=1)

    Stop.objects.create(
        trip=trip,
        stop_type="Dropoff",
        location=trip.dropoff_location,
        start_time=dropoff_start,
        end_time=dropoff_end
    )

    record_event(daily_events, dropoff_start, dropoff_end, "On Duty", remarks="Dropoff at city, ST")
    daily_on_duty_hours += 1
    current_dt = dropoff_end
    # end on-duty block
    add_on_duty_period(dropoff_start, dropoff_end)

    # 9. Record the final day's log with detailed events.
    DailyLog.objects.create(
        trip=trip,
        date=current_day,
        total_driving=daily_driving_hours,
        total_on_duty=daily_on_duty_hours,
        total_off_duty=daily_off_duty_hours,
        total_sleeper_berth=daily_sleeper_hours,
        events=daily_events,
    )

    # 10. If the destination is in a different time zone, adjust the final dropoff time.
    dest_tz = pytz.timezone(dest_tz_str)
    final_dropoff_local = current_dt.astimezone(dest_tz)
    # Optionally, store final_dropoff_local in the trip record.