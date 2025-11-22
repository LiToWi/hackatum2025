import React, { useEffect, useRef, useState } from 'react'
import { Loader2, MapPin as MapPinIcon } from 'lucide-react'

declare global {
  interface Window {
    google: any
  }
}

import type { Property } from '../types/property'

interface MapSectionProps {
  city: string
  properties?: Property[]
  focusKey?: number | undefined
  loading?: boolean
  onLoadMore?: (() => void) | undefined
  onRequestOffer?: (property: Property) => void
}

export const MapSection: React.FC<MapSectionProps> = ({ city, properties = [], focusKey, loading: apiLoading = false, onLoadMore, onRequestOffer }) => {
  const mapRef = useRef<HTMLDivElement | null>(null)
  const googleMapRef = useRef<any | null>(null)
  const [mapLoading, setMapLoading] = useState(true)
  const [activeProperty, setActiveProperty] = useState<Property | null>(null)
  const [mapError, setMapError] = useState<string | null>(null)
  const markersRef = useRef<any[]>([])
  const infoWindowRef = useRef<any | null>(null)
  const closeTimeoutRef = useRef<number | null>(null)
  const [mapReady, setMapReady] = useState<boolean>(false)

  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_API_KEY

    if (!apiKey) {
      console.error('Google Maps API key not found in environment variables')
      setMapError('Configuration error: Map API key not available.')
      setMapLoading(false)
      return
    }

    const loadMapScript = async () => {
      if (window.google?.maps) {
        initMap()
        setMapLoading(false)
        return
      }

      const scriptId = 'google-maps-script'
      if (document.getElementById(scriptId)) {
        const script = document.getElementById(scriptId) as HTMLScriptElement
        script.addEventListener('load', () => {
          initMap()
          setMapLoading(false)
        })
        return
      }

      try {
        const script = document.createElement('script')
        script.id = scriptId
        script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`
        script.async = true
        script.defer = true

        const loadPromise = new Promise<void>((resolve, reject) => {
          script.onload = () => resolve()
          script.onerror = (e) => reject(e)
        })

        document.head.appendChild(script)

        await loadPromise
        initMap()
        setMapLoading(false)
      } catch (error) {
        console.error('Error loading Google Maps:', error)
        setMapError('Failed to load interactive map.')
        setMapLoading(false)
      }
    }

    loadMapScript()

    return () => {
      markersRef.current.forEach((m) => m.setMap(null))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const createMarkerIcon = (percentage: number) => {
    // Larger marker with percent text above the house icon
    const width = 120
    const height = 140
    const percentText = `${percentage.toFixed(2)}%`
    const houseX = width / 2 - 22
    const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <text x="${width / 2}" y="22" font-family="Arial, sans-serif" font-size="14" font-weight="700" fill="#111827" text-anchor="middle">${percentText}</text>
  <g transform="translate(${houseX}, 30)">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" fill="#FF6B35" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M9 22V12h6v10" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  </g>
</svg>`

    return 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg)
  }

  const renderMarkers = (map: any, propsToShow: Property[]) => {
    markersRef.current.forEach((m) => m.setMap(null))
    markersRef.current = []
    propsToShow.forEach((property) => {
      const pct = typeof property.studentOwnershipPercentage === 'number'
        ? property.studentOwnershipPercentage
        : (property.equityPercentage ?? 0)

      const iconUrl = createMarkerIcon(Number(pct))

      const marker = new window.google.maps.Marker({
        position: { lat: property.lat, lng: property.lng },
        map,
        title: property.title,
        icon: {
          url: iconUrl,
          // bigger visual size for the larger SVG
          scaledSize: new window.google.maps.Size(96, 112),
          anchor: new window.google.maps.Point(48, 110),
        },
        animation: window.google.maps.Animation.DROP,
      })

      marker.addListener('click', () => setActiveProperty(property))

      // hover -> show richer info window with CTA
      marker.addListener('mouseover', () => {
        try {
          if (!infoWindowRef.current) infoWindowRef.current = new window.google.maps.InfoWindow()

          // clear any pending close
          if (closeTimeoutRef.current) {
            window.clearTimeout(closeTimeoutRef.current)
            closeTimeoutRef.current = null
          }

          const container = document.createElement('div')
          container.style.maxWidth = '320px'
          container.style.padding = '12px'
          container.style.borderRadius = '12px'
          container.style.background = (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches)
            ? '#0f1720'
            : '#6b7280'
          container.style.boxShadow = '0 6px 20px rgba(0,0,0,0.25)'
          container.style.color = (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches)
            ? '#fff'
            : '#f3f4f6'

          const title = document.createElement('div')
          title.style.fontWeight = '700'
          title.style.marginBottom = '6px'
          title.textContent = property.title
          container.appendChild(title)

          const meta = document.createElement('div')
          meta.style.fontSize = '13px'
          meta.style.color = '#e5e7eb'
          meta.textContent = `${property.price} €/mo${property.sqm ? ` • ${property.sqm} m²` : ''}`
          container.appendChild(meta)

          if (property.rooms) {
            const rooms = document.createElement('div')
            rooms.style.fontSize = '13px'
            rooms.style.color = '#6b7280'
            rooms.textContent = `${property.rooms} rooms`
            container.appendChild(rooms)
          }

          const footer = document.createElement('div')
          footer.style.display = 'flex'
          footer.style.justifyContent = 'flex-end'
          footer.style.marginTop = '10px'

          const cta = document.createElement('button')
          cta.textContent = 'Interested? Get an offer'
          cta.style.border = 'none'
          cta.style.padding = '8px 10px'
          cta.style.borderRadius = '10px'
          cta.style.cursor = 'pointer'
          cta.style.background = 'linear-gradient(90deg,#ff5fa2,#9b6bff)'
          cta.style.color = '#fff'
          cta.addEventListener('click', (e) => {
            e.stopPropagation()
            try { if (infoWindowRef.current) infoWindowRef.current.close() } catch (err) {}
            if (typeof onRequestOffer === 'function') onRequestOffer(property)
          })

          footer.appendChild(cta)
          container.appendChild(footer)

          // when the mouse enters the info window, keep it open
          container.addEventListener('mouseenter', () => {
            if (closeTimeoutRef.current) {
              window.clearTimeout(closeTimeoutRef.current)
              closeTimeoutRef.current = null
            }
          })
          // when leaving the info window, start close timeout
          container.addEventListener('mouseleave', () => {
            if (closeTimeoutRef.current) window.clearTimeout(closeTimeoutRef.current)
            closeTimeoutRef.current = window.setTimeout(() => {
              try { if (infoWindowRef.current) infoWindowRef.current.close() } catch (e) {}
              closeTimeoutRef.current = null
            }, 350)
          })

          infoWindowRef.current.setContent(container)
          infoWindowRef.current.open(map, marker)
        } catch (err) {
          // ignore any DOM / projection errors
        }
      })

      marker.addListener('mouseout', () => {
        // start a short timeout so users can move cursor to the info window
        if (closeTimeoutRef.current) window.clearTimeout(closeTimeoutRef.current)
        closeTimeoutRef.current = window.setTimeout(() => {
          try { if (infoWindowRef.current) infoWindowRef.current.close() } catch (e) {}
          closeTimeoutRef.current = null
        }, 350)
      })

      markersRef.current.push(marker)
    })
  }

  const initMap = () => {
    if (!mapRef.current || !window.google?.maps) return

    try {
      const map = new window.google.maps.Map(mapRef.current, {
        center: { lat: 48.1351, lng: 11.582 },
        zoom: 13,
        styles: [
          {
            featureType: 'poi',
            elementType: 'labels',
            stylers: [{ visibility: 'off' }],
          },
        ],
        disableDefaultUI: false,
        zoomControl: true,
        mapTypeControl: false,
        streetViewControl: false,
      })

      googleMapRef.current = map
      // create a reusable InfoWindow for hover/details
      try {
        infoWindowRef.current = new window.google.maps.InfoWindow()
      } catch (e) {
        // ignore if InfoWindow can't be constructed yet
      }
      renderMarkers(map, properties || [])
      setMapReady(true)
    } catch (e) {
      console.error('Error initializing map:', e)
      setMapError('Could not initialize Google Maps.')
    }
  }

  useEffect(() => {
    if (!googleMapRef.current) return
    renderMarkers(googleMapRef.current, properties || [])
  }, [properties])

  // Pan/zoom to first property when focus is requested and map is ready
  useEffect(() => {
    if (!mapReady) return
    if (!properties || properties.length === 0) return
    const first = properties[0]
    try {
      googleMapRef.current.panTo({ lat: first.lat, lng: first.lng })
      googleMapRef.current.setZoom(15)
    } catch (e) {
      // ignore
    }
  }, [mapReady, properties, focusKey])

  return (
    <div className="w-full h-[600px] relative rounded-2xl overflow-hidden shadow-2xl border border-gray-200 dark:border-gray-800 bg-gray-100 dark:bg-gray-900">
      {mapLoading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-white dark:bg-dark z-10">
          <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
          <p className="text-gray-500 font-medium animate-pulse">Loading map...</p>
        </div>
      )}

      {apiLoading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/70 dark:bg-black/60 z-40">
          <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
          <p className="text-gray-700 dark:text-gray-200 font-medium animate-pulse">Loading results...</p>
        </div>
      )}

      <div ref={mapRef} className="w-full h-full" />

      {/* Load more button overlay */}
      {/* Load more button overlay: parent controls pagination via onLoadMore */}
      {onLoadMore && (
        <div className="absolute right-6 bottom-6 z-50 pointer-events-auto">
          <button
            onClick={() => onLoadMore()}
            className="px-5 py-3 bg-pink-600 text-white text-sm rounded-xl shadow-lg border border-pink-700 hover:bg-pink-500 focus:outline-none focus:ring-2 focus:ring-pink-300"
          >
            Load more
          </button>
        </div>
      )}

  {(!mapLoading && mapError) && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-800 text-center p-8">
          <div className="w-16 h-16 bg-gray-200 dark:bg-dark-card rounded-full flex items-center justify-center mb-4">
            <MapPinIcon size={32} className="text-gray-400" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Map Unavailable</h3>
          <p className="text-gray-500 max-w-md mb-6">{mapError}</p>

          {properties && properties.length ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-2xl">
              {properties.slice(0, 2).map((prop) => (
                <div key={prop.id} className="bg-white dark:bg-dark-card p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 flex justify-between items-center">
                  <div>
                    <div className="font-bold dark:text-white">{prop.title}</div>
                    <div className="text-sm text-gray-500">{prop.price} €/mo</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-blue-600">{prop.equityPercentage}%</div>
                    <div className="text-xs text-gray-400">{prop.sqm} m²</div>
                  </div>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      )}
    </div>
  )
}