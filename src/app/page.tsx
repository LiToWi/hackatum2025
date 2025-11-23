'use client'

import { useEffect, useState } from "react";
import { MapSection } from "../components/MapSection";
import SelectionWizard from "../components/SelectionWizard";
import EmailPopup from '@/components/EmailPopup'
import React, { useRef } from 'react'
import type { Property } from '../types/property'

export default function HomePage() {
  // Opening splash state
  const [showSplash, setShowSplash] = useState(true)

  // removed server-side crypto usage from client bundle (was causing bundling issues)

  function OpeningSplash() {
    // hide after animation end or on click/escape
    useEffect(() => {
      const t = setTimeout(() => setShowSplash(false), 3500)
      const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setShowSplash(false) }
      window.addEventListener('keydown', onKey)
      return () => { clearTimeout(t); window.removeEventListener('keydown', onKey) }
    }, [])

    if (!showSplash) return null

    const letters = Array.from('rent2own')

    return (
      <div className="opening-splash" aria-hidden={!showSplash} onClick={() => setShowSplash(false)}>
        <div className="opening-splash-inner" role="presentation">
          <div className="splash-logo" aria-hidden={!showSplash}>
            <div className="splash-letters" aria-hidden>
              {letters.map((ch, i) => (
                <span key={i} className="splash-letter" style={{ animationDelay: `${i * 110}ms` }}>{ch}</span>
              ))}
            </div>

            <div className="splash-sub">Where every payment brings you home</div>

            <div className="splash-burst" aria-hidden>
              {Array.from({ length: 12 }).map((_, i) => (
                <span
                  key={i}
                  className="burst-dot"
                  style={{ animationDelay: `${300 + i * 60}ms`, transform: `rotate(${i * 30}deg) translateY(-8px)` } as React.CSSProperties}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  const [formCompleted, setFormCompleted] = useState(false)
  // only keep setter since the raw userData object is not read locally
  const [, setUserData] = useState<Record<string, unknown> | null>(null)
  const [isPopupOpen, setIsPopupOpen] = useState(false)
  const [offerProperty, setOfferProperty] = useState<Property | null>(null)

  const [listings, setListings] = useState<Property[] | null>(null)
  const mapElRef = useRef<HTMLDivElement | null>(null)
  const [focusKey, setFocusKey] = useState<number | null>(null)
  const [filterLoading, setFilterLoading] = useState<boolean>(false)
  const [currentPage, setCurrentPage] = useState<number>(0)
  const [pageSize] = useState<number>(20)
  const [lastQuery, setLastQuery] = useState<Record<string, unknown> | null>(null)

  async function handleComplete(res: Record<string, unknown>) {
    console.log('Selection result', res)
    try {
      setFilterLoading(true)
      setUserData(res)
      setFormCompleted(true)
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

  if (showSplash) {
    // Render only the splash while it is visible so it doesn't interleave
    // with the regular page content. The OpeningSplash component will
    // call setShowSplash(false) after its animation completes.
    return <OpeningSplash />
  }

  return (
    <div className="min-h-screen flex flex-col font-sans">
      <main className="grow">
        {/* Hero Section */}
        <section className={`relative transition-all duration-700 ${formCompleted ? 'h-[40vh]' : 'min-h-[90vh] py-20'} flex items-center justify-center overflow-hidden`}>

          <div className="relative z-10 max-w-7xl mx-auto px-4 text-center space-y-6 w-full">
            <div className="text-center">
              <h1 className="text-4xl font-bold font-serif">Welcome to <span className='orange'>ren</span><span className='text-gradient-orange-blue'>t2o</span><span className='blue'>wn</span></h1>
            </div>

            {!formCompleted && (
              <div className="max-w-5xl mx-auto mt-10 animate-in slide-in-from-bottom-4 duration-700 fade-in">
                <p className="text-lg text-white mb-10 font-medium max-w-2xl mx-auto leading-relaxed">
                  In three simple steps, we transform you from a renter to an equity owner:
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 text-left">
                  {/* Card 1 */}
                  <div className="group bg-linear-to-br from-gray-900 via-[#0b1220] to-gray-800 backdrop-blur-md p-6 rounded-2xl border border-gray-700 shadow-sm hover:shadow-xl hover:border-orange-500/30 transition-all duration-300 transform hover:-translate-y-1 cursor-default">
                    <div className="w-12 h-12 bg-orange-500/10 text-orange-600 rounded-xl flex items-center justify-center font-bold text-xl mb-4 group-hover:bg-orange-500 group-hover:text-white transition-colors duration-300">1</div>
                    <p className="text-white font-semibold leading-tight text-lg">
                      Enter your preferences in the selection wizard.
                    </p>
                  </div>

                  {/* Card 2 */}
                  <div className="group bg-linear-to-br from-gray-900 via-[#0b1220] to-gray-800 backdrop-blur-md p-6 rounded-2xl border border-gray-700 shadow-sm hover:shadow-xl hover:border-orange-500/30 transition-all duration-300 transform hover:-translate-y-1 cursor-default">
                    <div className="w-12 h-12 bg-orange-500/10 text-orange-600 rounded-xl flex items-center justify-center font-bold text-xl mb-4 group-hover:bg-orange-500 group-hover:text-white transition-colors duration-300">2</div>
                    <p className="text-white font-semibold leading-tight text-lg">
                      Select a property from the interactive map.
                    </p>
                  </div>

                  {/* Card 3 */}
                  <div className="group bg-linear-to-br from-gray-900 via-[#0b1220] to-gray-800 backdrop-blur-md p-6 rounded-2xl border border-gray-700 shadow-sm hover:shadow-xl hover:border-orange-500/30 transition-all duration-300 transform hover:-translate-y-1 cursor-default">
                    <div className="w-12 h-12 bg-orange-500/10 text-orange-600 rounded-xl flex items-center justify-center font-bold text-xl mb-4 group-hover:bg-orange-500 group-hover:text-white transition-colors duration-300">3</div>
                    <p className="text-white font-semibold leading-tight text-lg">
                      Start receiving equity in your home with each payment!
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Content Section: Wizard or Map */}
        <section className="relative z-20 px-4 sm:px-6 lg:px-8 pb-24 -mt-20">
          <div className="max-w-7xl mx-auto">
            {!formCompleted ? (
              <div className="w-full max-w-2xl mx-auto">
                <SelectionWizard
                  onComplete={handleComplete}
                />
              </div>
            ) : (
              <div className="space-y-8 animate-in fade-in duration-700">
                <div className="text-center space-y-2">
                  <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
                    We are matching you with the best options!
                  </h2>
                </div>

                <div data-map-root ref={mapElRef}>
                  <MapSection
                    city="Munich"
                    properties={listings || []}
                    focusKey={focusKey ?? undefined}
                    loading={filterLoading}
                    onLoadMore={loadMore}
                    onRequestOffer={(p) => { setOfferProperty(p); setIsPopupOpen(true) }}
                  />
                </div>

                <div className="flex justify-center pt-8">
                  <button
                    onClick={() => {
                      setFormCompleted(false)
                      setListings(null)
                      setUserData(null)
                    }}
                    className="text-gray-600 hover:text-orange-500 underline underline-offset-4 transition-colors font-medium"
                  >
                    Change my preferences
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>

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
    </div>
  )
}