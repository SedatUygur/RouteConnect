'use client';

import { FormEvent, useState } from 'react';
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
      alert('API URL is not defined.');
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
      alert('Error creating trip.');
    } finally {
      setIsLoading(false); // Loading state ends
    }
  };

  return (
    <div className="rounded-lg bg-white p-6 shadow-md">
      <h2 className="mb-4 text-center text-xl font-bold">Create a New Trip</h2>
      <form className="space-y-4" onSubmit={handleSubmit}>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Current Location:
          </label>
          <input
            className="w-full rounded-md border p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            type="text"
            value={currentLocation}
            onChange={(e) => setCurrentLocation(e.target.value)}
            placeholder="Enter current address"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Pickup Location:
          </label>
          <input
            className="w-full rounded-md border p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            type="text"
            value={pickupLocation}
            onChange={(e) => setPickupLocation(e.target.value)}
            placeholder="Enter pickup address"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Drop-off Location:
          </label>
          <input
            className="w-full rounded-md border p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            type="text"
            value={dropoffLocation}
            onChange={(e) => setDropoffLocation(e.target.value)}
            placeholder="Enter drop-off address"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Current Cycle Hours Used:
          </label>
          <input
            className="w-full rounded-md border p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            type="number"
            step="0.1"
            value={cycleHours}
            onChange={(e) => setCycleHours(e.target.value)}
            placeholder="e.g., 12.5"
            required
          />
        </div>
        <button
          className="w-full rounded-md bg-blue-600 py-2 text-white transition hover:bg-blue-700"
          type="submit"
          disabled={isLoading}
        >
          {isLoading ? 'Loading...' : 'Create Trip'}
        </button>
      </form>
    </div>
  );
}
