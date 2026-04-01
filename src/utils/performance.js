// Performance monitoring utilities

class PerformanceMonitor {
  constructor() {
    this.metrics = new Map()
  }

  // Start timing an operation
  startTimer(name) {
    this.metrics.set(name, {
      startTime: performance.now(),
      endTime: null,
      duration: null
    })
  }

  // End timing an operation
  endTimer(name) {
    const metric = this.metrics.get(name)
    if (metric) {
      metric.endTime = performance.now()
      metric.duration = metric.endTime - metric.startTime
      
      // Log slow operations (> 1 second)
      if (metric.duration > 1000) {
        console.warn(`⚠️ Slow operation detected: ${name} took ${metric.duration.toFixed(2)}ms`)
      }
      
      return metric.duration
    }
    return null
  }

  // Get timing for an operation
  getMetric(name) {
    return this.metrics.get(name)
  }

  // Clear all metrics
  clear() {
    this.metrics.clear()
  }

  // Get all metrics
  getAllMetrics() {
    const results = {}
    for (const [name, metric] of this.metrics.entries()) {
      results[name] = {
        duration: metric.duration,
        startTime: metric.startTime,
        endTime: metric.endTime
      }
    }
    return results
  }
}

// Create global instance
const performanceMonitor = new PerformanceMonitor()

// Utility functions
export const startTimer = (name) => performanceMonitor.startTimer(name)
export const endTimer = (name) => performanceMonitor.endTimer(name)
export const getMetric = (name) => performanceMonitor.getMetric(name)
export const clearMetrics = () => performanceMonitor.clear()
export const getAllMetrics = () => performanceMonitor.getAllMetrics()

// HOC for timing React components
export const withPerformanceMonitoring = (WrappedComponent, componentName) => {
  return function PerformanceMonitoredComponent(props) {
    const timerName = `${componentName}_render`
    
    React.useEffect(() => {
      startTimer(timerName)
      return () => {
        endTimer(timerName)
      }
    })
    
    return React.createElement(WrappedComponent, props)
  }
}

// Debounce utility for performance
export const debounce = (func, wait) => {
  let timeout
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout)
      func(...args)
    }
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}

// Throttle utility for performance
export const throttle = (func, limit) => {
  let inThrottle
  return function() {
    const args = arguments
    const context = this
    if (!inThrottle) {
      func.apply(context, args)
      inThrottle = true
      setTimeout(() => inThrottle = false, limit)
    }
  }
}

export default performanceMonitor