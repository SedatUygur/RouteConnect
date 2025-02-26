import datetime
import pytz

from django.utils import timezone
from .map_api_client import get_route_data
from ..models import DailyLog, Stop

def calculate_trip_stops(trip):
    # Assume driver's local time zone
    # It could be provided per user in production
    local_tz = pytz.timezone("America/New_York")

    # 1. Retrieve route info via real geocoding
    route_info = get_route_data(trip.current_location, trip.dropoff_location)
    total_distance = route_info['distance']  # miles
    total_route_duration = route_info['duration']  # pure driving hours (without breaks)
    route_geometry = route_info['geometry']
    

    # Store in the Trip model
    trip.total_distance = total_distance
    trip.estimated_duration = total_route_duration
    trip.save()

    # Clear existing stops/logs for recalculation
    trip.stops.all().delete()
    trip.logs.all().delete()

    # Set start time (current time in driver's local time zone)
    current_dt = timezone.now().astimezone(local_tz)

    # Initialize rolling cycle parameters
    rolling_cycle_hours = float(trip.current_cycle_hours_used)
    daily_on_duty_history = []  # List of tuples: (date, on_duty_hours) for the last 8 days

    def update_rolling_cycle(new_on_duty, day_date):
        nonlocal daily_on_duty_history, rolling_cycle_hours # local to nonlocal
        daily_on_duty_history.append((day_date, new_on_duty))
        cutoff = day_date - datetime.timedelta(days=7)
        daily_on_duty_history = [(d, h) for (d, h) in daily_on_duty_history if d >= cutoff]
        rolling_cycle_hours = sum(h for (d, h) in daily_on_duty_history)

    # 2) Add pickup stop
    pickup_start = current_dt
    pickup_end = pickup_start + datetime.timedelta(hours=1)
    pickup_stop = Stop.objects.create(
        trip=trip,
        stop_type="Pickup",
        location=trip.pickup_location,
        start_time=pickup_start,
        end_time=pickup_end
    )
    current_dt = pickup_end  # Update time after pickup

    # Initialize daily driving parameters for the first day
    current_day = current_dt.date()
    daily_driving_hours = 0.0  # Actual driving time today
    daily_on_duty_hours = 1.0   # Already on duty for pickup
    
    miles_driven = 0.0
    next_fuel_mile = 1000.0  # Fueling is scheduled every 1000 miles
    
    drive_speed = 55.0  # Average speed (mph)
    has_taken_30min_break = False  # To ensure one break after 8 hours driving per day
    
    # Total miles remaining to drive
    miles_remaining = total_distance

    # 3. Process driving segments (simulate multi-day trip if needed)
    while miles_remaining > 0:
        # Calculate available driving time based on daily limits:
        # Maximum allowed is 11 hours driving, and total on-duty must remain within a 14-hour window.
        allowed_driving = 11.0 - daily_driving_hours
        allowed_on_duty = 14.0 - daily_on_duty_hours
        effective_driving_time = min(allowed_driving, allowed_on_duty)

        if effective_driving_time <= 0:
            # End the current day if limits are reached.
            # Check rolling 70-hour cycle: if the accumulated on-duty hours reach 70, require a 34-hour restart.
            off_duty_duration = 34 if (rolling_cycle_hours + daily_on_duty_hours) >= 70 else 10
            
            # Record the day's log
            DailyLog.objects.create(
                trip=trip,
                date=current_day,
                total_driving=daily_driving_hours,
                total_on_duty=daily_on_duty_hours,
                total_off_duty=off_duty_duration,
                total_sleeper_berth=off_duty_duration
            )
            update_rolling_cycle(daily_on_duty_hours, current_day)

            # Advance time by the mandatory off-duty period
            current_dt += datetime.timedelta(hours=off_duty_duration)
            current_day = current_dt.date()
            daily_driving_hours = 0.0
            daily_on_duty_hours = 0.0
            has_taken_30min_break = False
            continue

        # Determine how many miles can be driven in the effective driving time
        potential_miles = effective_driving_time * drive_speed
        
        # Adjust if the next fuel stop comes sooner than potential miles
        if miles_driven + potential_miles >= next_fuel_mile:
            miles_to_drive = next_fuel_mile - miles_driven
            drive_time = miles_to_drive / drive_speed
            reached_fuel_stop = True
        else:
            miles_to_drive = min(potential_miles, miles_remaining)
            drive_time = miles_to_drive / drive_speed
            reached_fuel_stop = (miles_driven + miles_to_drive) >= next_fuel_mile

        # If the segment would cross the 8-hour driving mark, insert a 30-minute break.
        if daily_driving_hours < 8 and daily_driving_hours + drive_time > 8 and not has_taken_30min_break:
            time_until_break = 8 - daily_driving_hours
            drive_time_before_break = time_until_break
            miles_before_break = drive_time_before_break * drive_speed
            
            daily_driving_hours += drive_time_before_break
            daily_on_duty_hours += drive_time_before_break
            current_dt += datetime.timedelta(hours=drive_time_before_break)
            miles_driven += miles_before_break
            miles_remaining -= miles_before_break

            # Insert a 30-minute break
            break_start = current_dt
            break_end = current_dt + datetime.timedelta(minutes=30)
            Stop.objects.create(
                trip=trip,
                stop_type="Break",
                location="Rest Area",
                start_time=break_start,
                end_time=break_end
            )
            current_dt = break_end
            daily_on_duty_hours += 0.5
            has_taken_30min_break = True
            continue  # Recalculate available time after break
        
        # Drive for the computed drive_time
        daily_driving_hours += drive_time
        daily_on_duty_hours += drive_time
        current_dt += datetime.timedelta(hours=drive_time)
        miles_driven += miles_to_drive
        miles_remaining -= miles_to_drive

        # If we hit a fueling stop (1000 mile intervals) or we are done
        if reached_fuel_stop and miles_remaining > 0:
            # Insert fueling stop
            fueling_stop = Stop.objects.create(
                trip=trip,
                stop_type="Fuel",
                location=f"Fuel Station near mile {int(miles_driven)}",
                start_time=current_dt,
                end_time=current_dt + datetime.timedelta(minutes=15)
            )
            on_duty_hours_today += 0.25
            current_dt += datetime.timedelta(minutes=15)
    
    # 3) Add drop-off stop
    dropoff_stop = Stop.objects.create(
        trip=trip,
        stop_type="Dropoff",
        location=trip.dropoff_location,
        start_time=current_dt,
        end_time=current_dt + datetime.timedelta(hours=1)
    )
    on_duty_hours_today += 1
    current_dt += datetime.timedelta(hours=1)