import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Bolt Optimization: Cache Intl.NumberFormat instances at module scope as singletons.
// Constructing Intl.NumberFormat instances in render loops or frequent callbacks
// is ~50-80x slower and causes unnecessary garbage collection heap churn.
export const rwfCurrencyFormatter = new Intl.NumberFormat('rw-RW', {
  style: 'currency',
  currency: 'RWF',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

export const rwfDisplayFormatter = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

export const rwfLocaleFormatter = new Intl.NumberFormat('en-RW', {
  maximumFractionDigits: 0,
});

export const standardNumberFormatter = new Intl.NumberFormat('en-US');

/**
 * Format currency in RWF (Rwandan Francs)
 * @param amount - The amount to format
 * @returns Formatted currency string (e.g., "RWF 1,234,567")
 */
export function formatRWF(amount: number): string {
  return rwfCurrencyFormatter.format(amount).replace('RWF', 'RWF');
}

/**
 * Format currency for display with proper spacing
 * @param amount - The amount to format
 * @returns Formatted currency string for UI display
 */
export function formatCurrencyDisplay(amount: number): string {
  return `RWF ${rwfDisplayFormatter.format(amount)}`;
}

/**
 * Get status color class based on status type
 * @param status - The status type ('cleared', 'action', 'blocked', 'info')
 * @returns CSS class for status color
 */
export function getStatusColor(status: 'cleared' | 'action' | 'blocked' | 'info'): string {
  const colors = {
    cleared: 'text-status-cleared bg-status-cleared/10 border-status-cleared/20',
    action: 'text-status-action bg-status-action/10 border-status-action/20',
    blocked: 'text-status-blocked bg-status-blocked/10 border-status-blocked/20',
    info: 'text-status-info bg-status-info/10 border-status-info/20',
  };
  return colors[status] || colors.info;
}

/**
 * Get status icon based on status type
 * @param status - The status type
 * @returns Icon name for the status
 */
export function getStatusIcon(status: 'cleared' | 'action' | 'blocked' | 'info'): string {
  const icons = {
    cleared: 'check_circle',
    action: 'warning',
    blocked: 'block',
    info: 'info',
  };
  return icons[status] || icons.info;
}
