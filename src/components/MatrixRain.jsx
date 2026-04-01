import { useEffect, useRef, useState } from 'react'

const MatrixRain = () => {
  const canvasRef = useRef(null)
  const animationRef = useRef(null)
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 })
  const [isDarkTheme, setIsDarkTheme] = useState(true)

  useEffect(() => {
    const updateDimensions = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight
      })
    }

    updateDimensions()
    window.addEventListener('resize', updateDimensions)
    return () => window.removeEventListener('resize', updateDimensions)
  }, [])

  // Theme detection effect
  useEffect(() => {
    const checkTheme = () => {
      const theme = localStorage.getItem('theme') || 'dark'
      const hasDocumentDarkClass = document.documentElement.classList.contains('dark')
      setIsDarkTheme(theme === 'dark' || hasDocumentDarkClass)
    }

    // Check theme on mount
    checkTheme()

    // Listen for theme changes
    const observer = new MutationObserver(checkTheme)
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    })

    // Listen for storage changes (theme updates)
    window.addEventListener('storage', checkTheme)

    return () => {
      observer.disconnect()
      window.removeEventListener('storage', checkTheme)
    }
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || dimensions.width === 0) return

    const ctx = canvas.getContext('2d')
    canvas.width = dimensions.width
    canvas.height = dimensions.height

    // Matrix character set with Japanese katakana and hiragana
    const matrix = "アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲンあいうえおかきくけこさしすせそたちつてとなにぬねのはひふへほまみむめもやゆよらりるれろわをん0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ"
    const matrixArray = matrix.split("")

    const fontSize = 10
    const columns = canvas.width / fontSize

    // Array of drops - one per column
    const drops = []
    // Initialize drops
    for (let x = 0; x < columns; x++) {
      drops[x] = 1
    }

    const draw = () => {
      // Theme-aware background with subtle trail effect
      if (isDarkTheme) {
        // Dark theme: black background with subtle trail
        ctx.fillStyle = "rgba(0, 0, 0, 0.06)"
      } else {
        // Light theme: white background with subtle trail
        ctx.fillStyle = "rgba(233, 233, 233, 0.06)"
      }
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Theme-aware text color
      if (isDarkTheme) {
        // Dark theme: green matrix effect
        ctx.fillStyle = "rgba(0, 244, 33, 0.40)"
      } else {
        // Light theme: subtle gray/blue effect
        ctx.fillStyle = "rgba(100, 116, 139, 0.25)"
      }
      ctx.font = fontSize + "px arial"

      // Loop over drops
      for (let i = 0; i < drops.length; i++) {
        // Random character to print
        const text = matrixArray[Math.floor(Math.random() * matrixArray.length)]
        
        // x = i*fontSize, y = value of drops[i]*fontSize
        ctx.fillText(text, i * fontSize, drops[i] * fontSize)

        // Send the drop back to the top randomly after it has crossed the screen
        // Adding randomness to the reset to make the drops scattered on the Y axis
        if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
          drops[i] = 0
        }

        // Increment Y coordinate
        drops[i]++
      }
    }

    const animate = () => {
      draw()
      animationRef.current = requestAnimationFrame(animate)
    }

    // Start animation with your timing from the example (35ms interval ≈ 28.5 FPS)
    const intervalId = setInterval(draw, 35)

    return () => {
      clearInterval(intervalId)
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [dimensions, isDarkTheme])

  return (
    <canvas
      ref={canvasRef}
      className={`fixed inset-0 pointer-events-none z-10 ${
        isDarkTheme ? 'bg-[#1a1a1a]' : 'bg-gray-50'
      }`}
      style={{
        width: '100%',
        height: '100%'
      }}
    />
  )
}

export default MatrixRain