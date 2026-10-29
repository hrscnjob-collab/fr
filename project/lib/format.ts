export function formatSalary(min: number, max: number, period?: string): string {
  if (!min && !max) return 'Salary not specified';
  const rawPeriod = (period || 'monthly').toLowerCase();
  const suffix = rawPeriod === 'daily' || rawPeriod.includes('day') 
    ? 'per day' 
    : rawPeriod.includes('annual') || rawPeriod.includes('year') || rawPeriod.includes('annum') 
    ? 'per annum' 
    : 'per month';

  const formatLakh = (val: number) => {
    if (rawPeriod.includes('annual') || rawPeriod.includes('year') || rawPeriod.includes('annum')) {
      if (val >= 100000) {
        return `₹${(val / 100000).toFixed(1).replace('.0', '')} Lakh`;
      }
    }
    return `₹${val.toLocaleString('en-IN')}`;
  };

  if (min === max || (!max && min)) return `${formatLakh(min)} ${suffix}`;
  return `${formatLakh(min)} - ${formatLakh(max)} ${suffix}`;
}

export function formatSalaryShort(val: number, period?: string): string {
  if (!val) return '₹0';
  const rawPeriod = (period || 'monthly').toLowerCase();
  const suffix = rawPeriod === 'daily' || rawPeriod.includes('day') 
    ? 'per day' 
    : rawPeriod.includes('annual') || rawPeriod.includes('year') || rawPeriod.includes('annum') 
    ? 'per annum' 
    : 'per month';

  if (val >= 100000) return `₹${(val / 100000).toFixed(1).replace('.0', '')} Lakh ${suffix}`;
  return `₹${val.toLocaleString('en-IN')} ${suffix}`;
}

export function timeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 4) return `${weeks}w ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function formatDateTime(dateString: string): string {
  return new Date(dateString).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function getInitials(name?: string | null): string {
  if (!name || typeof name !== 'string') return 'U';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'U';
  return parts
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export function formatExpectedSalary(min?: number | null, max?: number | null, period?: string): string {
  if (!min && !max) return 'Not specified';
  const minVal = min || 0;
  const maxVal = max || minVal;
  if (minVal === 0 && maxVal === 0) return 'Not specified';

  const rawPeriod = (period || 'monthly').toLowerCase();
  const suffix = rawPeriod === 'daily' || rawPeriod.includes('day') 
    ? 'per day' 
    : rawPeriod.includes('annual') || rawPeriod.includes('year') || rawPeriod.includes('annum') 
    ? 'per annum' 
    : 'per month';

  if (rawPeriod.includes('annual') || rawPeriod.includes('year') || rawPeriod.includes('annum')) {
    if (minVal >= 100000) {
      const minL = (minVal / 100000).toFixed(1).replace('.0', '');
      const maxL = (maxVal / 100000).toFixed(1).replace('.0', '');
      if (minVal === maxVal) return `₹${minL} Lakh ${suffix}`;
      return `₹${minL} Lakh - ₹${maxL} Lakh ${suffix}`;
    }
  }

  if (minVal === maxVal) return `₹${minVal.toLocaleString('en-IN')} ${suffix}`;
  return `₹${minVal.toLocaleString('en-IN')} - ₹${maxVal.toLocaleString('en-IN')} ${suffix}`;
}

/** 30 -> "2 yrs 6 mo", 12 -> "1 yr", 5 -> "5 mo", 0 -> "0 yrs" */
export function formatExperienceMonths(totalMonths?: number | null): string {
  const total = Math.max(0, Math.round(Number(totalMonths) || 0));
  const years = Math.floor(total / 12);
  const months = total % 12;
  const parts: string[] = [];
  if (years > 0) parts.push(`${years} ${years === 1 ? 'yr' : 'yrs'}`);
  if (months > 0) parts.push(`${months} mo`);
  return parts.length > 0 ? parts.join(' ') : '0 yrs';
}

/** Range label from months: "1 yr 6 mo - 3 yrs", "2 yrs+", or "Fresher". */
export function formatExperienceRange(
  minMonths?: number | null,
  maxMonths?: number | null,
  freshersOnly?: boolean
): string {
  if (freshersOnly) return 'Fresher';
  const min = Math.max(0, Number(minMonths) || 0);
  const hasMax = maxMonths !== undefined && maxMonths !== null && Number(maxMonths) > min;
  if (hasMax) return `${formatExperienceMonths(min)} - ${formatExperienceMonths(Number(maxMonths))}`;
  if (min === 0) return 'Fresher / 0 yrs';
  return `${formatExperienceMonths(min)}+`;
}