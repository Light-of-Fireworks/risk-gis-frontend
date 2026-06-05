export function formatNumber(num: number, decimals: number = 0): string {
  return num.toLocaleString('zh-CN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })
}

export function formatCurrency(amount: number, currency: string = 'CNY'): string {
  const formatter = new Intl.NumberFormat('zh-CN', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
  return formatter.format(amount)
}

export function formatDate(
  date: Date | string,
  format: string = 'YYYY-MM-DD HH:mm:ss'
): string {
  const d = typeof date === 'string' ? new Date(date) : date

  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const hours = String(d.getHours()).padStart(2, '0')
  const minutes = String(d.getMinutes()).padStart(2, '0')
  const seconds = String(d.getSeconds()).padStart(2, '0')

  return format
    .replace('YYYY', String(year))
    .replace('MM', month)
    .replace('DD', day)
    .replace('HH', hours)
    .replace('mm', minutes)
    .replace('ss', seconds)
}

export function calculateRiskLevel(score: number): string {
  if (score >= 0.7) return 'high'
  if (score >= 0.4) return 'medium'
  return 'low'
}

export function getRiskLevelColor(level: string): string {
  const colorMap: Record<string, string> = {
    high: '#f56c6c',
    medium: '#e6a23c',
    low: '#67c23a',
  }
  return colorMap[level] || '#909399'
}

export function getRiskLevelLabel(level: string): string {
  const labelMap: Record<string, string> = {
    high: '高风险',
    medium: '中风险',
    low: '低风险',
  }
  return labelMap[level] || '未知'
}

export function getDisasterTypeLabel(type: string): string {
  const labelMap: Record<string, string> = {
    earthquake: '地震',
    flood: '洪水',
    typhoon: '台风',
    landslide: '滑坡',
    mudflow: '泥石流',
    drought: '干旱',
    hail: '冰雹',
    snowstorm: '暴雪',
    forest_fire: '森林火灾',
  }
  return labelMap[type] || type
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2)
}

export function deepClone<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') {
    return obj
  }

  if (obj instanceof Date) {
    return new Date(obj.getTime()) as any
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => deepClone(item)) as any
  }

  const cloned = {} as any
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      cloned[key] = deepClone(obj[key])
    }
  }

  return cloned
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null

  return (...args: Parameters<T>) => {
    if (timeout) {
      clearTimeout(timeout)
    }

    timeout = setTimeout(() => {
      func(...args)
    }, wait)
  }
}

export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean = false

  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => {
        inThrottle = false
      }, limit)
    }
  }
}
