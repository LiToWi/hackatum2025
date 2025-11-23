/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import localDb from '@/lib/localDb'

// Use local DB instead of Convex for a quick NoSQL solution

export async function GET(_req: Request) {
  const session = await getServerSession(authOptions as any) as any
  if (!session || !session.user || !session.user.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // get property ids for the user using local DB
    const propertyIds = await localDb.getUserProperties(session.user.id)

    if (!propertyIds || propertyIds.length === 0) {
      return NextResponse.json({ properties: [] })
    }

    const properties = await localDb.getPropertiesByIds(propertyIds)

    return NextResponse.json({ properties })
  } catch (e) {
    console.error('Error fetching user properties', e)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
