#!/usr/bin/env node
const crypto = require('crypto')
const fs = require('fs')
const path = require('path')

const DB_PATH = path.resolve(process.cwd(), 'data', 'db.json')

function readDB() {
  try {
    const raw = fs.readFileSync(DB_PATH, 'utf8')
    return JSON.parse(raw)
  } catch (e) {
    console.error('Failed to read DB at', DB_PATH, e.message)
    process.exit(2)
  }
}

function writeDB(db) {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), 'utf8')
  } catch (e) {
    console.error('Failed to write DB at', DB_PATH, e.message)
    process.exit(3)
  }
}

async function main() {
  const argv = process.argv.slice(2)
  if (argv.length < 2) {
    console.error('Usage: node scripts/setPassword.cjs <username> <newPassword>')
    process.exit(1)
  }
  const [username, newPassword] = argv
  const db = readDB()
  const user = db.users.find((u) => u.name === username)
  if (!user) {
    console.error('User not found:', username)
    process.exit(4)
  }

  const salt = crypto.randomBytes(16).toString('hex')
  const hash = crypto.pbkdf2Sync(newPassword, salt, 310000, 32, 'sha256').toString('hex')
  user.salt = salt
  user.passwordHash = hash
  user.updatedAt = Date.now()
  writeDB(db)
  console.log(`Updated password for ${username}. New salt/hash written to ${DB_PATH}`)
  console.log('You can now sign in with:', username, '/', newPassword)
}

main().catch((err) => {
  console.error('Error:', err)
  process.exit(99)
})
