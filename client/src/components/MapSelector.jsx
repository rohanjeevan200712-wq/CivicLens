import React, { useEffect, useRef, useState } from 'react';
import { MapPin, Navigation, Compass, CheckCircle } from 'lucide-react';
import L from 'leaflet';

// Fix Leaflet default icon path issues with bundlers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

export default function MapSelector({ initialLocation, onLocationChange, t }) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);
  const circleRef = useRef(null);

  // Default coordinates: Bangalore civic center (12.9716, 77.5946)
  const [lat, setLat] = useState(initialLocation?.lat || 12.9352);
  const [lng, setLng] = useState(initialLocation?.lng || 77.6245);
  const [address, setAddress] = useState(initialLocation?.address || "80 Feet Rd, 4th Block, Koramangala, Bengaluru");
  const [isLocating, setIsLocating] = useState(false);

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [lat, lng],
      zoom: 16,
      zoomControl: true,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);

    const marker = L.marker([lat, lng], { draggable: true }).addTo(map);
    const circle = L.circle([lat, lng], {
      color: '#0284c7',
      fillColor: '#38bdf8',
      fillOpacity: 0.2,
      radius: 150, // 150m duplicate detection radius
    }).addTo(map);

    marker.on('dragend', (event) => {
      const position = event.target.getLatLng();
      updateCoordinates(position.lat, position.lng);
    });

    map.on('click', (e) => {
      marker.setLatLng(e.latlng);
      updateCoordinates(e.latlng.lat, e.latlng.lng);
    });

    mapInstanceRef.current = map;
    markerRef.current = marker;
    circleRef.current = circle;

    // Trigger auto-locate once on mount
    autoLocate();

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  const updateCoordinates = async (newLat, newLng) => {
    setLat(newLat);
    setLng(newLng);

    if (circleRef.current) {
      circleRef.current.setLatLng([newLat, newLng]);
    }
    if (mapInstanceRef.current) {
      mapInstanceRef.current.panTo([newLat, newLng]);
    }

    // Reverse geocode via OpenStreetMap Nominatim
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${newLat}&lon=${newLng}`);
      if (res.ok) {
        const data = await res.json();
        const display = data.display_name || `${newLat.toFixed(4)}, ${newLng.toFixed(4)}`;
        setAddress(display);
        onLocationChange({ lat: newLat, lng: newLng, address: display });
        return;
      }
    } catch (e) {
      // Fallback
    }

    const fallbackAddr = `Ward Coordinates (${newLat.toFixed(4)}, ${newLng.toFixed(4)})`;
    setAddress(fallbackAddr);
    onLocationChange({ lat: newLat, lng: newLng, address: fallbackAddr });
  };

  const autoLocate = () => {
    if (!navigator.geolocation) return;
    setIsLocating(true);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocating(false);
        const { latitude, longitude } = pos.coords;
        if (markerRef.current) {
          markerRef.current.setLatLng([latitude, longitude]);
        }
        updateCoordinates(latitude, longitude);
      },
      (err) => {
        setIsLocating(false);
        console.warn('Geolocation unavailable, using default civic coordinates:', err.message);
        // Default to Bangalore
        onLocationChange({ lat, lng, address });
      },
      { timeout: 7000, enableHighAccuracy: true }
    );
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
        <label className="text-sm font-bold text-slate-800 flex items-center gap-2">
          <MapPin className="w-4 h-4 text-sky-600" />
          <span>{t?.locationTitle || "Location Confirmation"}</span>
        </label>

        <button
          type="button"
          onClick={autoLocate}
          disabled={isLocating}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-sky-50 hover:bg-sky-100 text-sky-700 text-xs font-bold rounded-lg border border-sky-200 transition tap-target sm:min-h-0"
        >
          <Navigation className={`w-3.5 h-3.5 ${isLocating ? 'animate-spin' : ''}`} />
          <span>{isLocating ? (t?.detectingLocation || "Detecting GPS...") : "Auto-Detect My GPS"}</span>
        </button>
      </div>

      {/* Map Canvas */}
      <div className="relative rounded-xl overflow-hidden border border-slate-200 h-52 sm:h-64 shadow-inner">
        <div ref={mapContainerRef} className="w-full h-full z-0" />
      </div>

      <div className="mt-3 flex items-start gap-2 bg-slate-50 border border-slate-200 p-2.5 rounded-xl text-xs text-slate-700">
        <Compass className="w-4 h-4 text-sky-600 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="font-semibold text-slate-800 line-clamp-2">{address}</p>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Lat: {lat.toFixed(5)}, Lng: {lng.toFixed(5)} • <span className="text-sky-700 font-semibold">150m duplicate detection radius active</span>
          </p>
        </div>
      </div>
    </div>
  );
}
