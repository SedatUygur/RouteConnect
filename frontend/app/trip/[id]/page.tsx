"use client";

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { useParams } from 'next/navigation';
import axios from 'axios';

//import RouteMap from '@/components/RouteMap';
const DynamicRouteMap = dynamic(() => import('@/components/RouteMap'), {
    ssr: false,
});

interface Stop {
    id: number;
    stop_type: string;
    location: string;
    start_time: string;
    end_time: string;
}

interface Trip {
    id: number;
    current_location: string;
    pickup_location: string;
    dropoff_location: string;
    geometry?: [number, number][];
    stops: Stop[];
}

export default function TripPage() {
    const tripsApiUrl = process.env.NEXT_PUBLIC_TRIPS_API_URL;

    const { id } = useParams();
    const [ trip, setTrip ] = useState<Trip | null>(null);

    const fetchTrip = async () => {
        try {
          const resp = await axios.get(`${tripsApiUrl}${id}`);
          setTrip(resp.data);
        } catch (err) {
          console.error(err);
        }
    };

    const handleCalculate = async () => {
        try {
          await axios.post(`${tripsApiUrl}${id}/calculate_route/`);
          fetchTrip();
        } catch (err) {
          console.error(err);
        }
    };

    useEffect(() => {
        if (id) {
          fetchTrip();
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    if (!trip) return <div>Loading trip details...</div>;
    console.log(trip);

    return (
        <div style={{ padding: '1rem' }}>
            <h2>Trip {trip.id} Details</h2>
            <p><strong>Current:</strong> {trip.current_location}</p>
            <p><strong>Pickup:</strong> {trip.pickup_location}</p>
            <p><strong>Dropoff:</strong> {trip.dropoff_location}</p>
            <button onClick={handleCalculate}>Calculate Route & HOS</button>

            {trip.stops && trip.stops.length > 0 && (
                <div>
                    <h3>Stops</h3>
                    <ul>
                        {trip.stops.map((stop) => (
                            <li key={stop.id}>
                                <strong>{stop.stop_type}</strong> at {stop.location} from {new Date(stop.start_time).toLocaleString()} to {new Date(stop.end_time).toLocaleString()}
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            <div style={{ margin: '2rem 0' }}>
                <h3>Route Map</h3>
                <DynamicRouteMap routeCoordinates={trip.geometry || []} />
            </div>
        </div>
    );
}