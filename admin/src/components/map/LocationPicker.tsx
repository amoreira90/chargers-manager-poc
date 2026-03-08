import { useEffect, useRef, useState, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix para los iconos de Leaflet en Vite/React
delete (L.Icon.Default.prototype as unknown as { _getIconUrl: unknown })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

interface LocationPickerProps {
  address: string;
  latitude: number;
  longitude: number;
  onLocationChange: (lat: number, lng: number) => void;
  onAddressChange?: (address: string) => void;
}

// Geocodificación inversa: obtener dirección desde coordenadas
async function reverseGeocode(lat: number, lng: number): Promise<string | null> {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
      {
        headers: {
          'User-Agent': 'EVSE-Admin-App',
        },
      },
    );

    const data = await response.json();

    if (data && data.address) {
      // Formatear la dirección de forma limpia
      const addr = data.address;
      const parts: string[] = [];

      if (addr.road) {
        if (addr.house_number) {
          parts.push(`${addr.road} ${addr.house_number}`);
        } else {
          parts.push(addr.road);
        }
      }

      const neighbourhood = addr.neighbourhood || addr.suburb;
      if (neighbourhood && neighbourhood !== addr.city) {
        parts.push(neighbourhood);
      }

      const city = addr.city || addr.town || addr.village;
      if (city) {
        parts.push(city);
      }

      return parts.length > 0 ? parts.join(', ') : data.display_name;
    }

    return null;
  } catch (error) {
    console.error('Error en geocodificación inversa:', error);
    return null;
  }
}

// Componente interno para manejar eventos del mapa
function LocationMarker({
  position,
  onPositionChange,
}: {
  position: [number, number];
  onPositionChange: (lat: number, lng: number) => void;
}) {
  const markerRef = useRef<L.Marker>(null);

  const map = useMapEvents({
    click(e) {
      onPositionChange(e.latlng.lat, e.latlng.lng);
    },
  });

  useEffect(() => {
    if (position[0] !== 0 || position[1] !== 0) {
      map.setView(position, map.getZoom());
    }
  }, [position, map]);

  const eventHandlers = {
    dragend() {
      const marker = markerRef.current;
      if (marker) {
        const pos = marker.getLatLng();
        onPositionChange(pos.lat, pos.lng);
      }
    },
  };

  return (
    <Marker position={position} draggable={true} eventHandlers={eventHandlers} ref={markerRef} />
  );
}

// Servicio de geocoding usando Nominatim (OpenStreetMap) - Limitado a Uruguay
async function geocodeAddress(address: string): Promise<{ lat: number; lng: number } | null> {
  if (!address || address.trim().length < 3) return null;

  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&countrycodes=uy&limit=1`,
      {
        headers: {
          'User-Agent': 'EVSE-Admin-App',
        },
      },
    );

    const data = await response.json();

    if (data && data.length > 0) {
      return {
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon),
      };
    }

    return null;
  } catch (error) {
    console.error('Error al geocodificar dirección:', error);
    return null;
  }
}

export default function LocationPicker({
  address,
  latitude,
  longitude,
  onLocationChange,
  onAddressChange,
}: LocationPickerProps) {
  const [position, setPosition] = useState<[number, number]>([
    latitude || -34.9011, // Montevideo, Uruguay por defecto
    longitude || -56.1645,
  ]);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [geocodeError, setGeocodeError] = useState<string | null>(null);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isReverseGeocoding, setIsReverseGeocoding] = useState(false);
  const skipNextAddressGeocodeRef = useRef(false);

  // Geocodificar cuando cambia la dirección (con debounce)
  useEffect(() => {
    if (skipNextAddressGeocodeRef.current) {
      skipNextAddressGeocodeRef.current = false;
      return;
    }

    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    debounceTimer.current = setTimeout(async () => {
      if (address && address.trim().length >= 5) {
        setIsGeocoding(true);
        setGeocodeError(null);

        const result = await geocodeAddress(address);

        if (result) {
          setPosition([result.lat, result.lng]);
          onLocationChange(result.lat, result.lng);
          setGeocodeError(null);
        } else {
          setGeocodeError('No se pudo encontrar la ubicación. Ajusta el marcador manualmente.');
        }

        setIsGeocoding(false);
      }
    }, 1000); // Espera 1 segundo después de que el usuario deje de escribir

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [address, onLocationChange]);

  // Actualizar posición cuando cambien las coordenadas externamente
  useEffect(() => {
    if (latitude && longitude && (latitude !== position[0] || longitude !== position[1])) {
      setPosition([latitude, longitude]);
    }
  }, [latitude, longitude, position]);

  const handlePositionChange = useCallback(
    (lat: number, lng: number) => {
      setPosition([lat, lng]);
      onLocationChange(lat, lng);
      setGeocodeError(null);

      // Geocodificación inversa para actualizar la dirección
      if (onAddressChange) {
        setIsReverseGeocoding(true);
        reverseGeocode(lat, lng).then((nextAddress) => {
          if (nextAddress) {
            // Evita re-geocodificar esta dirección y "saltar" de vuelta en el mapa.
            skipNextAddressGeocodeRef.current = true;
            onAddressChange(nextAddress);
          }
          setIsReverseGeocoding(false);
        });
      }
    },
    [onLocationChange, onAddressChange],
  );

  // Solo mostrar el mapa si tenemos coordenadas válidas
  const hasValidCoordinates = position[0] !== 0 || position[1] !== 0;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Ubicación en el mapa
        </label>
        {(isGeocoding || isReverseGeocoding) && (
          <span className="text-xs text-blue-600 dark:text-blue-400 flex items-center gap-1">
            <svg
              className="animate-spin h-3 w-3"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            {isReverseGeocoding ? 'Obteniendo dirección...' : 'Buscando ubicación...'}
          </span>
        )}
      </div>

      {geocodeError && (
        <div className="text-xs text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20 px-3 py-2 rounded border border-orange-200 dark:border-orange-800">
          {geocodeError}
        </div>
      )}

      <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">
        💡 Arrastra el marcador o haz clic en el mapa para ajustar la ubicación (se actualizará la
        dirección automáticamente)
      </div>

      {hasValidCoordinates ? (
        <div className="h-96 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-800 relative z-0">
          <MapContainer
            center={position}
            zoom={15}
            style={{ height: '100%', width: '100%', zIndex: 0 }}
            scrollWheelZoom={true}
            zoomControl={true}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <LocationMarker position={position} onPositionChange={handlePositionChange} />
          </MapContainer>
        </div>
      ) : (
        <div className="h-96 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-800 flex items-center justify-center bg-gray-50 dark:bg-gray-800">
          <div className="text-center text-gray-500 dark:text-gray-400">
            <svg
              className="mx-auto h-12 w-12 mb-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            <p>Ingresa una dirección para ver el mapa</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 dark:text-gray-400">
        <div>
          <span className="font-medium">Latitud:</span> {position[0].toFixed(6)}
        </div>
        <div>
          <span className="font-medium">Longitud:</span> {position[1].toFixed(6)}
        </div>
      </div>
    </div>
  );
}
