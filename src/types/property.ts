export interface Property {
  id: string | number
  lat: number
  lng: number
  title: string
  price: number
  sqm?: number | null
  rooms?: number | null
  // Rounded legacy field (kept for compatibility)
  equityPercentage?: number
  // Precise percentage (0-100) the student will own after the full renting period
  studentOwnershipPercentage?: number
}
