#!/usr/bin/env node
import crypto from 'crypto'
import path from 'path'
import localDb from '../src/lib/localDb'

async function main() {
  const argv = process.argv.slice(2)
  const name = argv[0] || 'testuser'
  const password = argv[1] || 'password123'
  const email = argv[2] || `${name}@example.com`

  const salt = crypto.randomBytes(16).toString('hex')
  const hash = crypto.pbkdf2Sync(password, salt, 310000, 32, 'sha256').toString('hex')
  const now = Date.now()

  const res = await localDb.insertUser({ name, email, passwordHash: hash, salt, createdAt: now })
  console.log('Inserted user:', { id: res.id, name, email })
  console.log('You can now sign in with:', name, '/', password)
}

main().catch((err) => {
  console.error('Seed failed', err)
  process.exit(1)
})
