'use client'

import { useEffect, useState } from "react";
import { useParty } from "../contexts/PartyContext";
import { MapSection } from "../components/MapSection";
import SelectionWizard from "../components/SelectionWizard";
import InfoSection from "@/components/InfoSection";
import EmailPopup from '@/components/EmailPopup'
import React, { useRef } from 'react'
import type { Property } from '../types/property'

export default function HomePage() {
  const { currentTable, currentParty, partyName } = useParty();

  useEffect(() => {
    console.log("Current Party Info:", {
      currentTable,
      currentParty,
      partyName
    });
  }, [currentTable, currentParty, partyName]);

  const [showMap, setShowMap] = useState(false)
  const [isPopupOpen, setIsPopupOpen] = useState(false)
  const [offerProperty, setOfferProperty] = useState<Property | null>(null)

  const [listings, setListings] = useState<Property[] | null>(null)
  const mapElRef = useRef<HTMLDivElement | null>(null)
  const [focusKey, setFocusKey] = useState<number | null>(null)
  const [filterLoading, setFilterLoading] = useState<boolean>(false)
  const [currentPage, setCurrentPage] = useState<number>(0)
  const [pageSize, setPageSize] = useState<number>(20)
  const [lastQuery, setLastQuery] = useState<any | null>(null)

  // Mock properties (temporary fallback while API is unavailable)
  const MOCK_PROPERTIES: Property[] = [
    {
      id: 'mock-1',
      title: 'Sunny 1BR near Marienplatz',
      lat: 48.1371,
      lng: 11.5754,
      price: 850,
      sqm: 35,
      equityPercentage: 5,
      studentOwnershipPercentage: 2,
      rooms: 2,
    },
    {
      id: 'mock-2',
      title: 'Cozy 2BR Schwabing',
      lat: 48.1500,
      lng: 11.5800,
      price: 1120,
      sqm: 48,
      equityPercentage: 6,
      studentOwnershipPercentage: 3,
      rooms: 3,
    },
    {
      id: 'mock-3',
      title: 'Bright studio near Ludwigstrasse',
      lat: 48.1440,
      lng: 11.5700,
      price: 690,
      sqm: 28,
      equityPercentage: 4,
      studentOwnershipPercentage: 1.5,
      rooms: 1,
    },
    {
      id: 'mock-4',
      title: 'Large 3BR apartment',
      lat: 48.1300,
      lng: 11.5900,
      price: 1450,
      sqm: 78,
      equityPercentage: 7,
      studentOwnershipPercentage: 0.5,
      rooms: 4,
    },
  ]

  async function handleComplete(res: any) {
    console.log('Selection result', res)
    try {
      setFilterLoading(true)
      // save the query so Load more can re-issue with page parameter
      setLastQuery(res)
      setCurrentPage(0)
      // Call the real filter API; if it fails, fall back to MOCK_PROPERTIES.
      try {
        const r = await fetch('/api/filter', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...res, page: 0, size: pageSize }),
        })
        if (!r.ok) throw new Error('Filter service responded with ' + r.status)
        const data = await r.json()
        const results: Property[] = data.results || []
        setListings(results)
      } catch (fetchErr) {
        console.warn('Filter API failed, falling back to MOCK_PROPERTIES', fetchErr)
        setListings(MOCK_PROPERTIES)
      }
      // signal the map to focus on the results
      setFocusKey(Date.now())
      // scroll the page so the map is visible (align map to top of viewport)
      setTimeout(() => {
        try {
          mapElRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
          // attempt a small additional offset in case of sticky headers
          setTimeout(() => { window.scrollBy(0, -24) }, 200)
        } catch (e) {
          // ignore
        }
      }, 300)
      setFilterLoading(false)
    } catch (err) {
      console.error('filter error', err)
      // If the filter API isn't available, set an empty list so the map clears markers
      setListings([])
      setFilterLoading(false)
    }
  }

  async function loadMore() {
    // request the next page from the server and replace current listings
    if (!lastQuery) return
    const next = currentPage + 1
    try {
      setFilterLoading(true)
      // Call the real filter API for pagination; fall back to mocks on error.
      try {
        const r = await fetch('/api/filter', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...lastQuery, page: next, size: pageSize }),
        })
        if (!r.ok) throw new Error('Filter service responded with ' + r.status)
        const data = await r.json()
        const results: Property[] = data.results || []
        setListings(results)
        setCurrentPage(next)
        setFocusKey(Date.now())
      } catch (fetchErr) {
        console.warn('Load more API failed, falling back to MOCK_PROPERTIES', fetchErr)
        setListings(MOCK_PROPERTIES)
        setCurrentPage(next)
        setFocusKey(Date.now())
      }
    } catch (err) {
      console.error('loadMore error', err)
    } finally {
      setFilterLoading(false)
    }
  }

  return (
    <main className="flex flex-col items-center justify-center p-4 gap-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold font-serif">Welcome to <span className='orange'>ren</span><span className='text-gradient-orange-purple'>t2o</span><span className='blue'>wn</span></h1>
        <p className="mt-4 text-lg">
          where every payment brings you home!
        </p>
      </div>
        
      

      <div className="w-full max-w-2xl flex flex-col gap-6">
        <SelectionWizard
          onComplete={async (res) => {
            console.log('Selection result', res)
            // fetch listings for the map, then show the map
            await handleComplete(res)
            setShowMap(true)
          }}
          onBack={() => setShowMap(false)}
          exitOnBack={showMap}
        />
      </div>

      <div className="w-full max-w-6xl">
        <div data-map-root>
          {showMap ? (
            <MapSection
              city="Munich"
              properties={listings || []}
              focusKey={focusKey ?? undefined}
              loading={filterLoading}
              onLoadMore={loadMore}
              onRequestOffer={(p) => { setOfferProperty(p); setIsPopupOpen(true) }}
            />
          ) : (
            <InfoSection
              title="Find matching properties"
              description="Complete the wizard to filter properties — when you finish the map will appear. Click Back to return to this information view."
            />
          )}
        </div>
      </div>

      <EmailPopup
        isOpen={isPopupOpen}
        onClose={() => { setIsPopupOpen(false); setOfferProperty(null) }}
        title="Get Offer"
        description={offerProperty ? `Request an offer for ${offerProperty.title}` : 'Enter your email address and we will contact you!'}
        onSubmit={(email) => {
          console.log('Email submitted:', email, 'for', offerProperty)
          setOfferProperty(null)
        }}
      />
    </main>
  );
}