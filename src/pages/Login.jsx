import { useState } from 'react'
import { Eye, EyeOff, Mail, Lock } from 'lucide-react'
import { Toaster } from 'react-hot-toast'
import { showSingleToast } from '../utils/toastUtils'
import logo from '../assets/logo.png'
import icon from '../assets/icon.png'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const Login = ({ onLoginSuccess, onSwitchToSignup, onForgotPassword }) => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    // Basic validation
    if (!email || !password) {
      showSingleToast.error('Please fill in all fields')
      setLoading(false)
      return
    }

    if (!email.includes('@')) {
      showSingleToast.error('Please enter a valid email address')
      setLoading(false)
      return
    }

    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })

      const data = await response.json()

      if (!response.ok) {
        // Handle specific error cases
        if (response.status === 401) {
          showSingleToast.error(data.detail || 'Invalid email or password')
        } else if (response.status === 404) {
          showSingleToast.error('Account not found. Please check your email or sign up.')
        } else if (response.status === 422) {
          showSingleToast.error('Invalid email format')
        } else if (response.status >= 500) {
          showSingleToast.error('Server error. Please try again later.')
        } else {
          showSingleToast.error(data.detail || 'Login failed. Please try again.')
        }
        return
      }

      localStorage.setItem('token', data.access_token)
      localStorage.setItem('userEmail', email) // Store user email for immediate access
      if (rememberMe) {
        localStorage.setItem('rememberMe', 'true')
      }
      showSingleToast.success('Welcome back!')
      onLoginSuccess()
    } catch (err) {
      console.error('Login error:', err)
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2 dark:text-gray-300">Welcome back</h1>
          <p className="text-gray-600 dark:text-gray-500">Sign in to your account</p>
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
              </div>
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 text-gray-900 border-gray-300 rounded focus:ring-gray-900"
                />
                <span className="ml-2 text-gray-600">Remember me</span>
              </label>
              <button
                type="button"
                onClick={onForgotPassword}
                className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
              >
                Forgot password?
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gray-900 dark:bg-gray-200 dark:text-gray-800 text-white py-3 rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-600">
            Don't have an account?{' '}
            <button
              type="button"
              onClick={onSwitchToSignup}
              className="text-gray-900 font-semibold hover:underline dark:text-gray-300"
            >
              Sign up
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Login
