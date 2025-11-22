"use client"

import React, { useState, useEffect, useRef } from 'react'

export type WizardResult = {
  rentingMonths: number
  hasWg: boolean
  roommates: number
  // monthly rent the user can pay per month
  monthlyRent?: number | null
  zip?: string
  desiredRooms?: number
  // keep a single-factor for backward compatibility (average of bounds)
  locationFactor?: number
  // new bounds for location preference (1-5)
  locationMin?: number
  locationMax?: number
}

export default function SelectionWizard({
  onComplete,
}: {
  onComplete?: (r: WizardResult) => void
}) {
  // Small inline editable card used in the summary to allow quick edits
  const EditableCard: React.FC<{
    label: string
    value: string
    onSave: (v: string) => void
    inputType?: string
  }> = ({ label, value, onSave, inputType = 'text' }) => {
    const [editing, setEditing] = useState(false)
    const [val, setVal] = useState<string>(value)

    useEffect(() => setVal(value), [value])

    return (
      <div className="bg-gray-900 p-3 rounded-lg">
        <div className="text-sm">{label}</div>
        {!editing ? (
          <div className="text-pink-400 font-medium cursor-pointer" onClick={() => setEditing(true)}>{value}</div>
        ) : (
          <div className="mt-2">
            <input
              autoFocus
              className="w-full px-3 py-2 rounded bg-gray-800 border border-gray-700"
              value={val}
              onChange={(e) => setVal(e.target.value)}
              onBlur={() => { onSave(val); setEditing(false) }}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); onSave(val); setEditing(false) } }}
              type={inputType}
            />
          </div>
        )}
      </div>
    )
  }
  const [step, setStep] = useState(0)
  const [rentingMonths, setRentingMonths] = useState<number | ''>('')
  const rentingRef = useRef<HTMLInputElement | null>(null)
  const [hasWg, setHasWg] = useState(false)
  const [roommates, setRoommates] = useState<number | ''>('')
  const [monthlyRent, setMonthlyRent] = useState<number | ''>('')
  const monthlyRentRef = useRef<HTMLInputElement | null>(null)
  const [zip, setZip] = useState('')
  const zipRef = useRef<HTMLInputElement | null>(null)
  const [desiredRooms, setDesiredRooms] = useState<number | ''>('')
  const [locationFactor, setLocationFactor] = useState(3)
  const [locationMin, setLocationMin] = useState<number>(1)
  const [locationMax, setLocationMax] = useState<number>(5)
  // selection for dwelling: 'single' or numeric for WG size (2..6)
  const [dwellingSelection, setDwellingSelection] = useState<'single' | number | null>(null)
  const nextButtonRef = useRef<HTMLButtonElement | null>(null)

  const steps = [
    'Planned stay',
    'Roommates',
    'Monthly rent',
    'ZIP & location',
    'Summary',
  ]

  function next() {
    // Step 0: rentingMonths required
    if (step === 0 && (rentingMonths === '' || Number(rentingMonths) <= 0)) return
    // Step 1: require a dwelling selection (single or WG 2..6)
    if (step === 1) {
      if (dwellingSelection === null) return
    }
    // Step 2: monthly rent required
    if (step === 2 && (monthlyRent === '' || Number(monthlyRent) <= 0)) return

    if (step < steps.length - 1) setStep(step + 1)
    else {
      const avgLocation = (Number(locationMin) + Number(locationMax)) / 2
      const result: WizardResult = {
        rentingMonths: Number(rentingMonths) || 0,
        hasWg,
        roommates: hasWg ? Number(roommates) || 0 : 0,
        monthlyRent: monthlyRent === '' ? null : Number(monthlyRent),
        zip: zip || undefined,
        desiredRooms: desiredRooms === '' ? undefined : Number(desiredRooms),
        locationFactor: avgLocation,
        locationMin,
        locationMax,
      }
      if (onComplete) onComplete(result)
    }
  }

  function back() {
    if (step > 0) setStep(step - 1)
  }

  const totalSteps = steps.length
  function displayStepNumber() {
    return step + 1
  }

  // handle Enter and arrow navigation for WG selection
  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter') { e.preventDefault(); next(); return }
    if (step === 1) {
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        e.preventDefault()
        // build ordered list: single, 2,3,4,5,6
        const order: Array<'single' | number> = ['single', 2, 3, 4, 5, 6]
        const idx = dwellingSelection === null ? 0 : order.indexOf(dwellingSelection)
        const dir = e.key === 'ArrowRight' ? 1 : -1
        let nextIdx = idx + dir
        if (nextIdx < 0) nextIdx = order.length - 1
        if (nextIdx >= order.length) nextIdx = 0
        const nextSel = order[nextIdx]
        setDwellingSelection(nextSel)
        setHasWg(nextSel !== 'single')
        setRoommates(nextSel === 'single' ? 0 : Number(nextSel))
        setDesiredRooms(nextSel === 'single' ? 1 : Number(nextSel))
        // focus the newly selected button if present
        const id = nextSel === 'single' ? 'dwelling-single' : `dwelling-${nextSel}`
        const el = document.getElementById(id) as HTMLButtonElement | null
        if (el) el.focus()
      }
    }
  }

  // focus management: when step changes, put focus on required input or next button if input optional
  // implemented here to keep accessibility keyboard-first
  useEffect(() => {
    // small timeout so DOM nodes are mounted
    const t = setTimeout(() => {
      if (step === 0) {
        rentingRef.current?.focus()
        return
      }
      if (step === 1) {
        // focus selected dwelling or first option
        const id = dwellingSelection === null ? 'dwelling-single' : (dwellingSelection === 'single' ? 'dwelling-single' : `dwelling-${dwellingSelection}`)
        const el = document.getElementById(id) as HTMLElement | null
        if (el) el.focus()
        return
      }
      if (step === 2) {
        monthlyRentRef.current?.focus()
        return
      }
      if (step === 3) {
        // ZIP is optional — focus Next so keyboard users can continue quickly
        if (nextButtonRef.current) nextButtonRef.current.focus()
        else zipRef.current?.focus()
        return
      }
      if (step === 4) {
        if (nextButtonRef.current) nextButtonRef.current.focus()
      }
    }, 50)
    return () => clearTimeout(t)
  }, [step, dwellingSelection])

  return (
  <div tabIndex={0} onKeyDown={onKeyDown} className="w-full max-w-2xl mx-auto bg-linear-to-br from-gray-900 via-[#0b1220] to-gray-800 rounded-2xl p-6 shadow-xl text-white">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-xl font-semibold">Quick Selector</h3>
          <p className="text-sm text-gray-400">Answer a few questions to tailor listings.</p>
        </div>
  <div className="text-sm text-gray-400">Step {displayStepNumber()} / {totalSteps}</div>
      </div>

      <div className="min-h-[140px] flex flex-col justify-center items-stretch">
        {step === 0 && (
          <div className="space-y-3">
            <label className="block text-sm text-gray-300">{steps[0]}</label>
            <input
              type="number"
              min={1}
              value={rentingMonths}
              onChange={(e) => setRentingMonths(e.target.value === '' ? '' : Number(e.target.value))}
              placeholder="Months (e.g. 36)"
              className="w-full px-4 py-3 rounded-lg bg-gray-800 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-pink-500"
              ref={rentingRef}
            />
            <p className="text-xs text-gray-500">How many months do you plan to stay?</p>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4">
            <div className="text-lg font-medium">{steps[1]}</div>
            <div className="grid grid-cols-3 gap-3 mt-3">
              {/* Single apartment card */}
              <button
                type="button"
                onClick={() => {
                  setDwellingSelection('single')
                  setHasWg(false)
                  setRoommates(0)
                  setDesiredRooms(1)
                }}
                id="dwelling-single"
                className={`p-4 rounded-lg text-left border transition-transform duration-150 ease-in-out hover:scale-105 hover:border-pink-400 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-pink-500 ${dwellingSelection === 'single' ? 'border-pink-500 bg-gray-800' : 'border-gray-700 bg-gray-900'}`}
              >
                <div className="font-semibold">Single apartment</div>
                <div className="text-xs text-gray-400">Private place</div>
              </button>

              {/* WG 2..6 cards */}
              {[2,3,4,5,6].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => {
                    setDwellingSelection(n)
                    setHasWg(true)
                    setRoommates(n)
                    setDesiredRooms(n)
                  }}
                  id={`dwelling-${n}`}
                  className={`p-4 rounded-lg text-left border transition-transform duration-150 ease-in-out hover:scale-105 hover:border-pink-400 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-pink-500 ${dwellingSelection === n ? 'border-pink-500 bg-gray-800' : 'border-gray-700 bg-gray-900'}`}
                >
                  <div className="font-semibold">Shared flat ({n})</div>
                  <div className="text-xs text-gray-400">{n} people</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-3">
            <label className="block text-sm text-gray-300">{steps[2]}</label>
            <input
              type="number"
              min={0}
              value={monthlyRent}
              onChange={(e) => setMonthlyRent(e.target.value === '' ? '' : Number(e.target.value))}
              placeholder="Monthly rent in EUR (e.g. 800)"
              className="w-full px-4 py-3 rounded-lg bg-gray-800 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-pink-500"
              ref={monthlyRentRef}
            />
          </div>
        )}

        {step === 3 && (
          <div className="space-y-3">
            <label className="block text-sm text-gray-300">{steps[3]}</label>
            <div className="grid grid-cols-1 gap-3">
              <input
                type="text"
                inputMode="numeric"
                value={zip}
                onChange={(e) => setZip(e.target.value)}
                placeholder="ZIP (optional) e.g. 80331"
                className="w-full px-4 py-3 rounded-lg bg-gray-800 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-pink-500"
                ref={zipRef}
              />

              <div className="flex flex-col items-start gap-3">
                <div className="flex items-center justify-between w-full">
                  <div className="w-1/2 pr-4">
                    <label className="text-xs text-gray-400">Minimum centrality</label>
                    <input
                      type="range"
                      min={1}
                      max={5}
                      value={locationMin}
                      onChange={(e) => {
                        const v = Number(e.target.value)
                        setLocationMin(Math.min(v, locationMax))
                      }}
                      className="w-full"
                    />
                    <div className="text-xs text-gray-300">{locationMin} / 5</div>
                  </div>

                  <div className="w-1/2 pl-4">
                    <label className="text-xs text-gray-400">Maximum centrality</label>
                    <input
                      type="range"
                      min={1}
                      max={5}
                      value={locationMax}
                      onChange={(e) => {
                        const v = Number(e.target.value)
                        setLocationMax(Math.max(v, locationMin))
                      }}
                      className="w-full"
                    />
                    <div className="text-xs text-gray-300">{locationMax} / 5</div>
                  </div>
                </div>
                <p className="text-xs text-gray-400">Choose a preferred range for centrality (1 outer — 5 central).</p>
              </div>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-3">
            <h4 className="text-lg font-semibold">Summary</h4>
            <div className="grid grid-cols-2 gap-3 text-sm text-gray-200">
              <EditableCard label="Planned months" value={rentingMonths !== '' ? String(rentingMonths) : '—'} onSave={(v: string) => setRentingMonths(v === '' ? '' : Number(v))} inputType="number" />
              <EditableCard label="Roommates" value={roommates !== '' ? String(roommates) : '—'} onSave={(v: string) => setRoommates(v === '' ? '' : Number(v))} inputType="number" />
              <EditableCard label="Monthly rent" value={monthlyRent !== '' ? String(monthlyRent) : '—'} onSave={(v: string) => setMonthlyRent(v === '' ? '' : Number(v))} inputType="number" />
              <EditableCard label="ZIP" value={zip || '—'} onSave={(v: string) => setZip(v)} inputType="text" />
              <div className="bg-gray-900 p-3 rounded-lg">
                <div className="text-sm">Location range</div>
                <div className="text-pink-400 font-medium">{locationMin} — {locationMax} / 5</div>
                <div className="text-xs text-gray-400 mt-2">Preferred centrality range</div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="mt-6 flex items-center justify-between">
        <button
          onClick={back}
          disabled={step === 0}
          className="px-4 py-2 rounded-lg bg-gray-700 text-gray-200 disabled:opacity-50"
        >
          Back
        </button>

        <div className="flex items-center gap-3">
          <div className="text-xs text-gray-400">Tip: press Enter to continue</div>
          <button
            onClick={next}
            ref={nextButtonRef}
            className="px-5 py-2 rounded-lg bg-pink-600 hover:bg-pink-500 text-white font-medium"
          >
            {step === steps.length - 1 ? 'Finish' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  )
}
