import { MapContainer, Polyline, TileLayer } from 'react-leaflet';

import 'leaflet/dist/leaflet.css';

interface RouteMapProps {
  routeCoordinates: [number, number][];
}

export default function RouteMap({ routeCoordinates }: RouteMapProps) {
  const positions: [number, number][] = routeCoordinates.map((coord) => [
    coord[1],
    coord[0],
  ]);
  return (
    <div className="h-90 md:h-110 w-full">
      <MapContainer
        center={positions.length ? (positions[0] as [number, number]) : [40, -95]}
        className="h-full w-full rounded"
        zoom={5}
        style={{ height: '400px', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {positions.length > 1 && <Polyline positions={positions} color="blue" />}
      </MapContainer>
    </div>
  );
}
