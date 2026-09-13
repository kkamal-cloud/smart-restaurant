/**
 * Formats a numeric order sequence number to 4 digits (e.g. 0001, 0023, 0125).
 * Fallback to 4-char hex slice if orderNumber is unavailable.
 */
export const formatOrderNumber = (num, fallbackId = '') => {
  if (typeof num === 'number' && !isNaN(num) && num > 0) {
    return String(num).padStart(4, '0');
  }
  if (fallbackId && typeof fallbackId === 'string') {
    return fallbackId.slice(-4).toUpperCase();
  }
  return '0000';
};

/**
 * Formats a numeric bill sequence number to 4 digits (e.g. 0001, 0004, 0023).
 * Fallback to 4-char hex slice if billNumber is unavailable.
 */
export const formatBillNumber = (num, fallbackId = '') => {
  if (typeof num === 'number' && !isNaN(num) && num > 0) {
    return String(num).padStart(4, '0');
  }
  if (fallbackId && typeof fallbackId === 'string') {
    return fallbackId.slice(-4).toUpperCase();
  }
  return '0000';
};
