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

    return (
        <div>
            <h1 className="text-2xl font-semibold">My Properties</h1>
                {properties === null ? (
                    <div>Loading…</div>
                ) : properties.length === 0 ? (
                    <div className="text-gray-400 mt-4">You do not own any properties yet.</div>
                ) : (
                    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                        {properties.map((p) => (
                            <ApartmentCard key={(p as any).id || (p as any)._id || JSON.stringify(p)} property={p as unknown as any} />
                        ))}
                    </div>
                )}
        </div>
    )
}