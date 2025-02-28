'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { useParams } from 'next/navigation';
import axios from 'axios';

import DailyLogPdf, { DailyLog } from '@/components/DailyLogPdf';

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
  logs: DailyLog[];
  stops: Stop[];
}

export default function TripDetail() {
  const tripsApiUrl = process.env.NEXT_PUBLIC_TRIPS_API_URL;

  const { id } = useParams();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [showPdf, setShowPdf] = useState(false);

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

  return (
    <div className="rounded-lg bg-white p-6 shadow-md">
      <h2 className="mb-4 text-center text-xl font-bold">Trip {trip.id} Details</h2>
      <div className="space-y-2">
        <p>
          <strong>Current:</strong> {trip.current_location}
        </p>
        <p>
          <strong>Pickup:</strong> {trip.pickup_location}
        </p>
        <p>
          <strong>Dropoff:</strong> {trip.dropoff_location}
        </p>
      </div>
      <button
        className="mt-4 w-full rounded-md bg-blue-600 py-2 text-white transition hover:bg-blue-700"
        onClick={handleCalculate}
      >
        Calculate Route & HOS
      </button>

      {trip.stops && trip.stops.length > 0 && (
        <div className="mt-4">
          <h3 className="text-lg font-semibold">Stops</h3>
          <ul className="list-inside list-disc space-y-2">
            {trip.stops.map((stop) => (
              <li key={stop.id}>
                <strong>{stop.stop_type}</strong> at {stop.location} from{' '}
                {new Date(stop.start_time).toLocaleString()} to{' '}
                {new Date(stop.end_time).toLocaleString()}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-4">
        <h3 className="text-lg font-semibold">Route Map</h3>
        <DynamicRouteMap routeCoordinates={trip.geometry || []} />
      </div>

      <div className="mt-4">
        <h3 className="text-lg font-semibold">Daily Logs</h3>
        <button
          className="rounded-md bg-green-600 px-4 py-2 text-white hover:bg-green-700"
          onClick={() => setShowPdf(true)}
        >
          Generate PDF Daily Log
        </button>
        {showPdf && trip.logs && <DailyLogPdf logs={trip.logs} />}
      </div>
    </div>
  );
}
