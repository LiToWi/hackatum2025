/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server'
import { fetchMunichRentRoomsSqm } from '../../../../scripts/filter'
import { findOptimalEdge } from '../../../../src/lib/calc'
import type { Property } from '../../../../src/types/property'

function pickCoord(listing: any): { lat?: number; lng?: number } {
  // Try several common field names that the upstream API might use
  const lat =
    listing.latitude ?? listing.lat ?? listing.location?.lat ?? listing.geo?.lat ?? listing.geoLocation?.lat ?? listing.address?.lat ?? listing.address?.latitude ?? listing.coordinates?.[1]
  const lng =
    listing.longitude ?? listing.lng ?? listing.location?.lng ?? listing.geo?.lng ?? listing.geoLocation?.lon ?? listing.address?.lon ?? listing.address?.lon ?? listing.address?.longitude ?? listing.coordinates?.[0]

  if (typeof lat === 'string' && lat.length) {
    const n = Number(lat.replace(',', '.'))
    if (!Number.isNaN(n)) return { lat: n, lng: typeof lng === 'number' ? lng : Number(lng) }
  }

  if (typeof lat === 'number' && typeof lng === 'number') return { lat, lng }
  return {}
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { rentingMonths } = body || {}

    // Pagination: accept page (0-based) and size; fetch a single page by default
    const page = typeof body?.page === 'number' ? Math.max(0, Math.floor(body.page)) : 0
    const size = body?.size ?? (process.env.FILTER_SIZE ? Number(process.env.FILTER_SIZE) : 20)

    const raw = await fetchMunichRentRoomsSqm({ size, pages: 1, startFrom: page * size })

    const out: Property[] = []

    for (const l of raw) {
      const coords = pickCoord(l)
      if (typeof coords.lat !== 'number' || typeof coords.lng !== 'number') {
        // Skip listings without coordinates (could be geocoded later)
        continue
      }

      const rent = typeof l.rentPrice === 'number' ? l.rentPrice : (typeof l.rent === 'number' ? l.rent : (typeof l.price === 'number' ? l.price : 0))
      const buying = typeof l.buyingPrice === 'number' ? l.buyingPrice : (typeof l.buying_price === 'number' ? l.buying_price : null)

      let equityPercentage = 0
      let studentOwnershipPercentage: number | undefined = undefined
      try {
        if (buying && rent && typeof rentingMonths === 'number' && rentingMonths > 0) {
          const opt = findOptimalEdge({
            purchasePrice: buying,
            startRentPerMonth: rent,
            rentingPeriodMonths: rentingMonths,
            targetOwnerAnnualYield: 0.07,
          })
          equityPercentage = Math.round(opt?.studentOwnershipPercentage ?? 0)
          // keep precise value too
          studentOwnershipPercentage = opt?.studentOwnershipPercentage ?? undefined
        }
      } catch (e) {
        // swallow a calculation failure and continue
        console.warn('calc failed for listing', l.id, e)
      }

      out.push({
        id: l.id ?? l._id ?? `${coords.lat}-${coords.lng}`,
        lat: coords.lat as number,
        lng: coords.lng as number,
        title: l.title ?? l.address ?? 'Listing',
        price: rent ?? 0,
        sqm: typeof l.squareMeter === 'number' ? l.squareMeter : (typeof l.size === 'number' ? l.size : null),
        rooms: typeof l.rooms === 'number' ? l.rooms : null,
        equityPercentage,
        studentOwnershipPercentage,
      })
    }

  console.log('[filter] returning', out.length, 'results')
  if (out.length > 0) console.log('[filter] first:', out[0].id, out[0].lat, out[0].lng)
  return NextResponse.json({ results: out })
  } catch (err) {
    console.error('filter route error', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
