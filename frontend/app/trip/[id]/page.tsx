"use client";

import { useState } from 'react';

interface Trip {
    id: number;
    current_location: string;
    pickup_location: string;
    dropoff_location: string;
    geometry?: [number, number][];
}

export default function TripPage() {
    const [trip] = useState<Trip | null>(null);
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