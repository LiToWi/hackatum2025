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

  const [listings, setListings] = useState<Property[] | null>(null)
  const mapElRef = useRef<HTMLDivElement | null>(null)
  const [focusKey, setFocusKey] = useState<number | null>(null)
  const [filterLoading, setFilterLoading] = useState<boolean>(false)
  const [currentPage, setCurrentPage] = useState<number>(0)
  const [pageSize, setPageSize] = useState<number>(20)
  const [lastQuery, setLastQuery] = useState<any | null>(null)

  async function handleComplete(res: any) {
    console.log('Selection result', res)
    try {
      setFilterLoading(true)
      // save the query so Load more can re-issue with page parameter
      setLastQuery(res)
      setCurrentPage(0)
      const r = await fetch('/api/filter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...res, page: 0, size: pageSize }),
      })
      if (!r.ok) throw new Error('Filter service responded with ' + r.status)
      const data = await r.json()
      const results: Property[] = data.results || []
      setListings(results)
      // signal the map to focus on the results
      setFocusKey(Date.now())
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
    } catch (err) {
      console.error('loadMore error', err)
    } finally {
      setFilterLoading(false)
    }
  }

  return (
    <main className="flex flex-col items-center justify-center p-4 gap-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold font-serif">Welcome to <span className="text-gradient-pink-purple">rent2own</span></h1>
        <p className="mt-4 text-lg">
          where every payment brings you home!
        </p>
      </div>
        
      <button 
        onClick={() => setIsPopupOpen(true)}
        className="px-6 py-2 rounded-lg bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white font-medium transition-all"
      >
        Test Popup
      </button>

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
            <MapSection city="Munich" properties={listings || []} focusKey={focusKey ?? undefined} loading={filterLoading} onLoadMore={loadMore} />
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
        onClose={() => setIsPopupOpen(false)}
        title="Get Offer"
        description="Enter your email address and we will contact you!"
        onSubmit={(email) => {
          console.log('Email submitted:', email)
        }}
      />
    </main>
  );
}