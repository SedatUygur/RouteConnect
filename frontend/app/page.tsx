"use client";

import { useState } from 'react'

export default function Home() {
  const [currentLocation, setCurrentLocation] = useState('');
  const [pickupLocation, setPickupLocation] = useState('');
  const [dropoffLocation, setDropoffLocation] = useState('');
  const [cycleHours, setCycleHours] = useState('');

  return (
    <div style={{ padding: '1rem' }}>
      <h2>Create a New Trip</h2>
      <form>
        <div>
          <label>Current Location:</label>
          <input type="text" value={currentLocation} placeholder="Enter current address" required />
        </div>
        <div>
          <label>Pickup Location:</label>
          <input type="text" value={pickupLocation} placeholder="Enter pickup address" required />
        </div>
        <div>
          <label>Drop-off Location:</label>
          <input type="text" value={dropoffLocation} placeholder="Enter drop-off address" required />
        </div>
        <div>
          <label>Current Cycle Hours Used:</label>
          <input type="number" step="0.1" value={cycleHours} placeholder="e.g., 12.5" required />
        </div>
        <button type="submit">Create Trip</button>
      </form>
    </div>
  );
}
