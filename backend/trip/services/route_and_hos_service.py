import datetime

from django.utils import timezone
from .map_api_client import get_route_data
from ..models import DailyLog, Stop

def calculate_trip_stops(trip):
    route_info = get_route_data(trip.current_location, trip.dropoff_location)
    distance_miles = route_info['distance']   # total miles
    duration_hours = route_info['duration']   # total hours (approx)

    # Store in the Trip model
    trip.total_distance = distance_miles
    trip.estimated_duration = duration_hours
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
    miles_remaining = distance_miles
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