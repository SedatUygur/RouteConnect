"use client";

import { FormEvent, useState } from 'react'

export default function Home() {
  const [currentLocation, setCurrentLocation] = useState('');
  const [pickupLocation, setPickupLocation] = useState('');
  const [dropoffLocation, setDropoffLocation] = useState('');
  const [cycleHours, setCycleHours] = useState('');

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      
    } catch (err) {
      console.error(err);
      alert("Error creating trip.");
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
        <button type="submit">Create Trip</button>
      </form>
    </div>
  );
}
