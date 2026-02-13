/**
 * Centralized error handling utility
 * Provides consistent error logging and user-friendly error messages
 */

/**
 * Log error in development mode only
 * @param {Error|string} error - Error object or error message
 * @param {string} context - Context where error occurred
 */
export function logError(error, context = '') {
  if (process.env.NODE_ENV === 'development') {
    const errorMessage = error instanceof Error ? error.message : error
    const contextMessage = context ? `[${context}]` : ''
    console.error(`${contextMessage} ${errorMessage}`, error instanceof Error ? error : '')
  }
}

/**
 * Get user-friendly error message
 * @param {Error|string} error - Error object or error message
 * @param {string} defaultMessage - Default message if error is not recognized
 * @returns {string} User-friendly error message
 */
export function getErrorMessage(error, defaultMessage = 'حدث خطأ غير متوقع') {
  if (typeof error === 'string') {
    return error
  }

  if (error instanceof Error) {
    // Handle specific error types
    if (error.message.includes('network') || error.message.includes('fetch')) {
      return 'خطأ في الاتصال. يرجى التحقق من اتصال الإنترنت.'
    }
    
    if (error.message.includes('unauthorized') || error.message.includes('401')) {
      return 'غير مصرح لك بالوصول. يرجى تسجيل الدخول مرة أخرى.'
    }
    
    if (error.message.includes('forbidden') || error.message.includes('403')) {
      return 'ليس لديك صلاحية للقيام بهذا الإجراء.'
    }
    
    if (error.message.includes('not found') || error.message.includes('404')) {
      return 'المورد المطلوب غير موجود.'
    }
    
    return error.message || defaultMessage
  }

  return defaultMessage
}

/**
 * Handle API errors consistently
 * @param {Error} error - Error object
 * @param {string} context - Context where error occurred
 * @returns {Object} Error response object
 */
export function handleApiError(error, context = '') {
  logError(error, context)
  
  return {
    error: getErrorMessage(error),
    status: error.status || 500
  }
}

