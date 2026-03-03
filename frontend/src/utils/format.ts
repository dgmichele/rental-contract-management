
/**
 * Formats a numeric value as a currency string without decimals,
 * appending the '€' symbol at the end.
 * Example: 450 -> "450€"
 * Example: 1200.50 -> "1201€" (rounded)
 * 
 * @param value The value to format
 * @returns A formatted string
 */
export const formatCurrency = (value: number | string | undefined | null): string => {
  if (value === undefined || value === null || value === '') return '0€';
  
  const num = typeof value === 'string' ? parseFloat(value) : value;
  
  if (isNaN(num)) return '0€';
  
  // Use Intl.NumberFormat for Italian locale to get the thousands separator (e.g., 1.200)
  // but force 0 decimals.
  return new Intl.NumberFormat('it-IT', {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num) + '€';
};
