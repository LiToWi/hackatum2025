import React from 'react'
import ApartmentCard from './ApartmentCard'

const SAMPLE_PROPERTY = {
  id: 'apt-001',
  title: 'Sunny 2-room flat near Englischer Garten',
  imageUrl: '/images/sample-apt.jpg',
  price: 320000,
  purchasePrice: 280000,
  sqm: 58,
  rooms: 2,
  bathrooms: 1,
  floor: 2,
  yearBuilt: 1995,
  energyClass: 'B',
  neighborhood: 'Maxvorstadt',
  terrace: true,
  balcony: false,
  parking: false,
  annualRent: 12000,
  ownershipStart: '2021-04-10T00:00:00Z',
  percentOwned: 45.5,
  percentGainPerYear: 3.2
}

export default function ApartmentCardExample() {
  return (
    <div className="p-6">
      <ApartmentCard property={SAMPLE_PROPERTY} />
    </div>
  )
}
