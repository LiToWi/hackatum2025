"use client";

import Link from 'next/link'
import Image from 'next/image'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Menu, X } from 'lucide-react'
import { useSession, signOut } from 'next-auth/react'
import LoadingAnimation from './LoadingAnimation';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false)
  const { data: session, status } = useSession()
  const router = useRouter()

  // Function to close mobile menu
  const closeMobileMenu = () => {
    setIsOpen(false)
  }

  // Handle logout and close menu
  const handleLogout = async () => {
    closeMobileMenu()
    try {
      await signOut({ redirect: false })
    } finally {
      router.push('/login')
    }
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
          {/* Desktop nav links (visible on md+) */}
          <div className="hidden md:flex items-center space-x-4">
            <Link href="/" className="px-3 py-1.5 rounded-md hover-gradient-pink-purple transition font-medium">
              Home
            </Link>
            {session && (
              <Link href="/dashboard/user" className="px-3 py-1.5 rounded-md hover-gradient-pink-purple transition font-medium">
                Dashboard
              </Link>
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
                onClick={handleLogout}
                className="bg-red-500 hover:bg-red-400 text-white px-4 py-1.5 rounded-md font-semibold transition"
              >
                LOGOUT ({session.user?.name})
              </button>
            </div>
          ) : (
            <Link href="/login" className="hidden md:inline-block px-6 py-2 rounded-lg bg-[#D67F31] hover:bg-[#bf6f2c] text-white font-medium transition-all">
              LOGIN
            </Link>
          )}

          {/* Mobile toggle button */}
          <button className="md:hidden focus:outline-none ml-2" onClick={() => setIsOpen(!isOpen)} aria-label="Toggle menu">
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
              className="block w-full text-left px-6 py-2 rounded-lg bg-[#D67F31] hover:bg-[#bf6f2c] text-white font-medium transition-all"
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