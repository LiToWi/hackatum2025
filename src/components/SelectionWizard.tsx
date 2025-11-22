"use client"

import React, { useState, useEffect } from 'react'

export type WizardResult = {
  rentingMonths: number
  hasWg: boolean
  roommates: number
  // monthly rent the user can pay per month
  monthlyRent?: number | null
  zip?: string
  desiredRooms?: number
  locationFactor?: number
}

export default function SelectionWizard({
  onComplete,
  onBack,
  exitOnBack,
}: {
  onComplete?: (r: WizardResult) => void
  onBack?: () => void
  exitOnBack?: boolean
}) {
  const [step, setStep] = useState(0)
  const [rentingMonths, setRentingMonths] = useState<number | ''>('')
  const [hasWg, setHasWg] = useState(false)
  const [roommates, setRoommates] = useState<number | ''>('')
  const [monthlyRent, setMonthlyRent] = useState<number | ''>('')
  const [zip, setZip] = useState('')
  const [desiredRooms, setDesiredRooms] = useState<number | ''>('')
  const [locationFactor, setLocationFactor] = useState(3)
  // selection for dwelling: 'single' or numeric for WG size (2..6)
  const [dwellingSelection, setDwellingSelection] = useState<'single' | number | null>(null)

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
      const result: WizardResult = {
        rentingMonths: Number(rentingMonths) || 0,
        hasWg,
        roommates: hasWg ? Number(roommates) || 0 : 0,
        monthlyRent: monthlyRent === '' ? null : Number(monthlyRent),
        zip: zip || undefined,
        desiredRooms: desiredRooms === '' ? undefined : Number(desiredRooms),
        locationFactor,
      }
      if (onComplete) onComplete(result)
    }
  }

  function back() {
    // If parent asked to exit on any Back (e.g. map is visible), call onBack
    // and still step the wizard back one step so when the parent shows the
    // InfoSection the wizard is already one step earlier (e.g. from Summary -> ZIP).
    if (exitOnBack && onBack) {
      onBack()
      if (step > 0) {
        setStep(step - 1)
      }
      return
    }

    if (step > 0) {
      setStep(step - 1)
    } else {
      // If we're on the first step and a parent provided an onBack handler,
      // call it so the parent can react (for example, switch views).
      if (onBack) onBack()
    }
  }

  const totalSteps = steps.length
  function displayStepNumber() {
    return step + 1
  }

  return (
  <div tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); next() } }} className="w-full max-w-2xl mx-auto bg-linear-to-br from-gray-900 via-[#0b1220] to-gray-800 rounded-2xl p-6 shadow-xl text-white">
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
                  setRoommates(1)
                  setDesiredRooms(1)
                }}
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
              />

              <div className="flex flex-col items-start gap-2">
                <div className="flex items-center gap-2">
                  {[1,2,3,4,5].map((v) => {
                    const labels = ['Outer','Residential','Balanced','Near center','Central']
                    return (
                      <button
                        key={v}
                        type="button"
                        onClick={() => setLocationFactor(v)}
                        className={`px-3 py-2 rounded-full text-sm ${v <= locationFactor ? 'bg-pink-500 text-white' : 'bg-gray-800 text-gray-300'} transition-colors`}
                      >
                        {labels[v-1]}
                      </button>
                    )
                  })}
                </div>
                <p className="text-xs text-gray-400">Choose how central you want the location to be — higher means more central (and typically higher price).</p>
              </div>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-3">
            <h4 className="text-lg font-semibold">Summary</h4>
            <div className="grid grid-cols-2 gap-3 text-sm text-gray-200">
              <div className="bg-gray-900 p-3 rounded-lg">Planned months<div className="text-pink-400 font-medium">{rentingMonths || '—'}</div></div>
              <div className="bg-gray-900 p-3 rounded-lg">Roommates<div className="text-pink-400 font-medium">{roommates || '—'}</div></div>
              <div className="bg-gray-900 p-3 rounded-lg">Monthly rent<div className="text-pink-400 font-medium">{monthlyRent ? `${monthlyRent} €` : '—'}</div></div>
              <div className="bg-gray-900 p-3 rounded-lg">ZIP<div className="text-pink-400 font-medium">{zip || '—'}</div></div>
              <div className="bg-gray-900 p-3 rounded-lg">Location<div className="text-pink-400 font-medium">{locationFactor} / 5</div></div>
            </div>
          </div>
        )}
      </div>

      <div className="mt-6 flex items-center justify-between">
        <button
          onClick={back}
          type="button"
          className="px-4 py-2 rounded-lg transition-colors bg-transparent text-pink-400 border border-pink-400 hover:bg-gray-800 hover:text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
        >
          Back
        </button>

        <div className="flex items-center gap-3">
          <div className="text-xs text-gray-400">Tip: press Enter to continue</div>
          <button
            onClick={next}
            className="px-5 py-2 rounded-lg bg-pink-600 hover:bg-pink-500 text-white font-medium"
          >
            {step === steps.length - 1 ? 'Finish' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  )
}
