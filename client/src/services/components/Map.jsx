import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet';
import L from 'leaflet';

const defaultCenter = [20.5937, 78.9629];

const userIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

export default function Map({ userLocation, hospitals = [], height = '300px' }) {
  const center = userLocation
    ? [userLocation.latitude, userLocation.longitude]
    : defaultCenter;

  return (
    <div className="overflow-hidden rounded-lg border border-gray-200" style={{ height }}>
      <MapContainer center={center} zoom={userLocation ? 13 : 5} className="h-full w-full">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {userLocation && (
          <Marker position={center} icon={userIcon}>
            <Popup>Your location</Popup>
          </Marker>
        )}
        {hospitals.map((hospital, index) => {
          const latitude = hospital.latitude ?? hospital.location?.coordinates?.[1];
          const longitude = hospital.longitude ?? hospital.location?.coordinates?.[0];

          if (typeof latitude !== 'number' || typeof longitude !== 'number') {
            return null;
          }

          return (
            <Marker key={hospital._id || index} position={[latitude, longitude]}>
              <Popup>
                <strong>{hospital.name}</strong>
                {hospital.phone && <p>{hospital.phone}</p>}
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}
