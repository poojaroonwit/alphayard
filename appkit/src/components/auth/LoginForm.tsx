'use client'

import { useState, useEffect } from 'react'
import { authService } from '../../services/authService'
import {
  EyeIcon,
  EyeSlashIcon,
  ShieldCheckIcon,
  ExclamationTriangleIcon,
  XMarkIcon,
  EnvelopeIcon,
  LockClosedIcon,
  ArrowRightIcon,
  SparklesIcon,
  UserIcon
} from '@heroicons/react/24/outline'

interface LoginFormProps {
  onLoginSuccess: () => void
}

export function LoginForm({ onLoginSuccess }: LoginFormProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [attemptCount, setAttemptCount] = useState(0)
  const [mounted, setMounted] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [focusedField, setFocusedField] = useState<string | null>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const result = await authService.login({ email, password })
      console.log('[LoginForm] Login successful:', result)
      onLoginSuccess()
    } catch (error) {
      console.error('[LoginForm] Login failed:', error)
      setAttemptCount(prev => prev + 1)
      setError('Invalid email or password. Please check your credentials and try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleDismissError = () => {
    setError('')
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

        {/* Twinkling particles */}
        {mounted && [...Array(8)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1.5 h-1.5 bg-white rounded-full"
            style={{
              top: `${15 + Math.random() * 70}%`,
              left: `${5 + Math.random() * 90}%`,
              opacity: 0.4 + Math.random() * 0.4,
              animation: `twinkle ${3 + Math.random() * 3}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 3}s`
            }}
          />
        ))}
      </div>

      {/* Mesh Grid Overlay for Depth */}
      <div
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px'
        }}
      />

      {/* Login Card Container */}
      <div
        className={`relative z-10 w-full max-w-md mx-4 transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-10 scale-95'
          }`}
        style={{ perspective: '1000px' }}
      >
        {/* Glassmorphism Card */}
        <div
          className="relative group"
          style={{
            transformStyle: 'preserve-3d',
            transform: 'rotateX(2deg)'
          }}
        >
          {/* Card Outer Glow */}
          <div
            className="absolute -inset-2 rounded-[2rem] opacity-40 blur-2xl transition-opacity duration-700 group-hover:opacity-60"
            style={{
              background: 'conic-gradient(from 180deg, #e94560, #feca57, #ff9ff3, #533483, #e94560)'
            }}
          />

          {/* Main Card */}
          <div
            className="relative rounded-3xl p-8 md:p-10 overflow-hidden"
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              backdropFilter: 'blur(24px) saturate(200%)',
              WebkitBackdropFilter: 'blur(24px) saturate(200%)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              boxShadow: `
                0 25px 50px -12px rgba(0, 0, 0, 0.4),
                inset 0 1px 0 rgba(255, 255, 255, 0.1),
                inset 0 -1px 0 rgba(0, 0, 0, 0.1)
              `
            }}
          >
            {/* Glass Reflection Highlight */}
            <div
              className="absolute inset-0 rounded-3xl pointer-events-none"
              style={{
                background: 'linear-gradient(135deg, rgba(255,255,255,0.15) 0%, transparent 40%, transparent 100%)'
              }}
            />

            {/* Logo & Header */}
            <div className="relative text-center mb-8">
              {/* 3D Logo with Shadow */}
              <div
                className="mx-auto w-24 h-24 mb-6 relative"
                style={{ perspective: '600px', transformStyle: 'preserve-3d' }}
              >
                {/* Logo Glow */}
                <div
                  className="absolute inset-2 rounded-2xl"
                  style={{
                    background: 'linear-gradient(135deg, #e94560, #ff6b6b, #feca57)',
                    filter: 'blur(25px)',
                    opacity: 0.7,
                    transform: 'translateZ(-15px)'
                  }}
                />

                {/* Logo Container */}
                <div
                  className="relative w-full h-full rounded-2xl flex items-center justify-center overflow-hidden transition-transform duration-500 hover:scale-110 cursor-pointer"
                  style={{
                    background: 'linear-gradient(135deg, #e94560 0%, #ff6b6b 40%, #feca57 100%)',
                    transform: 'rotateY(-8deg) rotateX(8deg)',
                    boxShadow: `
                      0 20px 40px rgba(233, 69, 96, 0.5),
                      inset 0 2px 0 rgba(255,255,255,0.3),
                      inset 0 -2px 0 rgba(0,0,0,0.1)
                    `
                  }}
                >
                  <ShieldCheckIcon className="w-12 h-12 text-white drop-shadow-xl" />
                </div>
              </div>

              <h1
                className="text-4xl font-extrabold text-white mb-3 tracking-tight"
                style={{ textShadow: '0 4px 20px rgba(0,0,0,0.4)' }}
              >
                Welcome Back
              </h1>
              <p className="text-white/60 text-base">
                Sign in to access your admin dashboard
              </p>
            </div>

            {/* Login Form */}
            <form className="relative space-y-5" onSubmit={handleSubmit}>
              {/* Email Field */}
              <div className="space-y-2">
                <label htmlFor="email" className="block text-sm font-semibold text-white/80 ml-1">
                  Email Address
                </label>
                <div className={`relative transition-transform duration-200 ${focusedField === 'email' ? 'scale-[1.02]' : ''}`}>
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
                    <EnvelopeIcon className={`w-5 h-5 transition-all duration-300 ${focusedField === 'email' ? 'text-pink-400 scale-110' : error ? 'text-red-400' : 'text-white/40'
                      }`} />
                  </div>
                  <input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value)
                      setError('')
                    }}
                    onFocus={() => setFocusedField('email')}
                    onBlur={() => setFocusedField(null)}
                    required
                    autoComplete="email"
                    className={`
                      w-full pl-16 pr-4 py-4 rounded-2xl
                      bg-white/5 backdrop-blur-md
                      border-2 transition-all duration-300
                      text-white placeholder-white/30
                      focus:outline-none focus:ring-0
                      [--webkit-backdrop-filter:blur(12px)] [backdrop-filter:blur(12px)] pl-[56px]
                      ${error
                        ? 'border-red-500/50 focus:border-red-400'
                        : focusedField === 'email'
                          ? 'border-pink-500/50 shadow-lg shadow-pink-500/20'
                          : 'border-white/10 hover:border-white/20'
                      }
                    `}
                    aria-label="Email address"
                    aria-invalid={error ? 'true' : 'false'}
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <label htmlFor="password" className="block text-sm font-semibold text-white/80 ml-1">
                  Password
                </label>
                <div className={`relative transition-transform duration-200 ${focusedField === 'password' ? 'scale-[1.02]' : ''}`}>
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
                    <LockClosedIcon className={`w-5 h-5 transition-all duration-300 ${focusedField === 'password' ? 'text-orange-400 scale-110' : error ? 'text-red-400' : 'text-white/40'
                      }`} />
                  </div>
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value)
                      setError('')
                    }}
                    onFocus={() => setFocusedField('password')}
                    onBlur={() => setFocusedField(null)}
                    required
                    autoComplete="current-password"
                    className={`
                      w-full pl-16 pr-14 py-4 rounded-2xl
                      bg-white/5 backdrop-blur-md
                      border-2 transition-all duration-300
                      text-white placeholder-white/30
                      focus:outline-none focus:ring-0
                      [--webkit-backdrop-filter:blur(12px)] [backdrop-filter:blur(12px)] pl-[56px]
                      ${error
                        ? 'border-red-500/50 focus:border-red-400'
                        : focusedField === 'password'
                          ? 'border-orange-500/50 shadow-lg shadow-orange-500/20'
                          : 'border-white/10 hover:border-white/20'
                      }
                    `}
                    aria-label="Password"
                    aria-invalid={error ? 'true' : 'false'}
                  />
                  {/* Password Toggle */}
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center z-10 text-white/40 hover:text-white/80 transition-all duration-200 hover:scale-110"
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
              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center cursor-pointer group">
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="sr-only"
                    />
                    <div className={`
                      w-5 h-5 rounded-lg border-2 transition-all duration-300
                      flex items-center justify-center
                      ${rememberMe
                        ? 'bg-gradient-to-br from-pink-500 to-orange-500 border-transparent scale-110'
                        : 'bg-white/5 border-white/20 group-hover:border-white/40'
                      }
                    `}>
                      {rememberMe && (
                        <svg className="w-3 h-3 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      )}
                    </div>
                  </div>
                  <span className="ml-3 text-sm text-white/60 group-hover:text-white/80 transition-colors">
                    Remember me
                  </span>
                </label>
                <a
                  href="#"
                  className="text-sm font-medium text-white/60 hover:text-pink-400 transition-all duration-200 hover:underline underline-offset-4 decoration-pink-400/50"
                >
                  Forgot password?
                </a>
              </div>

              {/* Error Message */}
              {error && (
                <div
                  className="relative overflow-hidden rounded-2xl animate-shake"
                  role="alert"
                  style={{
                    background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.15), rgba(239, 68, 68, 0.05))',
                    backdropFilter: 'blur(12px)',
                    border: '1px solid rgba(239, 68, 68, 0.25)'
                  }}
                >
                  <div className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0">
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center"
                          style={{ background: 'rgba(239, 68, 68, 0.2)' }}
                        >
                          <ExclamationTriangleIcon className="w-5 h-5 text-red-400" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-bold text-red-300 mb-1">
                          Authentication Failed
                        </h3>
                        <p className="text-sm text-red-200/70 leading-relaxed">
                          {error}
                        </p>
                        {attemptCount > 2 && (
                          <p className="text-xs text-red-400/60 mt-2 font-medium">
                            ⚠️ Multiple failed attempts detected
                          </p>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={handleDismissError}
                        className="flex-shrink-0 text-red-400/50 hover:text-red-300 transition-colors p-1 hover:bg-red-500/10 rounded-lg"
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
                  relative w-full py-4 px-6 rounded-2xl font-bold text-white text-lg
                  overflow-hidden group transition-all duration-300
                  disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none
                  transform hover:scale-[1.03] hover:-translate-y-0.5 active:scale-[0.98]
                `}
                style={{
                  background: 'linear-gradient(135deg, #e94560 0%, #ff6b6b 40%, #feca57 100%)',
                  boxShadow: `
                    0 15px 35px rgba(233, 69, 96, 0.4),
                    0 5px 15px rgba(0, 0, 0, 0.2),
                    inset 0 1px 0 rgba(255, 255, 255, 0.25)
                  `
                }}
              >
                {/* Shimmer Effect */}
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700"
                  style={{
                    background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
                    animation: 'shimmer 2s infinite'
                  }}
                />

                {/* Button Content */}
                <span className="relative flex items-center justify-center gap-3">
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
                      <ArrowRightIcon className="w-5 h-5 group-hover:translate-x-1.5 transition-transform duration-300" />
                    </>
                  )}
                </span>
              </button>

              {/* Demo Credentials Card */}
              <div className="pt-5 border-t border-white/10">
                <div
                  className="flex items-center gap-3 p-4 rounded-2xl text-center justify-center"
                  style={{
                    background: 'linear-gradient(135deg, rgba(254, 202, 87, 0.1), rgba(255, 107, 107, 0.05))',
                    border: '1px solid rgba(254, 202, 87, 0.15)'
                  }}
                >
                  <SparklesIcon className="w-5 h-5 text-yellow-400" />
                  <div className="text-sm">
                    <span className="text-white/50">Demo: </span>
                    <span className="font-mono text-white/80">admin@appkit.com</span>
                    <span className="text-white/50 mx-1">/</span>
                    <span className="font-mono text-white/80">admin123</span>
                  </div>
                </div>
              </div>

              {/* Social Login Divider */}
              <div className="relative py-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/10"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 text-white/40" style={{ background: 'transparent' }}>
                    or continue with
                  </span>
                </div>
              </div>

              {/* Social Login Buttons */}
              <div className="grid grid-cols-3 gap-3">
                {['Google', 'Microsoft', 'SSO'].map((provider) => (
                  <button
                    key={provider}
                    type="button"
                    className="py-3 px-4 rounded-xl bg-white/5 border border-white/10 text-white/60 text-sm font-medium
                      hover:bg-white/10 hover:border-white/20 hover:text-white transition-all duration-200
                      flex items-center justify-center gap-2 hover:scale-105"
                    style={{
                      backdropFilter: 'blur(10px)',
                      WebkitBackdropFilter: 'blur(10px)'
                    }}
                  >
                    {provider}
                  </button>
                ))}
              </div>
            </form>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center space-y-2">
          <p className="text-white/30 text-xs">
            © 2024 AppKit. Secure Admin Portal
          </p>
          <div className="flex items-center justify-center gap-4 text-xs">
            <a href="#" className="text-white/40 hover:text-white/70 transition-colors">Privacy</a>
            <span className="text-white/20">•</span>
            <a href="#" className="text-white/40 hover:text-white/70 transition-colors">Terms</a>
            <span className="text-white/20">•</span>
            <a href="#" className="text-white/40 hover:text-white/70 transition-colors">Support</a>
          </div>
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
          50% { transform: translateY(-25px) rotate(3deg); }
        }
        
        @keyframes twinkle {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.8); }
        }
        
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-4px); }
          20%, 40%, 60%, 80% { transform: translateX(4px); }
        }
        
        .animate-shake {
          animation: shake 0.5s ease-in-out;
        }
      `}</style>
    </div>
  )
}
