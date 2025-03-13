'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';

interface TripData {
  current_location: string;
  pickup_location: string;
  dropoff_location: string;
  current_cycle_hours_used: string;
  name_of_carrier?: string;
  main_office_address?: string;
  home_terminal_address?: string;
  vehicle_number?: string;
  manifest_number?: string;
  shipper_company?: string;
  commodity?: string;
}

interface Error {
  [key: string]: string;
}

export default function Home() {
  const router = useRouter();
  /*
  const [currentLocation, setCurrentLocation] = useState('');
  const [pickupLocation, setPickupLocation] = useState('');
  const [dropoffLocation, setDropoffLocation] = useState('');
  const [cycleHours, setCycleHours] = useState('');
  const [carrierName, setCarrierName] = useState('');
  const [mainOfficeAddress, setMainOfficeAddress] = useState('');
  const [homeTerminalAddress, setHomeTerminalAddress] = useState('');
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [manifestNumber, setManifestNumber] = useState('');
  const [shipperCompany, setShipperCompany] = useState('');
  const [commodity, setCommodity] = useState('');
  */

  const [tripData, setTripData] = useState<TripData>({
    current_location: '',
    pickup_location: '',
    dropoff_location: '',
    current_cycle_hours_used: '',
  });

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errors, setErrors] = useState<Error>({});

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true); // Loading state starts

    const tripsApiUrl = process.env.NEXT_PUBLIC_TRIPS_API_URL;
    if (!tripsApiUrl) {
      alert('API URL is not defined.');
      return;
    }

    try {
      /*const data = {
        current_location: currentLocation,
        pickup_location: pickupLocation,
        dropoff_location: dropoffLocation,
        current_cycle_hours_used: cycleHours,
        name_of_carrier: carrierName,
        main_office_address: mainOfficeAddress,
        home_terminal_address: homeTerminalAddress,
        vehicle_number: vehicleNumber,
        manifest_number: manifestNumber,
        shipper_company: shipperCompany,
        commodity: commodity,
      };*/
      const response = await axios.post(tripsApiUrl!, tripData);
      const newTrip = response.data;
      router.push(`/trip/${newTrip.id}`);
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const errorResponse = err.response;
        if (errorResponse) {
          const errorData = errorResponse.data;
          if (errorData) {
            setErrors(errorData);
          }
        }
      }
    } finally {
      setIsLoading(false); // Loading state ends
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setTripData({ ...tripData, [name]: value });
  };

  return (
    <div className="rounded-lg bg-white p-6 shadow-md">
      <h2 className="mb-4 text-center text-xl font-bold">Create a New Trip</h2>
      <form className="space-y-4" onSubmit={handleSubmit}>
        <div>
          <p>
            Required fields are marked <span className="requiredLabel"></span>
          </p>
          <br></br>
          <label className="requiredLabel block text-sm font-medium text-gray-700">
            Current Location:
          </label>
          <input
            className="w-full rounded-md border p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            type="text"
            name="current_location"
            value={tripData.current_location}
            onChange={handleInputChange}
            placeholder="Enter current address"
            required
          />
          {errors.current_location && <div>{errors.current_location}</div>}
        </div>
        <div>
          <label className="requiredLabel block text-sm font-medium text-gray-700">
            Pickup Location:
          </label>
          <input
            className="w-full rounded-md border p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            type="text"
            name="pickup_location"
            value={tripData.pickup_location}
            onChange={handleInputChange}
            placeholder="Enter pickup address"
            required
          />
          {errors.pickup_location && <div>{errors.pickup_location}</div>}
        </div>
        <div>
          <label className="requiredLabel block text-sm font-medium text-gray-700">
            Drop-off Location:
          </label>
          <input
            className="w-full rounded-md border p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            type="text"
            name="dropoff_location"
            value={tripData.dropoff_location}
            onChange={handleInputChange}
            placeholder="Enter drop-off address"
            required
          />
          {errors.dropoff_location && <div>{errors.dropoff_location}</div>}
        </div>
        <div>
          <label className="requiredLabel block text-sm font-medium text-gray-700">
            Current Cycle Hours Used:
          </label>
          <input
            className="w-full rounded-md border p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            type="number"
            step="0.1"
            name="current_cycle_hours_used"
            value={tripData.current_cycle_hours_used}
            onChange={handleInputChange}
            placeholder="e.g., 12.5"
            required
          />
          {errors.current_cycle_hours_used && (
            <div>{errors.current_cycle_hours_used}</div>
          )}
        </div>
        {/* New Fields */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Name of Carrier:
          </label>
          <input
            type="text"
            name="name_of_carrier"
            value={tripData.name_of_carrier}
            onChange={handleInputChange}
            placeholder="Enter carrier name"
            className="w-full rounded-md border p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Main Office Address:
          </label>
          <input
            type="text"
            name="main_office_address"
            value={tripData.main_office_address}
            onChange={handleInputChange}
            placeholder="Enter main office address"
            className="w-full rounded-md border p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Home Terminal Address:
          </label>
          <input
            type="text"
            name="home_terminal_address"
            value={tripData.home_terminal_address}
            onChange={handleInputChange}
            placeholder="Enter home terminal address"
            className="w-full rounded-md border p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Vehicle Number:
          </label>
          <input
            type="text"
            name="vehicle_number"
            value={tripData.vehicle_number}
            onChange={handleInputChange}
            placeholder="Enter vehicle number or license plate"
            className="w-full rounded-md border p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Manifest Number:
          </label>
          <input
            type="text"
            name="manifest_number"
            value={tripData.manifest_number}
            onChange={handleInputChange}
            placeholder="Enter manifest number or DVL"
            className="w-full rounded-md border p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Shipper Company:
          </label>
          <input
            type="text"
            name="shipper_company"
            value={tripData.shipper_company}
            onChange={handleInputChange}
            placeholder="Enter shipper company name"
            className="w-full rounded-md border p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Commodity:</label>
          <input
            type="text"
            name="commodity"
            value={tripData.commodity}
            onChange={handleInputChange}
            placeholder="Enter commodity"
            className="w-full rounded-md border p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
