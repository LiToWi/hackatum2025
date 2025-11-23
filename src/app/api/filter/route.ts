/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server'
import { fetchMunichRentRoomsSqm } from '../../../../scripts/filter'
import { findOptimalEdge, simulateEdge } from '../../../../src/lib/calc'
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

function toNumber(v: any): number | null {
  if (typeof v === 'number' && !Number.isNaN(v)) return v
  if (typeof v === 'string' && v.length) {
    // remove common non-numeric characters, allow comma as decimal
    const cleaned = v.replace(/€/g, '').replace(/\s/g, '').replace(',', '.')
    const m = cleaned.match(/-?\d+(?:\.\d+)?/)
    if (!m) return null
    const n = Number(m[0])
    return Number.isNaN(n) ? null : n
  }
  return null
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

  // collect a variety of possible source fields from upstream
  const rawSquare = toNumber(l.squareMeter) ?? toNumber(l.size) ?? toNumber(l.sqm) ?? toNumber(l.livingSpace) ?? null
  const rawBuying = toNumber(l.buyingPrice) ?? toNumber(l.priceBuying) ?? toNumber(l.buying_price) ?? toNumber(l.aggregations?.location?.buyingPrice) ?? null
  const rawPricePerSqm = toNumber(l.pricePerSqm) ?? toNumber(l.pricePerMeter) ?? toNumber(l.spPricePerSqm) ?? toNumber(l.aggregations?.location?.pricePerSqm) ?? null
  // rent may be provided directly or as per-sqm estimate
  let rawRent = toNumber(l.rentPrice) ?? toNumber(l.rent) ?? toNumber(l.price) ?? toNumber(l.rentPriceCurrent) ?? null
  // if rent missing but rentPricePerSqm exists and sqm available, compute rent
  const rentPerSqm = toNumber(l.rentPricePerSqm) ?? toNumber(l.rentPriceCurrentPerSqm) ?? null
  // final canonical values
  const buying = rawBuying
  let sqmVal: number | null = rawSquare
  const pricePerSqm = rawPricePerSqm
  // compute rent if needed
  if ((rawRent == null || rawRent === 0) && rentPerSqm && sqmVal) {
    rawRent = Math.round(rentPerSqm * sqmVal)
  }
  const rent = rawRent ?? 0
  // sqmVal already initialized above from possible raw fields

      let equityPercentage = 0
      let studentOwnershipPercentage: number | undefined = undefined
      // prepare optional calculation outputs
      let idealEdge: number | undefined = undefined
      let ownerProfit: number | undefined = undefined
      let studentProfit: number | undefined = undefined
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
          // expose ideal edge and owner profit
          idealEdge = opt?.edge
          ownerProfit = opt?.profit
          // compute student profit for the chosen edge (if available)
            if (typeof idealEdge === 'number') {
            try {
              const sim = simulateEdge(idealEdge, {
                purchasePrice: buying,
                startRentPerMonth: rent,
                rentingPeriodMonths: rentingMonths,
              })
              studentProfit = sim?.profit
            } catch {
              // ignore simulation errors
            }
          }
        }
      // debug: if values are missing, log the raw listing for inspection
        if ((!rent || rent === 0) || (rawSquare == null && toNumber(l.size) == null)) {
        console.log('[filter] parse missing numeric fields for listing:', {
          id: l.id ?? l._id,
          rentRaw: l.rentPrice ?? l.rent ?? l.price,
          squareRaw: l.squareMeter ?? l.size,
        })
        // Dump the raw listing object to inspect unexpected shapes
  try { console.log('[filter] raw listing dump:', JSON.stringify(l)) } catch { console.log('[filter] raw listing (non-serializable)', l) }
      }
      // fallback: if sqm missing but buying price and pricePerSqm available, estimate sqm
      if ((sqmVal == null) && buying && pricePerSqm) {
        try {
          const estimated = Math.round(buying / pricePerSqm)
            if (Number.isFinite(estimated) && estimated > 0) {
            sqmVal = estimated
            console.log('[filter] estimated sqm from buying/pricePerSqm', { id: l.id ?? l._id, estimated })
          }
        } catch {
          // ignore
        }
      }
      } catch (err) {
        // swallow a calculation failure and continue (log error for diagnostics)
        console.warn('calc failed for listing', l.id, err)
      }

        out.push({
        id: l.id ?? l._id ?? `${coords.lat}-${coords.lng}`,
        lat: coords.lat as number,
        lng: coords.lng as number,
        title: l.title ?? l.address ?? 'Listing',
        price: typeof rent === 'number' ? rent : 0,
        sqm: sqmVal ?? null,
        rooms: toNumber(l.rooms) ?? null,
        equityPercentage,
        studentOwnershipPercentage,
        idealEdge: typeof idealEdge === 'number' ? idealEdge : undefined,
        ownerProfit: typeof ownerProfit === 'number' ? ownerProfit : undefined,
        studentProfit: typeof studentProfit === 'number' ? studentProfit : undefined,
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
