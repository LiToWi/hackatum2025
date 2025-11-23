/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
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
  const [mapReady, setMapReady] = useState<boolean>(false)
  const infoWindowRef = useRef<any | null>(null)
  const closeTimeoutRef = useRef<number | null>(null)
  const domReadyListenerRef = useRef<any | null>(null)

  const clearCloseTimeout = () => {
    if (closeTimeoutRef.current) {
      window.clearTimeout(closeTimeoutRef.current)
      closeTimeoutRef.current = null
    }
  }

  const startCloseTimeout = (delay = 350) => {
    clearCloseTimeout()
    // store numeric id from window.setTimeout
    // TypeScript in browser returns number
    closeTimeoutRef.current = window.setTimeout(() => {
      try { infoWindowRef.current?.close() } catch (e) {}
      closeTimeoutRef.current = null
    }, delay) as unknown as number
  }

  const showInfoWindow = (marker: any, property: Property) => {
    try {
      if (!infoWindowRef.current) infoWindowRef.current = new window.google.maps.InfoWindow({ maxWidth: 300 })

      const container = document.createElement('div')
      container.style.padding = '8px'
      container.style.maxWidth = '260px'

      const title = document.createElement('div')
      title.style.fontWeight = '700'
      title.style.marginBottom = '6px'
      // make the title use the same dark color as the rent/meta text
      title.style.color = '#111827'
      title.textContent = property.title

      const meta = document.createElement('div')
      // keep rent/meta dark to match title
      meta.style.color = '#111827'
      meta.style.marginBottom = '8px'
      meta.textContent = `${property.price} €/mo • ${property.sqm} m²`
      if (typeof property.idealEdge === 'number') {
        const edgeLine = document.createElement('div')
        edgeLine.style.color = '#374151'
        edgeLine.style.fontSize = '12px'
        edgeLine.textContent = `Ideal edge: ${property.idealEdge.toFixed(3)}`
        meta.appendChild(edgeLine)
      }
      if (typeof property.ownerProfit === 'number') {
        const profitLine = document.createElement('div')
        profitLine.style.color = '#374151'
        profitLine.style.fontSize = '12px'
        profitLine.textContent = `Owner profit: ${property.ownerProfit.toFixed(0)} €`
        meta.appendChild(profitLine)
      }

      const btn = document.createElement('button')
      btn.textContent = 'Interested? Get an offer'
      btn.className = 'px-3 py-2 rounded-md text-sm'
      // solid orange background to match theme
      btn.style.background = '#D67F31'
      btn.style.border = 'none'
      btn.style.color = '#ffffff'
      btn.style.fontWeight = '600'
      btn.style.cursor = 'pointer'
      btn.style.boxShadow = '0 4px 10px rgba(0,0,0,0.12)'
      btn.onclick = (e) => { e.stopPropagation(); if (onRequestOffer) onRequestOffer(property) }
      // subtle hover effect
      btn.addEventListener('mouseenter', () => { btn.style.filter = 'brightness(0.95)' })
      btn.addEventListener('mouseleave', () => { btn.style.filter = 'none' })

      container.appendChild(title)
      container.appendChild(meta)
      container.appendChild(btn)

      // ensure previous domready listener does not leak
      try { if (domReadyListenerRef.current && infoWindowRef.current) { window.google.maps.event.removeListener(domReadyListenerRef.current); domReadyListenerRef.current = null } } catch (e) {}

      infoWindowRef.current.setContent(container)
      infoWindowRef.current.open(googleMapRef.current, marker)
      clearCloseTimeout()

      // Attach domready once to wire mouseenter/mouseleave on the visible wrapper
      domReadyListenerRef.current = window.google.maps.event.addListenerOnce(infoWindowRef.current, 'domready', () => {
        try {
          // Google creates a wrapper element for the InfoWindow content with class 'gm-style-iw'
          // Find the closest such element and attach listeners so it stays open while hovered.
          const wrappers = document.getElementsByClassName('gm-style-iw')
          if (wrappers && wrappers.length) {
            const wrapper = wrappers[wrappers.length - 1] as HTMLElement
            wrapper.style.pointerEvents = 'auto'
            wrapper.addEventListener('mouseenter', () => clearCloseTimeout())
            wrapper.addEventListener('mouseleave', () => startCloseTimeout(250))
          }
        } catch (e) {
          // ignore DOM errors
        }
      })
    } catch (e) {
      // fail silently
    }
  }

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
    if (!propsToShow || propsToShow.length === 0) return

    // Build simple spatial clusters by bucketing lat/lng to avoid stacked markers.
    const buckets: Record<string, Property[]> = {}
    const bucketSizeDeg = 0.0005 // ~55m; fine for city-level grouping
    for (const p of propsToShow) {
      const keyLat = Math.round(p.lat / bucketSizeDeg)
      const keyLng = Math.round(p.lng / bucketSizeDeg)
      const key = `${keyLat}:${keyLng}`
      buckets[key] = buckets[key] || []
      buckets[key].push(p)
    }

    // For each bucket, if multiple properties exist, distribute them radially around
    // their original locations so their percentage labels don't overlap.
    for (const key of Object.keys(buckets)) {
      const arr = buckets[key]
      if (arr.length === 1) {
        const property = arr[0]
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
            scaledSize: new window.google.maps.Size(96, 112),
            anchor: new window.google.maps.Point(48, 110),
          },
          animation: window.google.maps.Animation.DROP,
        })
        marker.addListener('click', () => setActiveProperty(property))
        marker.addListener('mouseover', () => { try { showInfoWindow(marker, property) } catch (e) {} })
        marker.addListener('mouseout', () => { startCloseTimeout(250) })
        markersRef.current.push(marker)
        continue
      }

      // Cluster has multiple properties — spread them around cluster centroid.
      // Compute centroid
      let sumLat = 0
      let sumLng = 0
      for (const p of arr) { sumLat += p.lat; sumLng += p.lng }
      const centerLat = sumLat / arr.length
      const centerLng = sumLng / arr.length

      // radial separation in meters
      const radiusMeters = 12
      const metersToDegLat = (m: number) => m / 111320
      for (let i = 0; i < arr.length; i++) {
        const property = arr[i]
        const angle = (2 * Math.PI * i) / arr.length
        const dLat = Math.cos(angle) * metersToDegLat(radiusMeters)
        // longitude degrees depend on latitude
        const latRad = (centerLat * Math.PI) / 180
        const metersToDegLng = (m: number) => m / (111320 * Math.cos(latRad))
        const dLng = Math.sin(angle) * metersToDegLng(radiusMeters)

        const placedLat = property.lat + dLat
        const placedLng = property.lng + dLng

        const pct = typeof property.studentOwnershipPercentage === 'number'
          ? property.studentOwnershipPercentage
          : (property.equityPercentage ?? 0)
        const iconUrl = createMarkerIcon(Number(pct))

        const marker = new window.google.maps.Marker({
          position: { lat: placedLat, lng: placedLng },
          map,
          title: property.title,
          icon: {
            url: iconUrl,
            scaledSize: new window.google.maps.Size(96, 112),
            anchor: new window.google.maps.Point(48, 110),
          },
          animation: window.google.maps.Animation.DROP,
        })

        marker.addListener('click', () => setActiveProperty(property))
        marker.addListener('mouseover', () => { try { showInfoWindow(marker, property) } catch (e) {} })
        marker.addListener('mouseout', () => { startCloseTimeout(250) })
        markersRef.current.push(marker)
      }
    }
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
      infoWindowRef.current = new window.google.maps.InfoWindow({ maxWidth: 300 })
      renderMarkers(map, properties || [])
      setMapReady(true)
    } catch (e) {
      console.error('Error initializing map:', e)
      setMapError('Could not initialize Google Maps.')
    }
  }

  // Call renderMarkers when properties change. Include renderMarkers in
  // the dependency list so linting doesn't require a suppression.
  useEffect(() => {
    if (!googleMapRef.current) return
    renderMarkers(googleMapRef.current, properties || [])
  }, [properties, renderMarkers])

  // Pan/zoom to first property when focus is requested and map is ready
  useEffect(() => {
    if (!mapReady) return
    if (!properties || properties.length === 0) return
    // Find the largest cluster and pan to its centroid
    const bucketSizeDeg = 0.0005
    const buckets: Record<string, Property[]> = {}
    for (const p of properties) {
      const keyLat = Math.round(p.lat / bucketSizeDeg)
      const keyLng = Math.round(p.lng / bucketSizeDeg)
      const key = `${keyLat}:${keyLng}`
      buckets[key] = buckets[key] || []
      buckets[key].push(p)
    }

    let bestKey: string | null = null
    let bestSize = 0
    for (const k of Object.keys(buckets)) {
      if (buckets[k].length > bestSize) {
        bestSize = buckets[k].length
        bestKey = k
      }
    }

    if (!bestKey) return
    const cluster = buckets[bestKey]
    let sumLat = 0
    let sumLng = 0
    for (const p of cluster) { sumLat += p.lat; sumLng += p.lng }
    const centroidLat = sumLat / cluster.length
    const centroidLng = sumLng / cluster.length

    try {
      console.log('[MapSection] focusing cluster', { key: bestKey, size: cluster.length, centroidLat, centroidLng })
      googleMapRef.current.panTo({ lat: centroidLat, lng: centroidLng })
      googleMapRef.current.setZoom(14)
    } catch (e) {
      try { googleMapRef.current.setCenter({ lat: centroidLat, lng: centroidLng }) } catch (e2) {}
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
            className="px-5 py-3 bg-[#D67F31] text-white text-sm rounded-xl shadow-lg border border-[#D67F31] hover:bg-[#bf6f2c] focus:outline-none focus:ring-2 focus:ring-[#D67F31] cursor-pointer"
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