"use client";

import { FormEvent, useState } from 'react'
import { useRouter } from 'next/navigation';
import axios from 'axios';

export default function Home() {
  const router = useRouter();

  const [currentLocation, setCurrentLocation] = useState('');
  const [pickupLocation, setPickupLocation] = useState('');
  const [dropoffLocation, setDropoffLocation] = useState('');
  const [cycleHours, setCycleHours] = useState('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    const tripsApiUrl = process.env.NEXT_PUBLIC_TRIPS_API_URL;
    if (!tripsApiUrl) {
      alert("API URL is not defined.");
      return;
    }

    e.preventDefault();
    setIsLoading(true); // Loading state starts
    try {
      const data = {
        current_location: currentLocation,
        pickup_location: pickupLocation,
        dropoff_location: dropoffLocation,
        current_cycle_hours_used: cycleHours,
      };
      const response = await axios.post(tripsApiUrl!, data);
      const newTrip = response.data;
      router.push(`/trip/${newTrip.id}`);
    } catch (err) {
      console.error(err);
      alert("Error creating trip.");
    } finally {
      setIsLoading(false); // Loading state ends
    }
  };

  return (
    <div style={{ padding: '1rem' }}>
      <h2>Create a New Trip</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Current Location:</label>
          <input type="text" value={currentLocation} onChange={(e) => setCurrentLocation(e.target.value)} placeholder="Enter current address" required />
        </div>
        <div>
          <label>Pickup Location:</label>
          <input type="text" value={pickupLocation} onChange={(e) => setPickupLocation(e.target.value)} placeholder="Enter pickup address" required />
        </div>
        <div>
          <label>Drop-off Location:</label>
          <input type="text" value={dropoffLocation} onChange={(e) => setDropoffLocation(e.target.value)} placeholder="Enter drop-off address" required />
        </div>
        <div>
          <label>Current Cycle Hours Used:</label>
          <input type="number" step="0.1" value={cycleHours} onChange={(e) => setCycleHours(e.target.value)} placeholder="e.g., 12.5" required />
        </div>
        <button type="submit" disabled={isLoading}>{isLoading ? "Loading..." : "Create Trip"}</button>
      </form>
    </div>
  );
}
