import { useState } from 'react'
import { Eye, EyeOff, Mail, Lock } from 'lucide-react'
import { Toaster } from 'react-hot-toast'
import { showSingleToast } from '../utils/toastUtils'
import logo from '../assets/logo.png'
import icon from '../assets/icon.png'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const Signup = ({ onSignupSuccess, onSwitchToLogin }) => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()

    // Basic validation
    if (!email || !password || !confirmPassword) {
      showSingleToast.error('Please fill in all fields')
      return
    }

    if (!email.includes('@')) {
      showSingleToast.error('Please enter a valid email address')
      return
    }

    if (password !== confirmPassword) {
      showSingleToast.error('Passwords do not match')
      return
    }

    if (password.length < 6) {
      showSingleToast.error('Password must be at least 6 characters')
      return
    }

    // Password strength validation
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
      showSingleToast.error('Password must contain at least one uppercase letter, one lowercase letter, and one number')
      return
    }

    setLoading(true)

    try {
      const response = await fetch(`${API_URL}/api/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })

      const data = await response.json()

      if (!response.ok) {
        // Handle specific error cases
        if (response.status === 409 || response.status === 400) {
          if (data.detail && data.detail.includes('already registered')) {
            showSingleToast.error('This email is already registered. Please use a different email or try logging in.')
          } else if (data.detail && data.detail.includes('email')) {
            showSingleToast.error('Email already exists. Please try logging in instead.')
          } else {
            showSingleToast.error('Account with this email already exists')
          }
        } else if (response.status === 422) {
          showSingleToast.error('Invalid email format or password requirements not met')
        } else if (response.status >= 500) {
          showSingleToast.error('Server error. Please try again later.')
        } else {
          showSingleToast.error(data.detail || 'Signup failed. Please try again.')
        }
        return
      }

      // Auto login after successful signup
      try {
        const loginResponse = await fetch(`${API_URL}/api/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        })

        const loginData = await loginResponse.json()

        if (loginResponse.ok) {
          localStorage.setItem('token', loginData.access_token)
          localStorage.setItem('userEmail', email) // Store user email for immediate access
          showSingleToast.success('Account created successfully! Welcome aboard!')
          onSignupSuccess()
        } else {
          showSingleToast.success('Account created! Please log in to continue.')
          // Optionally switch to login page
          // onSwitchToLogin()
        }
      } catch (loginErr) {
        console.error('Auto-login error:', loginErr)
        showSingleToast.success('Account created! Please log in to continue.')
      }
    } catch (err) {
      console.error('Signup error:', err)
      if (err.name === 'TypeError' && err.message.includes('fetch')) {
        showSingleToast.error('Unable to connect to server. Please check your internet connection.')
      } else {
        showSingleToast.error('Something went wrong. Please try again later.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center  p-4">
      <Toaster position="top-center" />
      <div className="w-full max-w-md">
        {/* Logo/Brand */}
        <div className="text-center mb-8">
          <img 
            src={icon} 
            alt="AK BPO AI Logo" 
            className="w-16 h-16 object-contain mx-auto mb-4"
          />
          <h1 className="text-3xl font-bold text-gray-900 mb-2 dark:text-gray-300">Create account</h1>
          <p className="text-gray-600 dark:text-gray-500">Get started with AK BPO AI</p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm dark:bg-[#1f1f1f]">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 dark:text-gray-300">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="dark:bg-[#212121] w-full pl-10 pr-4 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 dark:text-gray-300">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="dark:bg-[#212121] w-full pl-10 pr-12 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {password && (
                  <div className="mt-2 text-xs space-y-1">
                    <div className={`flex items-center ${password.length >= 6 ? 'text-green-600' : 'text-red-500'}`}>
                      <span className="mr-1">{password.length >= 6 ? '✓' : '✗'}</span>
                      At least 6 characters
                    </div>
                    <div className={`flex items-center ${/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password) ? 'text-green-600' : 'text-red-500'}`}>
                      <span className="mr-1">{/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password) ? '✓' : '✗'}</span>
                      Contains uppercase, lowercase, and number
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 dark:text-gray-300">Confirm Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="dark:bg-[#212121] w-full pl-10 pr-12 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {confirmPassword && (
                  <div className="mt-2 text-xs">
                    <div className={`flex items-center ${password === confirmPassword ? 'text-green-600' : 'text-red-500'}`}>
                      <span className="mr-1">{password === confirmPassword ? '✓' : '✗'}</span>
                      Passwords match
                    </div>
                  </div>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gray-900 text-white py-3 rounded-lg font-medium hover:bg-gray-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-300 dark:text-gray-700"
            >
              {loading ? 'Creating account...' : 'Create account'}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-600">
            Already have an account?{' '}
            <button
              type="button"
              onClick={onSwitchToLogin}
              className="text-gray-900 font-semibold hover:underline dark:text-gray-300"
            >
              Sign in
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Signup
