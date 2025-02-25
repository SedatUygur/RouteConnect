import datetime

from django.utils import timezone
from .map_api_client import get_route_data
from ..models import Stop

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