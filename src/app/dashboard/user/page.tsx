/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import React, { useEffect, useState } from 'react'
import ApartmentCard from '@/components/ApartmentCard'

type Property = {
    id?: string
    title?: string
    imageUrl?: string
    price?: number
    [k: string]: unknown
}

export default function UserDashboardPage() {
    const [properties, setProperties] = useState<Property[] | null>(null)

    useEffect(() => {
        let mounted = true
        ;(async () => {
            try {
                const res = await fetch('/api/user/properties')
                if (!res.ok) return setProperties([])
                const json = await res.json()
                if (mounted) setProperties(json.properties || [])
            } catch (e) {
                console.error(e)
                if (mounted) setProperties([])
            }
        })()
        return () => {
            mounted = false
        }
    }, [])

    // development mock for LiToWi's apartment — shown when the real API returns no properties
    const devMockLiToWi = {
        id: 'p_litowi_1',
        title: 'LiToWi — Sunny 2-room apartment',
        imageUrl: 'https://hauteliving.com/wp-content/uploads/2015/09/Screen-Shot-2015-09-24-at-5.19.40-PM.png',
        price: 420000,
        purchasePrice: 350000,
        sqm: 55,
        rooms: 2,
        ownershipStart: new Date(Date.now() - 1000 * 60 * 60 * 24 * 365 * 2).toISOString(), // owned ~2 years
        percentOwned: 10,
        percentGainPerYear: 2.1,
        annualRent: 12000,
        neighborhood: 'Central District',
        terrace: true,
        balcony: true,
        parking: false,
        yearBuilt: 1995,
    }

    // Always show the dev mock first, then any fetched properties below it.
    const fetched = properties ?? []
    // if a fetched property duplicates the mock id, avoid rendering twice
    const merged = [devMockLiToWi, ...fetched.filter((p) => (p as any).id !== devMockLiToWi.id)]

    return (
        <div>
            <h1 className="text-2xl font-semibold">My Properties</h1>

            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                {merged.map((p, idx) => (
                    <ApartmentCard key={(p as any).id || idx} property={p as unknown as any} />
                ))}
            </div>

            {properties === null ? (
                <div className="text-sm text-gray-500 mt-3">Loading additional properties…</div>
            ) : null}
        </div>
    )
}