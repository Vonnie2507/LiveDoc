export function formatDate(date: Date | string, format: 'short' | 'long' | 'iso'): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  if (format === 'short') {
    return dateObj.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' });
  }
  
  if (format === 'long') {
    return dateObj.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  }
  
  if (format === 'iso') {
    return dateObj.toISOString();
  }
  
  throw new Error('Invalid format type');
}

export function formatCurrency(amount: number, includeCents: boolean = true): string {
  if (includeCents) {
    return amount.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  
  return amount.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

export function formatPhoneNumber(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  
  if (cleaned.length === 10) {
    return '(' + cleaned.slice(0, 3) + ') ' + cleaned.slice(3, 6) + '-' + cleaned.slice(6);
  }
  
  if (cleaned.length === 11 && cleaned[0] === '1') {
    return '+1 (' + cleaned.slice(1, 4) + ') ' + cleaned.slice(4, 7) + '-' + cleaned.slice(7);
  }
  
  return phone;
}

export function formatDateTime(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const datePart = dateObj.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' });
  const timePart = dateObj.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  
  return datePart + ' at ' + timePart;
}

export function formatPercentage(value: number, decimals: number = 0): string {
  const multiplied = value * 100;
  const rounded = multiplied.toFixed(decimals);
  return rounded + '%';
}