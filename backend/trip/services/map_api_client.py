import os
from dotenv import load_dotenv

load_dotenv()

def get_route_data(start_address, end_address):

    # We need an API key from openrouteservice.org
    ORS_API_KEY = os.getenv("ORS_API_KEY", default="")