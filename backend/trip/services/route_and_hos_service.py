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
    start_dt = timezone.now()

    # 1) Add pickup stop
    pickup_stop = Stop.objects.create(
        trip=trip,
        stop_type="Pickup",
        location=trip.pickup_location,
        start_time=start_dt,
        end_time=start_dt + datetime.timedelta(hours=1)
    )

    # 2) Driving from pickup to drop-off with fueling and HOS breaks
    miles_covered = 0
    hours_driven_today = 0
    on_duty_hours_today = 0
    day_start = start_dt
    current_dt = pickup_stop.end_time
    daily_log_date = current_dt.date()

    daily_log = DailyLog.objects.create(
        trip=trip,
        date=daily_log_date
    )

    # The simplified approach: break the entire distance into daily chunks of up to 11 hours driving
    # Also consider fueling stops every 1000 miles
    miles_remaining = total_distance
    drive_speed = 55.0  # mph average speed, for example
    daily_cycle_used = float(trip.current_cycle_hours_used)

    while miles_remaining > 0:
        # Check if we need a new day
        if hours_driven_today >= 11 or on_duty_hours_today >= 14:
            # End day with 10 hours off
            daily_log.total_driving = hours_driven_today
            daily_log.total_on_duty = on_duty_hours_today
            daily_log.save()

            current_dt += datetime.timedelta(hours=10)  # 10 hr off duty
            day_start = current_dt
            hours_driven_today = 0
            on_duty_hours_today = 0

            # new day log
            daily_log_date = current_dt.date()
            daily_log = DailyLog.objects.create(
                trip=trip,
                date=daily_log_date
            )

            # also accumulate into 70-hour cycle
            daily_cycle_used += (daily_log.total_on_duty or 0)

        # Calculate how many miles we can drive before hitting 11-hr daily driving limit
        drive_time_left = 11 - hours_driven_today

        # Also consider 70-hr/8-day limit. I skip advanced rolling calculations for brevity.
        # For fueling every 1000 miles, let's see how many miles remain to the next fueling stop:
        next_fuel_miles = 1000 - (miles_covered % 1000)

        if next_fuel_miles > miles_remaining:
            next_fuel_miles = miles_remaining

        # Determine how many miles we can drive in `drive_time_left` hours
        possible_miles = drive_time_left * drive_speed
        actual_miles_to_drive = min(possible_miles, next_fuel_miles)

        # Time to drive those miles
        drive_time = actual_miles_to_drive / drive_speed

        # If 8 hours of driving is reached, insert a 30-min break (once per day).
        if hours_driven_today < 8 and hours_driven_today + drive_time > 8:
            # Insert a break at the 8-hour mark
            break_dt = current_dt + datetime.timedelta(hours=(8 - hours_driven_today))
            # On-duty not driving or off duty for 30 min. I'll mark it as on-duty for simplicity
            on_duty_hours_today += 0.5
            current_dt = break_dt + datetime.timedelta(minutes=30)
            hours_driven_today = 8
        
        # Continue driving
        miles_covered += actual_miles_to_drive
        miles_remaining -= actual_miles_to_drive
        hours_driven_today += drive_time
        on_duty_hours_today += drive_time
        current_dt += datetime.timedelta(hours=drive_time)

        # If we hit a fueling stop (1000 mile intervals) or we are done
        if miles_remaining > 0 and miles_covered % 1000 < 1 and miles_remaining > 0:
            # Insert fueling stop
            fueling_stop = Stop.objects.create(
                trip=trip,
                stop_type="Fuel",
                location=f"Fuel station near mile {miles_covered}",
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

    # finalize daily log
    daily_log.total_driving = hours_driven_today
    daily_log.total_on_duty = on_duty_hours_today
    daily_log.save()