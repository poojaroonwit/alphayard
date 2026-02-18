'use client'

import React, { useState } from 'react'

interface AdminLoginProps {
  onLogin: () => void
}

export const AdminLogin: React.FC<AdminLoginProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'
      const response = await fetch(`${apiBase}/api/admin/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: username, password })
      })

      if (response.ok) {
        const data = await response.json()
        localStorage.setItem('admin_token', data.token)
        onLogin()
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Invalid credentials')
      }
    } catch (err) {
      setError('Login failed - please check if the server is running')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-supabase-black">
      <div className="max-w-md w-full space-y-8 p-8 bg-supabase-dark rounded-xl border border-supabase-border shadow-2xl">
        <div>
          <h2 className="mt-2 text-center text-3xl font-extrabold text-white">
            Admin Login
          </h2>
          <p className="mt-2 text-center text-sm text-gray-400">
            Sign in to access the admin panel
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
                    <label htmlFor="username" className="block text-sm font-medium text-gray-400 mb-1">
                Email Address
              </label>
              <input
                id="username"
                name="username"
                type="email"
                required
                className="appearance-none relative block w-full px-3 py-2 bg-supabase-black border border-supabase-border placeholder-gray-500 text-white rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="admin@appkit.com"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-400 mb-1">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="appearance-none relative block w-full px-3 py-2 bg-supabase-black border border-supabase-border placeholder-gray-500 text-white rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          {error && (
            <div className="text-red-400 text-sm text-center bg-red-900/20 p-2 rounded border border-red-900/50">{error}</div>
          )}

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-gradient-to-r from-navy-start to-navy-end hover:opacity-90 transition-opacity focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 shadow-lg shadow-blue-900/20"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </div>

          <div className="text-center text-sm text-gray-500 border-t border-supabase-border pt-4 mt-6">
            <p className="mb-2">System credentials:</p>
            <div className="flex flex-col items-center gap-1">
                <p>Email: <code className="text-gray-300 bg-supabase-black px-2 py-0.5 rounded border border-supabase-border">admin@appkit.com</code></p>
                <p>Pass: <code className="text-gray-300 bg-supabase-black px-2 py-0.5 rounded border border-supabase-border">admin123</code></p>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}

