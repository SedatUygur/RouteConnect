"use client";

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import axios from 'axios';

interface Trip {
    id: number;
    current_location: string;
    pickup_location: string;
    dropoff_location: string;
    geometry?: [number, number][];
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

    useEffect(() => {
        if (id) {
          fetchTrip();
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    if (!trip) return <div>Loading trip details...</div>;

    return (
        <div style={{ padding: '1rem' }}>
          <h2>Trip {trip.id} Details</h2>
          <p><strong>Current:</strong> {trip.current_location}</p>
          <p><strong>Pickup:</strong> {trip.pickup_location}</p>
          <p><strong>Dropoff:</strong> {trip.dropoff_location}</p>
        </div>
    );
}