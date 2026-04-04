import { useState } from 'react'
import { Mail } from 'lucide-react'
import { Toaster } from 'react-hot-toast'
import { showSingleToast } from '../utils/toastUtils'
import icon from '../assets/icon.png'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const ForgotPassword = ({ onBackToLogin }) => {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email || !email.includes('@')) {
      showSingleToast.error('Please enter a valid email address')
      return
    }
    setLoading(true)
    try {
      await fetch(`${API_URL}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      })
      setSubmitted(true)
    } catch {
      // Still show success — never reveal whether email exists
      setSubmitted(true)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Toaster position="top-center" />
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <img src={icon} alt="AK BPO AI Logo" className="w-16 h-16 object-contain mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-900 mb-2 dark:text-gray-300">Forgot password?</h1>
          <p className="text-gray-600 dark:text-gray-500">
            {submitted ? 'Check your inbox' : "We'll send you a reset link"}
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm dark:bg-[#1f1f1f]">
          {submitted ? (
            <div className="text-center space-y-4">
              <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <Mail className="w-7 h-7 text-green-600" />
              </div>
              <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
                If that email address is registered, you'll receive a reset link shortly.
                Check your spam folder if you don't see it within a few minutes.
              </p>
              <button
                type="button"
                onClick={onBackToLogin}
                className="w-full bg-gray-900 dark:bg-gray-200 dark:text-gray-800 text-white py-3 rounded-lg font-medium transition-all mt-2"
              >
                Back to sign in
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 dark:text-gray-300">Email address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="dark:bg-[#212121] w-full pl-10 pr-4 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all"
                    required
                    autoFocus
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gray-900 dark:bg-gray-200 dark:text-gray-800 text-white py-3 rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Sending...' : 'Send reset link'}
              </button>

              <div className="text-center text-sm">
                <button
                  type="button"
                  onClick={onBackToLogin}
                  className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                >
                  ← Back to sign in
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}

export default ForgotPassword
