import React, { useEffect, useRef, useState } from 'react';
import { Home, Loader2, MapPin as MapPinIcon } from 'lucide-react';

declare global {
    interface Window {
        google: any;
    }
}

interface Property {
    id: number;
    lat: number;
    lng: number;
    title: string;
    price: number;
    sqm: number;
    rooms: number;
    equityPercentage: number;
}

interface MapSectionProps {
    city: string;
}

// Property data - can be easily replaced with real data from API
const PROPERTIES: Property[] = [
    {
        id: 1,
        lat: 48.1351,
        lng: 11.5820,
        title: "Sunny Loft near Isartor",
        price: 650,
        sqm: 24,
        rooms: 1,
        equityPercentage: 5
    },
    {
        id: 2,
        lat: 48.1507,
        lng: 11.5810,
        title: "Student Hub Schwabing",
        price: 580,
        sqm: 18,
        rooms: 1,
        equityPercentage: 3
    },
    {
        id: 3,
        lat: 48.1299,
        lng: 11.5634,
        title: "Shared Flat Sendling",
        price: 450,
        sqm: 16,
        rooms: 4,
        equityPercentage: 7
    },
    {
        id: 4,
        lat: 48.1442,
        lng: 11.5568,
        title: "Maxvorstadt Studio",
        price: 720,
        sqm: 28,
        rooms: 1,
        equityPercentage: 6
    },
    {
        id: 5,
        lat: 48.1255,
        lng: 11.6003,
        title: "Haidhausen Modern Living",
        price: 690,
        sqm: 22,
        rooms: 2,
        equityPercentage: 4
    }
];

export const MapSection: React.FC<MapSectionProps> = ({ city }) => {
    const mapRef = useRef<HTMLDivElement>(null);
    const [loading, setLoading] = useState(true);
    const [activeProperty, setActiveProperty] = useState<Property | null>(null);
    const [mapError, setMapError] = useState<string | null>(null);
    const markersRef = useRef<any[]>([]);

    useEffect(() => {
        const apiKey = process.env.NEXT_PUBLIC_GOOGLE_API_KEY;

        if (!apiKey) {
            console.error("Google Maps API key not found in environment variables");
            setMapError("Configuration error: Map API key not available.");
            setLoading(false);
            return;
        }

        const loadMapScript = async () => {
            if (window.google?.maps) {
                initMap();
                setLoading(false);
                return;
            }

            const scriptId = 'google-maps-script';
            if (document.getElementById(scriptId)) {
                const script = document.getElementById(scriptId) as HTMLScriptElement;
                script.addEventListener('load', () => {
                    initMap();
                    setLoading(false);
                });
                return;
            }

            try {
                const script = document.createElement('script');
                script.id = scriptId;
                script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
                script.async = true;
                script.defer = true;

                const loadPromise = new Promise<void>((resolve, reject) => {
                    script.onload = () => resolve();
                    script.onerror = (e) => reject(e);
                });

                document.head.appendChild(script);

                await loadPromise;
                initMap();
                setLoading(false);
            } catch (error) {
                console.error("Error loading Google Maps:", error);
                setMapError("Failed to load interactive map.");
                setLoading(false);
            }
        };

        loadMapScript();

        return () => {
            // Cleanup markers
            markersRef.current.forEach(marker => marker.setMap(null));
        };
    }, []);

    const createMarkerIcon = (percentage: number) => {
        const width = 50;
        const height = 60;
        const barWidth = 40;
        const barHeight = 6;
        // Visual scaling
        const filledWidth = Math.max(3, (percentage / 100) * barWidth);

        // SVG string with House Icon + Progress Bar
        const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
      <defs>
        <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
          <feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="#000" flood-opacity="0.3"/>
        </filter>
      </defs>
      
      <!-- Progress Bar Section -->
      <g transform="translate(${(width - barWidth) / 2}, 0)">
        <!-- Track -->
        <rect width="${barWidth}" height="${barHeight}" rx="${barHeight / 2}" fill="white" stroke="#e5e7eb" stroke-width="1" />
        <!-- Indicator -->
        <rect width="${filledWidth}" height="${barHeight}" rx="${barHeight / 2}" fill="#FF6B35" />
      </g>

      <!-- Percentage Text -->
      <text x="${width / 2}" y="18" font-family="Arial, sans-serif" font-size="11" font-weight="bold" fill="#1f2937" text-anchor="middle">${percentage}%</text>

      <!-- House Icon Section -->
      <g transform="translate(${width / 2 - 12}, 22)" filter="url(#shadow)">
        <!-- House Shape -->
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" fill="#FF6B35" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <!-- Door -->
        <path d="M9 22V12h6v10" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </g>
    </svg>`;

        return 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg);
    };

    const initMap = () => {
        if (!mapRef.current || !window.google?.maps) return;

        try {
            const map = new window.google.maps.Map(mapRef.current, {
                center: { lat: 48.1351, lng: 11.5820 }, // Default to Munich
                zoom: 13,
                styles: [
                    {
                        featureType: "poi",
                        elementType: "labels",
                        stylers: [{ visibility: "off" }]
                    }
                ],
                disableDefaultUI: false,
                zoomControl: true,
                mapTypeControl: false,
                streetViewControl: false,
            });

            // Clear previous markers if any
            markersRef.current.forEach(marker => marker.setMap(null));
            markersRef.current = [];

            PROPERTIES.forEach((property: Property) => {
                const iconUrl = createMarkerIcon(property.equityPercentage);

                const marker = new window.google.maps.Marker({
                    position: { lat: property.lat, lng: property.lng },
                    map: map,
                    title: property.title,
                    icon: {
                        url: iconUrl,
                        scaledSize: new window.google.maps.Size(80, 96), // Increased size (approx 1.6x)
                        anchor: new window.google.maps.Point(40, 88) // Adjusted anchor point
                    },
                    animation: window.google.maps.Animation.DROP
                });

                marker.addListener("click", () => {
                    setActiveProperty(property);
                });

                markersRef.current.push(marker);
            });
        } catch (e) {
            console.error("Error initializing map:", e);
            setMapError("Could not initialize Google Maps.");
        }
    };

    return (
        <div className="w-full h-[600px] relative rounded-2xl overflow-hidden shadow-2xl border border-gray-200 dark:border-gray-800 bg-gray-100 dark:bg-gray-900">
            {loading && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-white dark:bg-dark z-10">
                    <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
                    <p className="text-gray-500 font-medium animate-pulse">Loading map...</p>
                </div>
            )}

            <div ref={mapRef} className="w-full h-full" />

            {(!loading && mapError) && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-800 text-center p-8">
                    <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
                        <MapPinIcon size={32} className="text-gray-400" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Map Unavailable</h3>
                    <p className="text-gray-500 max-w-md mb-6">{mapError}</p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-2xl">
                        {PROPERTIES.slice(0, 2).map((prop: Property) => (
                            <div key={prop.id} className="bg-white dark:bg-dark-card p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 flex justify-between items-center">
                                <div>
                                    <div className="font-bold dark:text-white">{prop.title}</div>
                                    <div className="text-sm text-gray-500">${prop.price}/mo</div>
                                </div>
                                <div className="text-right">
                                    <div className="text-sm font-semibold text-blue-600">{prop.equityPercentage}%</div>
                                    <div className="text-xs text-gray-400">{prop.sqm} m²</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};