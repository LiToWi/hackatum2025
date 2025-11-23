'use client'

import { useEffect, useState } from "react";
import { MapSection } from "../components/MapSection";
import SelectionWizard from "../components/SelectionWizard";
import EmailPopup from '@/components/EmailPopup'
import React, { useRef } from 'react'
import type { Property } from '../types/property'
import InfoSection from "@/components/InfoSection";

export default function HomePage() {
  // Opening splash state
  const [showSplash, setShowSplash] = useState(true)

  // removed server-side crypto usage from client bundle (was causing bundling issues)

  function OpeningSplash() {
    // hide after animation end or on click/escape
    useEffect(() => {
      const t = setTimeout(() => setShowSplash(false), 2200)
      const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setShowSplash(false) }
      window.addEventListener('keydown', onKey)
      return () => { clearTimeout(t); window.removeEventListener('keydown', onKey) }
    }, [])

    if (!showSplash) return null

    return (
      <div className="opening-splash" aria-hidden={!showSplash} onClick={() => setShowSplash(false)}>
        <div className="opening-splash-inner" role="presentation">
          <h2 className="font-serif font-bold text-2xl">rent2own</h2>
          <div className="subtitle">Where every payment brings you home</div>
        </div>
      </div>
    )
  }

  const [showMap, setShowMap] = useState(false)
  const [isPopupOpen, setIsPopupOpen] = useState(false)
  const [offerProperty, setOfferProperty] = useState<Property | null>(null)

  const [listings, setListings] = useState<Property[] | null>(null)
  const mapElRef = useRef<HTMLDivElement | null>(null)
  const [focusKey, setFocusKey] = useState<number | null>(null)
  const [filterLoading, setFilterLoading] = useState<boolean>(false)
  const [currentPage, setCurrentPage] = useState<number>(0)
  const [pageSize, setPageSize] = useState<number>(20)
  const [lastQuery, setLastQuery] = useState<Record<string, unknown> | null>(null)

  async function handleComplete(res: Record<string, unknown>) {
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
      }
      // signal the map to focus on the results
      setFocusKey(Date.now())
      // scroll the page so the map is visible (align map to top of viewport)
      setTimeout(() => {
        try {
          mapElRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
          // attempt a small additional offset in case of sticky headers
          setTimeout(() => { window.scrollBy(0, -24) }, 200)
        } catch {
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
      <OpeningSplash />
      <div className="text-center">
        <h1 className="text-4xl font-bold font-serif">Welcome to <span className='orange'>ren</span><span className='text-gradient-orange-blue'>t2o</span><span className='blue'>wn</span></h1>
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