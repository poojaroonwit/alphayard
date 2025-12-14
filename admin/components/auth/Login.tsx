'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { authService, LoginCredentials } from '../../services/authService'
import {
  EyeIcon,
  EyeSlashIcon,
  ShieldCheckIcon,
  ExclamationTriangleIcon,
  XMarkIcon,
  EnvelopeIcon,
  LockClosedIcon,
  ArrowRightIcon,
  SparklesIcon
} from '@heroicons/react/24/outline'

export function Login() {
  const [credentials, setCredentials] = useState<LoginCredentials>({
    email: '',
    password: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [attemptCount, setAttemptCount] = useState(0)
  const [mounted, setMounted] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const router = useRouter()

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      await authService.login(credentials)
      router.push('/')
    } catch (error) {
      console.error('Login failed:', error)
      setAttemptCount(prev => prev + 1)
      setError('Invalid email or password. Please check your credentials and try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCredentials(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
    if (error) setError('')
  }

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center">
      {/* Animated Background - Red Vanilla Sky Gradient */}
      <div
        className="absolute inset-0 transition-all duration-1000"
        style={{
          background: `
            linear-gradient(135deg, 
              #1a1a2e 0%, 
              #16213e 15%,
              #0f3460 30%,
              #533483 45%,
              #e94560 60%,
              #ff6b6b 75%,
              #feca57 90%,
              #ff9ff3 100%
            )
          `,
          backgroundSize: '400% 400%',
          animation: 'gradientShift 15s ease infinite'
        }}
      />

      {/* Animated Floating Orbs for 3D Depth Effect */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Large orb - top left */}
        <div
          className="absolute -top-32 -left-32 w-96 h-96 rounded-full opacity-30"
          style={{
            background: 'radial-gradient(circle, rgba(255, 107, 107, 0.8) 0%, rgba(255, 107, 107, 0) 70%)',
            animation: 'float 8s ease-in-out infinite',
            filter: 'blur(40px)'
          }}
        />

        {/* Medium orb - bottom right */}
        <div
          className="absolute -bottom-20 -right-20 w-80 h-80 rounded-full opacity-40"
          style={{
            background: 'radial-gradient(circle, rgba(254, 202, 87, 0.8) 0%, rgba(254, 202, 87, 0) 70%)',
            animation: 'float 10s ease-in-out infinite reverse',
            filter: 'blur(30px)'
          }}
        />

        {/* Small orb - center right */}
        <div
          className="absolute top-1/3 right-1/4 w-48 h-48 rounded-full opacity-25"
          style={{
            background: 'radial-gradient(circle, rgba(83, 52, 131, 0.9) 0%, rgba(83, 52, 131, 0) 70%)',
            animation: 'float 6s ease-in-out infinite',
            animationDelay: '2s',
            filter: 'blur(20px)'
          }}
        />

        {/* Extra small floating particles */}
        {mounted && [...Array(6)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 bg-white rounded-full opacity-60"
            style={{
              top: `${20 + Math.random() * 60}%`,
              left: `${10 + Math.random() * 80}%`,
              animation: `twinkle ${3 + Math.random() * 4}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 2}s`
            }}
          />
        ))}
      </div>

      {/* Stars / Particles Overlay */}
      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: `
            radial-gradient(2px 2px at 20px 30px, white, transparent),
            radial-gradient(2px 2px at 40px 70px, rgba(255,255,255,0.8), transparent),
            radial-gradient(1px 1px at 90px 40px, white, transparent),
            radial-gradient(2px 2px at 130px 80px, rgba(255,255,255,0.6), transparent),
            radial-gradient(1px 1px at 160px 120px, white, transparent)
          `,
          backgroundRepeat: 'repeat',
          backgroundSize: '200px 150px'
        }}
      />

      {/* Login Card Container with 3D Transform */}
      <div
        className={`relative z-10 w-full max-w-md mx-4 transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
        style={{
          perspective: '1000px'
        }}
      >
        {/* Glassmorphism Card */}
        <div
          className="relative group"
          style={{
            transformStyle: 'preserve-3d',
            transform: 'rotateX(2deg)'
          }}
        >
          {/* Card Glow Effect */}
          <div
            className="absolute -inset-1 rounded-3xl opacity-50 blur-xl transition-opacity duration-500 group-hover:opacity-70"
            style={{
              background: 'linear-gradient(135deg, rgba(233, 69, 96, 0.5), rgba(254, 202, 87, 0.5), rgba(255, 159, 243, 0.3))'
            }}
          />

          {/* Main Card */}
          <div
            className="relative rounded-3xl p-8 shadow-2xl border border-white/20 overflow-hidden"
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(20px) saturate(180%)',
              WebkitBackdropFilter: 'blur(20px) saturate(180%)'
            }}
          >
            {/* Inner Glass Highlight */}
            <div
              className="absolute inset-0 rounded-3xl pointer-events-none"
              style={{
                background: 'linear-gradient(135deg, rgba(255,255,255,0.2) 0%, transparent 50%, transparent 100%)'
              }}
            />

            {/* Logo & Branding */}
            <div className="relative text-center mb-8">
              {/* 3D Logo Container */}
              <div
                className="mx-auto w-20 h-20 mb-6 relative"
                style={{
                  perspective: '500px',
                  transformStyle: 'preserve-3d'
                }}
              >
                {/* Logo Shadow */}
                <div
                  className="absolute inset-0 rounded-2xl"
                  style={{
                    background: 'linear-gradient(135deg, #e94560 0%, #ff6b6b 50%, #feca57 100%)',
                    transform: 'translateZ(-10px) scale(1.1)',
                    filter: 'blur(20px)',
                    opacity: 0.6
                  }}
                />

                {/* Logo Main */}
                <div
                  className="relative w-full h-full rounded-2xl flex items-center justify-center shadow-2xl overflow-hidden transition-transform duration-300 hover:scale-105"
                  style={{
                    background: 'linear-gradient(135deg, #e94560 0%, #ff6b6b 50%, #feca57 100%)',
                    transform: 'rotateY(-5deg) rotateX(5deg)',
                    boxShadow: '0 25px 50px -12px rgba(233, 69, 96, 0.5), inset 0 1px 0 rgba(255,255,255,0.3)'
                  }}
                >
                  <ShieldCheckIcon className="w-10 h-10 text-white drop-shadow-lg" />
                </div>
              </div>

              <h1 className="text-3xl font-bold text-white mb-2 drop-shadow-lg" style={{ textShadow: '0 2px 10px rgba(0,0,0,0.3)' }}>
                Welcome Back
              </h1>
              <p className="text-white/70 text-sm">
                Sign in to Bondarys Admin Console
              </p>
            </div>

            {/* Login Form */}
            <form className="relative space-y-6" onSubmit={handleSubmit}>
              {/* Email Field */}
              <div className="space-y-2">
                <label htmlFor="email" className="block text-sm font-medium text-white/90">
                  Email Address
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
                    <EnvelopeIcon className={`w-5 h-5 transition-colors duration-200 ${error ? 'text-red-400' : 'text-white/50 group-focus-within:text-white/80'
                      }`} />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={credentials.email}
                    onChange={handleChange}
                    className={`
                      w-full pl-12 pr-4 py-4 rounded-xl
                      bg-white/10 backdrop-blur-sm
                      border-2 transition-all duration-300
                      text-white placeholder-white/40
                      focus:outline-none focus:ring-0
                      ${error
                        ? 'border-red-400/50 focus:border-red-400'
                        : 'border-white/10 focus:border-white/40 hover:border-white/20'
                      }
                    `}
                    placeholder="Enter your email"
                    style={{
                      WebkitBackdropFilter: 'blur(10px)',
                      backdropFilter: 'blur(10px)'
                    }}
                  />
                  {/* Field Glow on Focus */}
                  <div className="absolute inset-0 rounded-xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 pointer-events-none"
                    style={{
                      boxShadow: '0 0 20px rgba(233, 69, 96, 0.3)',
                    }}
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <label htmlFor="password" className="block text-sm font-medium text-white/90">
                  Password
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
                    <LockClosedIcon className={`w-5 h-5 transition-colors duration-200 ${error ? 'text-red-400' : 'text-white/50 group-focus-within:text-white/80'
                      }`} />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    required
                    value={credentials.password}
                    onChange={handleChange}
                    className={`
                      w-full pl-12 pr-12 py-4 rounded-xl
                      bg-white/10 backdrop-blur-sm
                      border-2 transition-all duration-300
                      text-white placeholder-white/40
                      focus:outline-none focus:ring-0
                      ${error
                        ? 'border-red-400/50 focus:border-red-400'
                        : 'border-white/10 focus:border-white/40 hover:border-white/20'
                      }
                    `}
                    placeholder="Enter your password"
                    style={{
                      WebkitBackdropFilter: 'blur(10px)',
                      backdropFilter: 'blur(10px)'
                    }}
                  />
                  {/* Show/Hide Password Toggle */}
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center z-10 text-white/50 hover:text-white/80 transition-colors duration-200"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? (
                      <EyeSlashIcon className="w-5 h-5" />
                    ) : (
                      <EyeIcon className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Remember Me & Forgot Password */}
              <div className="flex items-center justify-between">
                <label className="flex items-center cursor-pointer group">
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="sr-only"
                    />
                    <div className={`
                      w-5 h-5 rounded-md border-2 transition-all duration-200
                      ${rememberMe
                        ? 'bg-gradient-to-r from-pink-500 to-orange-400 border-transparent'
                        : 'bg-white/10 border-white/30 group-hover:border-white/50'
                      }
                    `}>
                      {rememberMe && (
                        <svg className="w-full h-full text-white p-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      )}
                    </div>
                  </div>
                  <span className="ml-2 text-sm text-white/70 group-hover:text-white/90 transition-colors">
                    Remember me
                  </span>
                </label>
                <a href="#" className="text-sm text-white/70 hover:text-white transition-colors duration-200 hover:underline underline-offset-4">
                  Forgot password?
                </a>
              </div>

              {/* Error Message */}
              {error && (
                <div
                  className="relative overflow-hidden rounded-xl animate-shake"
                  role="alert"
                  style={{
                    background: 'rgba(239, 68, 68, 0.15)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(239, 68, 68, 0.3)'
                  }}
                >
                  <div className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 bg-red-500/20 rounded-full flex items-center justify-center">
                          <ExclamationTriangleIcon className="w-5 h-5 text-red-400" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-semibold text-red-300 mb-1">
                          Authentication Failed
                        </h3>
                        <p className="text-sm text-red-200/80">
                          {error}
                        </p>
                        {attemptCount > 2 && (
                          <p className="text-xs text-red-300/60 mt-2">
                            Multiple failed attempts detected
                          </p>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => setError('')}
                        className="flex-shrink-0 text-red-400/60 hover:text-red-300 transition-colors"
                        aria-label="Dismiss error"
                      >
                        <XMarkIcon className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className={`
                  relative w-full py-4 px-6 rounded-xl font-semibold text-white
                  overflow-hidden group transition-all duration-300
                  disabled:opacity-50 disabled:cursor-not-allowed
                  transform hover:scale-[1.02] active:scale-[0.98]
                `}
                style={{
                  background: 'linear-gradient(135deg, #e94560 0%, #ff6b6b 50%, #feca57 100%)',
                  boxShadow: '0 10px 40px rgba(233, 69, 96, 0.4), inset 0 1px 0 rgba(255,255,255,0.2)'
                }}
              >
                {/* Button Shimmer Effect */}
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  style={{
                    background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
                    animation: 'shimmer 2s infinite'
                  }}
                />

                <span className="relative flex items-center justify-center gap-2">
                  {loading ? (
                    <>
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      <span>Signing in...</span>
                    </>
                  ) : (
                    <>
                      <span>Sign In</span>
                      <ArrowRightIcon className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </span>
              </button>

              {/* Demo Credentials */}
              <div className="pt-4 border-t border-white/10">
                <div
                  className="flex items-center gap-2 p-3 rounded-lg text-center justify-center"
                  style={{
                    background: 'rgba(255, 255, 255, 0.05)'
                  }}
                >
                  <SparklesIcon className="w-4 h-4 text-yellow-400/80" />
                  <p className="text-xs text-white/60">
                    Demo: <span className="font-mono text-white/80">admin@bondarys.com</span> / <span className="font-mono text-white/80">admin123</span>
                  </p>
                </div>
              </div>
            </form>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-white/40 text-xs">
            © 2024 Bondarys. All rights reserved.
          </p>
        </div>
      </div>

      {/* CSS Keyframes */}
      <style jsx>{`
        @keyframes gradientShift {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        
        @keyframes float {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(5deg); }
        }
        
        @keyframes twinkle {
          0%, 100% { opacity: 0.4; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.5); }
        }
        
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
          20%, 40%, 60%, 80% { transform: translateX(5px); }
        }
        
        .animate-shake {
          animation: shake 0.5s ease-in-out;
        }
      `}</style>
    </div>
  )
}
