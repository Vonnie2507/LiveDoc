export function validateEmail(email: string): boolean {
  if (!email || typeof email !== 'string' || email.length === 0) {
    return false;
  }
  
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

export function validatePhone(phone: string): boolean {
  if (!phone || typeof phone !== 'string' || phone.length === 0) {
    return false;
  }
  
  const cleaned = phone.replace(/\D/g, '');
  return cleaned.length === 10;
}

export function validateDateRange(startDate: Date, endDate: Date): boolean {
  if (!(startDate instanceof Date) || isNaN(startDate.getTime())) {
    return false;
  }
  
  if (!(endDate instanceof Date) || isNaN(endDate.getTime())) {
    return false;
  }
  
  return startDate.getTime() <= endDate.getTime();
}

export function validateProjectStatus(status: string): boolean {
  const allowedStatuses = ['draft', 'quoted', 'scheduled', 'in_progress', 'completed', 'cancelled'];
  return allowedStatuses.includes(status);
}

export function validateConfidenceScore(score: number): boolean {
  if (typeof score !== 'number') {
    return false;
  }
  
  if (isNaN(score)) {
    return false;
  }
  
  return score >= 0 && score <= 1;
}