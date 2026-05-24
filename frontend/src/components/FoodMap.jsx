import { MapContainer, TileLayer, Marker, Popup, Circle, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Custom inline SVG icons bypass missing image path bugs in Vite/React-Leaflet
const ngoIcon = L.divIcon({
  html: `<div style="background-color: #3b82f6; width: 24px; height: 24px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 10px rgba(0,0,0,0.5);"></div>`,
  className: 'custom-ngo-icon',
  iconSize: [24, 24],
  iconAnchor: [12, 12]
});

const providerIcon = L.divIcon({
  html: `<div style="background-color: #ef4444; width: 16px; height: 16px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 5px rgba(0,0,0,0.5);"></div>`,
  className: 'custom-provider-icon',
  iconSize: [16, 16],
  iconAnchor: [8, 8]
});

export default function FoodMap({ ngoLocation, providers, optimizedIds }) {
  // Only draw route lines to locations selected by the Quantum engine
  const optimizedProviders = providers.filter(p => optimizedIds.includes(p._id));

  return (
    <div style={{ width: '100%', height: '400px', borderRadius: '1rem', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }}>
      <MapContainer 
        center={[ngoLocation.latitude, ngoLocation.longitude]} 
        zoom={12} 
        style={{ height: '100%', width: '100%', zIndex: 0 }}
      >
        {/* Dark theme tile layer matching glassmorphism UI */}
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://carto.com/">CARTO</a>'
        />
        
        {/* 10km Radius Visualizer */}
        <Circle 
          center={[ngoLocation.latitude, ngoLocation.longitude]} 
          radius={10000} 
          pathOptions={{ color: '#3b82f6', fillColor: '#3b82f6', fillOpacity: 0.1, weight: 1 }} 
        />

        {/* Central NGO Marker */}
        <Marker position={[ngoLocation.latitude, ngoLocation.longitude]} icon={ngoIcon}>
          <Popup>NGO Central Hub<br/>Bangalore</Popup>
        </Marker>

        {/* All Available Providers in Radius */}
        {providers.map(p => (
          p.latitude && p.longitude ? (
            <Marker key={p._id} position={[p.latitude, p.longitude]} icon={providerIcon}>
              <Popup>
                <strong style={{ color: '#000' }}>{p.foodName}</strong><br/>
                <span style={{ color: '#333' }}>{p.providerName}</span><br/>
                <span style={{ color: '#666' }}>{p.distance} meters away</span>
              </Popup>
            </Marker>
          ) : null
        ))}

        {/* Optimized Route Polylines */}
        {optimizedProviders.map(p => (
          p.latitude && p.longitude ? (
            <Polyline 
              key={`route-${p._id}`} 
              positions={[
                [ngoLocation.latitude, ngoLocation.longitude],
                [p.latitude, p.longitude]
              ]} 
              color="#10b981" 
              weight={3} 
              dashArray="5, 10" 
            />
          ) : null
        ))}
      </MapContainer>
    </div>
  );
}