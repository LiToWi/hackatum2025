/*
	Simple script to query ThinkImmo directly for München and return a
	compact list of fields: rentPrice, rooms, squareMeter.

	Usage (from repo root):
		# safe single-page test
		SIZE=1 PAGES=1 node -r ts-node/register scripts/filter.ts

		# fetch 5 pages of 100 items
		SIZE=100 PAGES=5 node -r ts-node/register scripts/filter.ts

	The script uses global `fetch` (Node 18+). It transliterates German
	umlauts when forming the geoSearchQuery (München -> Muenchen).
*/

const THINKIMMO_ENDPOINT = 'https://thinkimmo-api.mgraetz.de/thinkimmo'

function sleep(ms: number) {
	return new Promise((r) => setTimeout(r, ms))
}

async function fetchPage(payload: any, retries = 0): Promise<any> {
	try {
		const res = await fetch(THINKIMMO_ENDPOINT, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(payload),
		})

		if (res.status === 429) {
			const wait = Math.min(30000, 1000 * 2 ** retries)
			console.warn(`Rate limited (429). Backing off ${wait}ms`)
			await sleep(wait)
			return fetchPage(payload, retries + 1)
		}

		if (!res.ok) {
			const text = await res.text()
			throw new Error(`HTTP ${res.status}: ${text}`)
		}

		return res.json()
	} catch (err) {
		if (retries < 5) {
			const wait = Math.min(30000, 1000 * 2 ** retries)
			console.warn('Fetch failed, retrying after', wait, err)
			await sleep(wait)
			return fetchPage(payload, retries + 1)
		}
		throw err
	}
}

import { simulateEdge, findOptimalEdge } from '../src/lib/calc'


export async function fetchMunichRentRoomsSqm(options?: { size?: number; pages?: number; startFrom?: number }) {
	const size = options?.size ?? (process.env.SIZE ? Number(process.env.SIZE) : 100)
	const pages = options?.pages ?? (process.env.PAGES ? Number(process.env.PAGES) : 1)
	// startFrom allows fetching a specific offset for pagination (default 0)
	const startFrom = options?.startFrom ?? 0

	const GEO = "München"

	let from = startFrom
	let page = 0
	const out: Array<any> = []

	while (page < pages) {
		const payload: any = {
			active: true,
			sortBy: 'desc',
			sortKey: 'pricePerSqm',
			from,
			size,
			geoSearches: {
				geoSearchQuery: GEO,
				geoSearchType: 'city',
			},
		}

		const data = await fetchPage(payload)
		const results = Array.isArray(data.results) ? data.results : []

		if (!results.length) break

		for (const l of results) {
			out.push({
				id: l.id ?? null,
				title: l.title ?? null,
				rentPrice: l.rentPrice ?? l.rent ?? l.price ?? null,
				rooms: l.rooms ?? null,
				squareMeter: l.squareMeter ?? l.size ?? null,
				zip: l.zip ?? null,
				address: l.address ?? null,
				buyingPrice: l.buyingPrice ?? l.priceBuying ?? null,
				pricePerSqm: l.pricePerSqm ?? l.pricePerMeter ?? null,
			})
		}

		page++
		from += results.length

		// small delay to be gentle on the API
		await sleep(200)
	}

	return out
}

/* EXAMPLE
async function run() {
  // Adjust size/pages as needed to cover enough listings
  const listings = await fetchMunichRentRoomsSqm({ size: 100, pages: 5 })

  // Filter roughly 100 m²
  const filtered = listings
    .filter(l => typeof l.squareMeter === 'number' && l.squareMeter >= 95 && l.squareMeter <= 105)
    .sort((a, b) => (a.pricePerSqm ?? Infinity) - (b.pricePerSqm ?? Infinity))

  const top = filtered.slice(0, 20) // show top 20 cheapest per m²

  for (const l of top) {
    // Skip listings that don't have required numeric fields
    if (typeof l.buyingPrice !== 'number' || typeof l.rentPrice !== 'number') {
      console.log('skipping (missing price/rent)', l.id)
      continue
    }

    const opt = findOptimalEdge({
      purchasePrice: l.buyingPrice,
      startRentPerMonth: l.rentPrice,
      rentingPeriodMonths: 36,         // change this to the student's planned months
      targetOwnerAnnualYield: 0.07,    // target ~7% owner yield
      // optional params you can tune:
      // marketGrowth: 1.065,
      // inflationRate: 0.018,
      // numberOfRoommates: 1,
      // projectionYears: 5,
    })

    console.log({
      id: l.id,
      title: l.title,
      sqm: l.squareMeter,
      pricePerSqm: l.pricePerSqm,
      rentPerMonth: l.rentPrice,
      optimalEdge: opt?.edge ?? null,
      ownerProfitEUR: opt?.profit ?? null,
      ownerYieldPerYear: opt?.studentenwerkProfitPerYear ? (opt.studentenwerkProfitPerYear / (l.buyingPrice || 1)) : null,
      studentOwnershipPercent: opt?.studentOwnershipPercentage ?? null,
    })
  }
}
*/