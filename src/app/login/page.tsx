'use client'

import { signIn } from 'next-auth/react'
import { useState } from 'react'

export default function LoginPage() {
    const [name, setName] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        const res = await signIn('credentials', {
            name,
            password,
            callbackUrl: '/dashboard/user',
            redirect: false,
        })

        if (!res?.ok) setError('Invalid login')
        else window.location.href = '/dashboard/user'
    }

    return (
        <div className="flex items-center justify-center min-h-screen">
            <form onSubmit={handleLogin} className="w-full max-w-md">
                <input
                    placeholder="Name"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="block w-full mb-4 p-2 border rounded"
                />
                <input
                    placeholder="Password"
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="block w-full mb-4 p-2 border rounded"
                />
                <button
                    type="submit"
                    className="w-full py-2 bg-[#D67F31] hover:bg-[#bf6f2c] text-white rounded transition-all duration-150 active:scale-95 focus:outline-none focus:ring-2 focus:ring-[#D67F31]/30"
                >
                    Login
                </button>
                {error && <p className="mt-2 text-red-600">{error}</p>}
            </form>
        </div>
    )
}
