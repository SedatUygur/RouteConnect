'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { useParams } from 'next/navigation';
import axios from 'axios';

import DailyLogPdf from '@/components/DailyLogPdf';

// For server-side rendering of Leaflet, we disable SSR
const DynamicRouteMap = dynamic(() => import('@/components/RouteMap'), {
  ssr: false,
});

interface EventItem {
  start_time: string;
  end_time: string;
  status: "Off Duty" | "Sleeper Berth" | "Driving" | "On Duty";
  remarks: string;
}

interface DailyLog {
  id: number;
  date: string;
  total_driving: number;
  total_on_duty: number;
  total_off_duty: number;
  total_sleeper_berth: number;
  events: EventItem[];
}

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
  name_of_carrier: string;
  main_office_address: string;
  home_terminal_address: string;
  vehicle_number: string;
  manifest_number: string;
  shipper_company: string;
  commodity: string;
  total_distance: number;
  stops: Stop[];
  logs: DailyLog[];
  geometry?: [number, number][];
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

  if (!trip) return <div className="text-center">Loading trip details...</div>;

  return (
    <div className="rounded-lg bg-white p-6 shadow-md">
      <h2 className="mb-4 text-center text-xl font-bold">Trip {trip.id} Details</h2>
      <div className="space-y-2">
        <p><strong>From:</strong> {trip.current_location}</p>
        <p><strong>Pickup:</strong> {trip.pickup_location}</p>
        <p><strong>To:</strong> {trip.dropoff_location}</p>
        {trip.total_distance !== undefined && (
          <p><strong>Total Miles:</strong> {trip.total_distance}</p>
        )}
        {trip.vehicle_number && (
          <p><strong>Vehicle #:</strong> {trip.vehicle_number}</p>
        )}
        {trip.name_of_carrier && (
          <p><strong>Carrier:</strong> {trip.name_of_carrier}</p>
        )}
        {trip.main_office_address && (
          <p><strong>Main Office:</strong> {trip.main_office_address}</p>
        )}
        {trip.home_terminal_address && (
          <p><strong>Home Terminal:</strong> {trip.home_terminal_address}</p>
        )}
        {trip.manifest_number && (
          <p><strong>Manifest #:</strong> {trip.manifest_number}</p>
        )}
        {trip.shipper_company && trip.commodity && (
          <p><strong>Shipper & Commodity:</strong> {trip.shipper_company}, {trip.commodity}</p>
        )}
      </div>
      <button
        className="mt-4 w-full rounded-md bg-blue-600 py-2 text-white transition hover:bg-blue-700"
        onClick={handleCalculate}
      >
        Calculate Route & HOS
      </button>

      {trip.stops?.length > 0 && (
        <div className="mt-4">
          <h3 className="text-lg font-semibold">Stops</h3>
          <ul className="list-disc list-inside space-y-2">
            {trip.stops.map((stop) => (
              <li key={stop.id}>
                <strong>{stop.stop_type}</strong> at {stop.location} from {new Date(stop.start_time).toLocaleString()} to {new Date(stop.end_time).toLocaleString()}
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
        {showPdf && trip.logs && <DailyLogPdf trip={trip} />}
      </div>
    </div>
  );
}
