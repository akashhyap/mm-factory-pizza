// Utility functions for formatting currency and other helpers

/**
 * Format a number as Euro currency
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IE', {
    style: 'currency',
    currency: 'EUR',
  }).format(amount);
}

/**
 * Format a number with specified decimal places
 */
export function formatNumber(amount: number, decimals: number = 2): string {
  return amount.toFixed(decimals);
}

/**
 * Format a date for display
 */
export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-IE', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

/**
 * Format time for pickup display (e.g., "2:30 PM")
 */
export function formatTime(date: Date): string {
  return new Intl.DateTimeFormat('en-IE', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(date);
}

/**
 * Calculate estimated pickup time (current time + minutes)
 */
export function getEstimatedPickupTime(minutesFromNow: number = 20): Date {
  const now = new Date();
  now.setMinutes(now.getMinutes() + minutesFromNow);
  return now;
}

/**
 * Validate Irish phone number
 */
export function isValidIrishPhone(phone: string): boolean {
  // Remove spaces and dashes
  const cleaned = phone.replace(/[\s-]/g, '');
  // Irish mobile: 08X XXX XXXX or +353 8X XXX XXXX
  const mobileRegex = /^(\+353|0)8[3-9]\d{7}$/;
  // Irish landline: 01 XXX XXXX or +353 1 XXX XXXX
  const landlineRegex = /^(\+353|0)[1-9]\d{6,8}$/;
  return mobileRegex.test(cleaned) || landlineRegex.test(cleaned);
}

/**
 * Validate email address
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Capitalize first letter of each word
 */
export function capitalizeWords(str: string): string {
  return str.replace(/\b\w/g, char => char.toUpperCase());
}

/**
 * Truncate text with ellipsis
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + '...';
}

/**
 * Generate a simple unique ID
 */
export function generateId(prefix: string = ''): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return prefix ? `${prefix}-${timestamp}-${random}` : `${timestamp}-${random}`;
}

/**
 * Debounce function for search inputs
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * Class names utility (simple cn function)
 */
export function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ');
}
