// Currency utility for Iraqi Dinar
// نظام العملة: الدينار العراقي
export const CURRENCY_SYMBOL = 'د.ع'
export const CURRENCY_NAME = 'دينار عراقي'

/**
 * تنسيق المبلغ بالدينار العراقي
 * @param {number} amount - المبلغ
 * @returns {string} المبلغ المنسق مع رمز العملة
 */
export function formatCurrency(amount) {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return '٠ ' + CURRENCY_SYMBOL
  }
  
  // استخدام التنسيق العربي العراقي مع فواصل الأرقام
  const formatted = new Intl.NumberFormat('ar-IQ', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
    useGrouping: true
  }).format(amount)
  
  return formatted + ' ' + CURRENCY_SYMBOL
}

/**
 * تنسيق المبلغ بشكل مختصر
 * @param {number} amount - المبلغ
 * @returns {string} المبلغ المنسق مع رمز العملة
 */
export function formatCurrencyShort(amount) {
  return formatCurrency(amount)
}

