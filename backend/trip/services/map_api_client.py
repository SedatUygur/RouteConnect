import os
import requests
from dotenv import load_dotenv

load_dotenv()

def geocode_address(address):
    OSM_NOMINATIM_URL = os.getenv("OSM_NOMINATIM_URL", default="")

    params = {
        'q': address,
        'format': 'json',
        'limit': 1
    }

    response = requests.get(OSM_NOMINATIM_URL, params=params)
    data = response.json()

    if data:
        lon = float(data[0]['lon'])
        lat = float(data[0]['lat'])
        return [lon, lat]
    else:
        raise Exception(f"Geocoding failed for address: {address}")

# Adjust for real geocoding of start_address / end_address, or parse them from the user.
def get_route_data(start_address, end_address):
    """
    Geocode the addresses, then request directions.
    Return { 'distance': miles, 'duration': hours, 'geometry': <list of coords> }
    """
    # 1) Geocode start_address and end_address to lat/lng (simplify here or do it properly)
    # For demonstration, let's assume we already have lat/lng or we call an endpoint to get them.

    # 2) Call directions API with start and end coordinates
    # We need an API key from openrouteservice.org
    ORS_API_KEY = os.getenv("ORS_API_KEY", default="")
    ORS_API_DRIVING_CAR_URL = os.getenv("ORS_API_DRIVING_CAR_URL", default="")

    # For example : Hard-coded lat/lng for start and end points
    start_coords = [-77.434769, 37.54129]  # (lon, lat) for Richmond, VA
    end_coords = [-74.172363, 40.735657]   # Newark, NJ

    headers = {
        'Authorization': ORS_API_KEY,
        'Content-Type': 'application/json'
    }
    body = {
        "coordinates": [
            start_coords,
            end_coords
        ]
    }

    response = requests.post(ORS_API_DRIVING_CAR_URL, json=body, headers=headers)
    data = response.json()

    # parse out distance (meters) and duration (seconds) from the response
    feature = data['features'][0]
    segment = feature['properties']['segments'][0]
    dist_meters = segment['distance']
    dur_seconds = segment['duration']

    distance_miles = dist_meters / 1609.34
    duration_hours = dur_seconds / 3600.0

    return {
        'distance': distance_miles,
        'duration': duration_hours,
        'geometry': feature['geometry']['coordinates']
    }
