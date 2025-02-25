import os
import requests
from dotenv import load_dotenv

load_dotenv()

def get_route_data(start_address, end_address):

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
