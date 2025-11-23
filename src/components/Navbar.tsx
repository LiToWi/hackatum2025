"use client";

import Link from 'next/link'
import Image from 'next/image'
import { useState } from 'react'
import { Menu, X } from 'lucide-react'
import { useSession, signOut } from 'next-auth/react'
import LoadingAnimation from './LoadingAnimation';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false)
  const { data: session, status } = useSession()

  // Function to close mobile menu
  const closeMobileMenu = () => {
    setIsOpen(false)
  }

  // Handle logout and close menu
  const handleLogout = () => {
    closeMobileMenu()
    signOut()
  }

  return (
    <nav className="w-full bg-gray-900 text-white shadow-md sticky top-0 z-50">
      <div className="flex h-16 items-center justify-between px-4 w-full">
        {/* Left: Logo */}
        <Link href="/" className="flex items-center text-2xl font-bold tracking-tight hover-gradient-pink-purple transition">
          <span className="h-12 w-12 mr-2 relative">
            <Image src="/logo.png" alt="Logo" fill className="object-contain" />
          </span>
          <span className="hover-gradient-pink-purple transition">rent2own</span>
        </Link>
        {/* Center + Right group */}
        <div className="flex items-center space-x-8 ml-auto">
          {/* Nav Links */}
          <div className="hidden md:flex space-x-8 text-md font-medium">
            <Link href="/" className="hover-gradient-pink-purple transition">Home</Link>
            {session && (
              <Link href="/dashboard/user" className="hover-gradient-pink-purple transition">Dashboard</Link>
            )}
            {session && (
                <Link href={`/tables/${session.user?.name}`} className="hover-gradient-pink-purple transition">My Party</Link>
            )}
          </div>

          {/* Login/Logout Button */}
          {status === 'loading' ? (
            <div className="hidden md:block text-sm">
              <LoadingAnimation />
            </div>
          ) : session ? (
            <div className="hidden md:flex items-center space-x-4">
              <button
                onClick={() => signOut()}
                className="bg-red-500 hover:bg-red-400 text-white px-4 py-1.5 rounded-md font-semibold transition"
              >
                LOGOUT ({session.user?.name})
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="hidden md:inline-block px-6 py-2 rounded-lg bg-[#1ad0f0] hover:bg-[#14c7d9] text-black font-medium transition-all"
            >
              LOGIN
            </Link>
          )}

          {/* Mobile toggle button */}
          <button
            className="md:hidden focus:outline-none ml-2"
            onClick={() => setIsOpen(!isOpen)}
            aria-label="Toggle menu"
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {isOpen && (
        <div className="md:hidden px-4 pb-4 space-y-2">
          <Link
            href="/"
            className="block hover-gradient-pink-purple transition"
            onClick={closeMobileMenu}
          >
            Home
          </Link>

          {session && (
            <Link
              href="/dashboard/user"
              className="block hover-gradient-pink-purple transition"
              onClick={closeMobileMenu}
            >
              Dashboard
            </Link>
          )}

          {session && (
            <Link
              href={`/tables/${session.user?.name}`}
              className="block hover-gradient-pink-purple transition"
              onClick={closeMobileMenu}
            >
              My Party
            </Link>
          )}

          {session ? (
            <button
              onClick={handleLogout}
              className="block w-full text-left bg-red-500 hover:bg-red-400 text-white px-4 py-2 rounded-md font-semibold transition"
            >
              LOGOUT ({session.user?.name})
            </button>
          ) : (
            <Link
              href="/login"
              className="block w-full text-left px-6 py-2 rounded-lg bg-[#1ad0f0] hover:bg-[#14c7d9] text-black font-medium transition-all"
              onClick={closeMobileMenu}
            >
              LOGIN
            </Link>
          )}
        </div>
      )}
    </nav>
  )
}