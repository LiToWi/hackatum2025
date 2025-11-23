#!/usr/bin/env node
const crypto = require('crypto')
const fs = require('fs')
const path = require('path')

const argv = process.argv.slice(2)
const name = argv[0] || 'testuser'
const password = argv[1] || 'password123'
const email = argv[2] || `${name}@example.com`

const DB_PATH = path.resolve(process.cwd(), 'data', 'db.json')

function ensureDir() {
  const dir = path.dirname(DB_PATH)
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
}

function readDB() {
  try {
    if (!fs.existsSync(DB_PATH)) {
      const empty = { users: [], properties: [], ownerships: [] }
      ensureDir()
      fs.writeFileSync(DB_PATH, JSON.stringify(empty, null, 2))
      return empty
    }
    const raw = fs.readFileSync(DB_PATH, 'utf8')
    return JSON.parse(raw)
  } catch (e) {
    console.error('Error reading local DB', e)
    return { users: [], properties: [], ownerships: [] }
  }
}

function writeDB(db) {
  try {
    ensureDir()
    fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), 'utf8')
  } catch (e) {
    console.error('Error writing local DB', e)
  }
}

const salt = crypto.randomBytes(16).toString('hex')
const hash = crypto.pbkdf2Sync(password, salt, 310000, 32, 'sha256').toString('hex')
const now = Date.now()

const db = readDB()
const id = `u_${Date.now()}_${Math.floor(Math.random() * 10000)}`
const user = { id, name, email: email || null, passwordHash: hash, salt, createdAt: now }
db.users.push(user)
writeDB(db)

console.log('Inserted user:', { id, name, email })
console.log('You can now sign in with:', name, '/', password)
