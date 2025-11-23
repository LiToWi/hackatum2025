/* eslint-disable @typescript-eslint/no-explicit-any */
import fs from 'fs'
import path from 'path'

const DB_PATH = path.resolve(process.cwd(), 'data', 'db.json')

type User = {
  id: string
  name: string
  email?: string | null
  passwordHash: string
  salt: string
  createdAt: number
}

type Property = {
  id: string
  [k: string]: any
}

type Ownership = {
  id: string
  userId: string
  propertyId: string
}

type DB = {
  users: User[]
  properties: Property[]
  ownerships: Ownership[]
}

function ensureDir() {
  const dir = path.dirname(DB_PATH)
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
}

function readDB(): DB {
  try {
    if (!fs.existsSync(DB_PATH)) {
      const empty: DB = { users: [], properties: [], ownerships: [] }
      ensureDir()
      fs.writeFileSync(DB_PATH, JSON.stringify(empty, null, 2))
      return empty
    }
    const raw = fs.readFileSync(DB_PATH, 'utf8')
    return JSON.parse(raw) as DB
  } catch (e) {
    console.error('Error reading local DB', e)
    return { users: [], properties: [], ownerships: [] }
  }
}

function writeDB(db: DB) {
  try {
    ensureDir()
    fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), 'utf8')
  } catch (e) {
    console.error('Error writing local DB', e)
  }
}

export async function getUserByName(name: string) {
  const db = readDB()
  return db.users.find((u) => u.name === name) ?? null
}

export async function insertUser({ name, email, passwordHash, salt, createdAt }: any) {
  const db = readDB()
  const id = `u_${Date.now()}_${Math.floor(Math.random() * 10000)}`
  const user = { id, name, email: email || null, passwordHash, salt, createdAt: createdAt || Date.now() }
  db.users.push(user)
  writeDB(db)
  return { id }
}

export async function getUserProperties(userId: string) {
  const db = readDB()
  const owned = db.ownerships.filter((o) => o.userId === userId).map((o) => o.propertyId)
  return owned
}

export async function getPropertiesByIds(ids: string[]) {
  const db = readDB()
  return db.properties.filter((p) => ids.includes(p.id))
}

export async function addOwnership({ userId, propertyId }: { userId: string; propertyId: string }) {
  const db = readDB()
  const id = `own_${Date.now()}_${Math.floor(Math.random() * 10000)}`
  db.ownerships.push({ id, userId, propertyId })
  writeDB(db)
  return { id }
}

export async function upsertProperty(prop: any) {
  const db = readDB()
  const existing = db.properties.find((p) => p.id === prop.id)
  if (existing) {
    Object.assign(existing, prop)
  } else {
    db.properties.push(prop)
  }
  writeDB(db)
  return prop
}

const dbApi = {
  getUserByName,
  insertUser,
  getUserProperties,
  getPropertiesByIds,
  addOwnership,
  upsertProperty,
}

export default dbApi
