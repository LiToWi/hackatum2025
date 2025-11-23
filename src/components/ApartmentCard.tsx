/* eslint-disable @next/next/no-img-element */
import React from 'react'

type Property = {
  id?: string
  title?: string
  imageUrl?: string
  price?: number
  purchasePrice?: number
  sqm?: number
  rooms?: number
  bathrooms?: number
  floor?: number | string
  yearBuilt?: number
  energyClass?: string
  neighborhood?: string
  terrace?: boolean
  balcony?: boolean
  parking?: boolean
  annualRent?: number
}

function formatCurrency(n?: number) {
  if (typeof n !== 'number' || Number.isNaN(n)) return '—'
  return n.toLocaleString('en-US', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })
}

function pctString(n: number) {
  if (!isFinite(n)) return '—'
  return `${n.toFixed(1)}%`
}

export default function ApartmentCard({ property }: { property: Property }) {
  const price = property.price ?? 0
  const purchase = property.purchasePrice ?? 0
  const gain = price - purchase
  const pct = purchase > 0 ? (gain / purchase) * 100 : NaN
  const yieldPct = property.annualRent && price ? (property.annualRent / price) * 100 : NaN

  return (
    <article className="w-full max-w-md bg-white rounded-xl shadow-lg overflow-hidden">
      <div className="relative h-64 bg-gray-100">
        {property.imageUrl ? (
          <img
            src={property.imageUrl}
            alt={property.title || 'Apartment image'}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-500">No image</div>
        )}

        {/* Price badge */}
        <div className="absolute left-4 top-4 bg-white/90 text-sm font-semibold text-gray-800 px-3 py-1 rounded-full shadow">
          {formatCurrency(price)}
        </div>

        {/* Gain badge */}
        <div
          className={`absolute right-4 top-4 px-3 py-1 rounded-full text-sm font-semibold shadow ${
            gain >= 0 ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
          }`}
        >
          {isFinite(pct) ? pctString(pct) : '—'}
        </div>

        {/* Title overlay */}
        <div className="absolute left-0 right-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-4">
          <h3 className="text-white text-lg font-bold truncate">{property.title || 'Untitled property'}</h3>
          <p className="text-sm text-gray-200 truncate">{property.neighborhood || ''}</p>
        </div>
      </div>

      <div className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="text-sm text-gray-500">Purchase</div>
            <div className="text-sm font-medium">{purchase > 0 ? formatCurrency(purchase) : '—'}</div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-sm text-gray-500">Gains</div>
            <div className={`text-lg font-bold ${gain >= 0 ? 'text-green-700' : 'text-red-700'}`}>
              {gain === 0 ? '—' : formatCurrency(gain)}
            </div>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-3 text-sm text-gray-700">
          <div className="col-span-1">
            <div className="text-xs text-gray-500">Area</div>
            <div className="font-medium">{property.sqm ?? '—'} m²</div>
          </div>
          <div>
            <div className="text-xs text-gray-500">Rooms</div>
            <div className="font-medium">{property.rooms ?? '—'}</div>
          </div>
          <div>
            <div className="text-xs text-gray-500">Baths</div>
            <div className="font-medium">{property.bathrooms ?? '—'}</div>
          </div>

          <div>
            <div className="text-xs text-gray-500">Floor</div>
            <div className="font-medium">{property.floor ?? '—'}</div>
          </div>
          <div>
            <div className="text-xs text-gray-500">Built</div>
            <div className="font-medium">{property.yearBuilt ?? '—'}</div>
          </div>
          <div>
            <div className="text-xs text-gray-500">Energy</div>
            <div className="font-medium">{property.energyClass ?? '—'}</div>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <span className="text-xs px-2 py-1 bg-gray-100 rounded-md">{property.terrace ? 'Terrace' : ''}</span>
          <span className="text-xs px-2 py-1 bg-gray-100 rounded-md">{property.balcony ? 'Balcony' : ''}</span>
          <span className="text-xs px-2 py-1 bg-gray-100 rounded-md">{property.parking ? 'Parking' : ''}</span>
          {property.annualRent ? (
            <span className="text-xs px-2 py-1 bg-amber-50 rounded-md">Rent: {formatCurrency(property.annualRent)} /yr</span>
          ) : null}
          {isFinite(yieldPct) ? (
            <span className="text-xs px-2 py-1 bg-emerald-50 rounded-md">Yield: {pctString(yieldPct)}</span>
          ) : null}
        </div>

        <div className="mt-4 border-t pt-3 text-sm text-gray-600">
          <div>Neighborhood: <span className="font-medium text-gray-800">{property.neighborhood ?? '—'}</span></div>
        </div>
      </div>
    </article>
  )
}
