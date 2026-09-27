/**
 * Toast rate limiter utility
 * Prevents notification spam by enforcing a minimum time between toasts
 */

interface QueuedToast {
  title: string
  message: string
  type: 'success' | 'error' | 'warning' | 'info'
  timestamp: number
}

class ToastRateLimiter {
  private lastToastTime = 0
  private minIntervalMs = 2000 // Minimum 2 seconds between toasts
  private queue: QueuedToast[] = []
  private isProcessing = false
  private showToastFn: ((title: string, message: string, type?: string) => void) | null = null

  /**
   * Initialize the rate limiter with a showToast callback
   */
  setShowToastCallback(fn: (title: string, message: string, type?: string) => void) {
    this.showToastFn = fn
  }

  /**
   * Queue or immediately show a toast, respecting rate limit
   */
  show(title: string, message: string, type: 'success' | 'error' | 'warning' | 'info' = 'success') {
    if (!this.showToastFn) {
      console.warn('Toast rate limiter not initialized with showToast callback')
      return
    }

    const now = Date.now()
    const timeSinceLastToast = now - this.lastToastTime

    // If enough time has passed, show immediately
    if (timeSinceLastToast >= this.minIntervalMs) {
      this.lastToastTime = now
      this.showToastFn(title, message, type)
    } else {
      // Otherwise, queue it for later
      this.queue.push({ title, message, type, timestamp: now })
      this.scheduleNextProcessing()
    }
  }

  /**
   * Schedule processing of queued toasts
   */
  private scheduleNextProcessing() {
    if (this.isProcessing || this.queue.length === 0) return

    this.isProcessing = true
    const timeUntilNextToast = this.minIntervalMs - (Date.now() - this.lastToastTime)

    setTimeout(() => {
      this.processQueue()
    }, Math.max(0, timeUntilNextToast))
  }

  /**
   * Process queued toasts one at a time
   */
  private processQueue() {
    if (!this.showToastFn || this.queue.length === 0) {
      this.isProcessing = false
      return
    }

    const nextToast = this.queue.shift()
    if (nextToast) {
      this.lastToastTime = Date.now()
      this.showToastFn(nextToast.title, nextToast.message, nextToast.type)

      // Schedule next one if there are more
      if (this.queue.length > 0) {
        setTimeout(() => this.processQueue(), this.minIntervalMs)
      } else {
        this.isProcessing = false
      }
    } else {
      this.isProcessing = false
    }
  }

  /**
   * Clear the queue (useful on component unmount or during cleanup)
   */
  clear() {
    this.queue = []
    this.isProcessing = false
  }

  /**
   * Set custom minimum interval between toasts (in milliseconds)
   */
  setMinInterval(ms: number) {
    this.minIntervalMs = Math.max(500, ms) // Enforce minimum of 500ms
  }
}

// Export singleton instance
export const toastRateLimiter = new ToastRateLimiter()
