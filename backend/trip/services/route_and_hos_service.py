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
