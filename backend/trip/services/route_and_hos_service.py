from .map_api_client import get_route_data

def calculate_trip_stops(trip):
    route_info = get_route_data(trip.current_location, trip.dropoff_location)
    distance_miles = route_info['distance']   # total miles
    duration_hours = route_info['duration']   # total hours (approx)

    # Store in the Trip model
    trip.total_distance = distance_miles
    trip.estimated_duration = duration_hours
    trip.save()