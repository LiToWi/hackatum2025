'use client'

import React, { useState } from 'react'
import { X } from 'lucide-react'

interface EmailPopupProps {
  isOpen: boolean
  onClose: () => void
  title: string
  description: string
  onSubmit?: (email: string) => void
}

export default function EmailPopup({
  isOpen,
  onClose,
  title,
  description,
  onSubmit,
}: EmailPopupProps) {
  const [email, setEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return

    setIsSubmitting(true)
    try {
      if (onSubmit) {
        await onSubmit(email)
      }
      setEmail('')
      setIsSuccess(true)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    setEmail('')
    setIsSuccess(false)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="w-full max-w-md bg-gray-800 rounded-2xl shadow-2xl border border-gray-700 p-6 relative">
        {/* Close button */}
        <button
          onClick={handleClose}
          type="button"
          className="absolute top-4 right-4 p-1 text-gray-400 hover:text-white transition-colors"
          aria-label="Close"
        >
          <X size={24} />
        </button>

        {/* Title with gradient */}
        <h2
          className="text-2xl font-bold mb-2"
          style={{
            backgroundImage: 'linear-gradient(90deg, #ff5fa2 0%, #9b6bff 100%)',
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            color: 'transparent',
          }}
        >
          {title}
        </h2>

        {/* Success message or form */}
        {isSuccess ? (
          <div className="space-y-6 py-8 text-center">
            <div className="text-lg text-white font-medium">
              ✓ Request received!
            </div>
            <p className="text-gray-300 text-sm">
              Thank you for choosing rent2own.
            </p>
            <button
              onClick={handleClose}
              type="button"
              className="w-full px-4 py-2 rounded-lg bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white font-medium transition-all"
            >
              Close
            </button>
          </div>
        ) : (
          <>
            {/* Description */}
            <p className="text-gray-300 text-sm mb-6 leading-relaxed">
              {description}
            </p>

            {/* Email form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm text-gray-300 mb-2">
                  Email address
                </label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  required
                  className="w-full px-4 py-3 rounded-lg bg-gray-900 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all"
                />
              </div>

              {/* Buttons */}
              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleClose}
                  type="button"
                  className="flex-1 px-4 py-2 rounded-lg transition-colors bg-transparent text-pink-400 border border-pink-400 hover:bg-gray-800 hover:text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !email.trim()}
                  className="flex-1 px-4 py-2 rounded-lg bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {isSubmitting ? 'Sending...' : 'Send'}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
