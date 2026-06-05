import axios from 'axios'
import { get } from '@/utils/request'

const AMAP_CONFIG = {
  key: 'YOUR_AMAP_KEY',
  baseUrl: 'https://restapi.amap.com/v3',
}

export async function geocode(address: string): Promise<any> {
  const response = await axios.get(`${AMAP_CONFIG.baseUrl}/geocode/geo`, {
    params: {
      key: AMAP_CONFIG.key,
      address,
      output: 'JSON',
    },
  })
  return response.data
}

export async function reverseGeocode(lnglat: string): Promise<any> {
  try {
    const res: any = await get('/gis/amap/reverse-geocode', { lnglat })
    return { regeocode: res?.data || {} }
  } catch {
    return { regeocode: {} }
  }
}

export async function routePlanning(
  origin: string,
  destination: string,
  strategy: number = 0
): Promise<any> {
  const response = await axios.get(`${AMAP_CONFIG.baseUrl}/direction/driving`, {
    params: {
      key: AMAP_CONFIG.key,
      origin,
      destination,
      strategy,
      output: 'JSON',
    },
  })
  return response.data
}

export async function searchPOI(
  keywords: string,
  city: string = '',
  types: string = ''
): Promise<any> {
  const response = await axios.get(`${AMAP_CONFIG.baseUrl}/place/text`, {
    params: {
      key: AMAP_CONFIG.key,
      keywords,
      city,
      types,
      output: 'JSON',
    },
  })
  return response.data
}

export async function getElevation(lng: number, lat: number): Promise<number | null> {
  try {
    const res: any = await get('/gis/elevation', { lng, lat })
    if (res?.data?.elevation != null) {
      return res.data.elevation
    }
    return null
  } catch {
    return null
  }
}

export interface EarthquakeData {
  occurTime: string
  magnitude: number
  latitude: number
  longitude: number
  depth: number
  location: string
  reportTime: string
}

export async function getEarthquakeData(range: string = '7d'): Promise<EarthquakeData[]> {
  try {
    const res: any = await get('/gis/earthquake', { range })
    return res?.data || []
  } catch {
    return []
  }
}

export async function getEarthquakeDataWithFilters(params: {
  startDate?: string
  endDate?: string
  minMagnitude?: number
  maxMagnitude?: number
  minDepth?: number
  maxDepth?: number
}): Promise<EarthquakeData[]> {
  try {
    const queryParams: Record<string, any> = {}
    if (params.startDate) queryParams.startDate = params.startDate
    if (params.endDate) queryParams.endDate = params.endDate
    if (params.minMagnitude != null) queryParams.minMagnitude = params.minMagnitude
    if (params.maxMagnitude != null) queryParams.maxMagnitude = params.maxMagnitude
    if (params.minDepth != null) queryParams.minDepth = params.minDepth
    if (params.maxDepth != null) queryParams.maxDepth = params.maxDepth
    const res: any = await get('/gis/earthquake', queryParams)
    return res?.data || []
  } catch {
    return []
  }
}

export interface FloodWarningData {
  wrInfoId: number
  wrIcon: string
  wrTitle: string
  wrDetail: string
  publishTime: string
  expireTime: string
  longitude: number
  latitude: number
  wrType: string
  wrLevel: string
  influenceArea: string
  influenceAreaCd: string
  unitName: string
  detailUrl: string
}

export async function getFloodWarningData(range: string = '7d'): Promise<FloodWarningData[]> {
  try {
    const res: any = await get('/gis/flood-warning', { range })
    return res?.data || []
  } catch {
    return []
  }
}

export async function getFloodWarningDataByDateRange(startDate: string, endDate?: string): Promise<FloodWarningData[]> {
  try {
    const queryParams: Record<string, any> = { startDate }
    if (endDate) queryParams.endDate = endDate
    const res: any = await get('/gis/flood-warning', queryParams)
    return res?.data || []
  } catch {
    return []
  }
}

export interface TyphoonData {
  id: number
  tfid: string
  name: string
  enName: string
  strong: string
  power: string
  speed: string
  pressure: string
  lat: number
  lng: number
  moveDirection: string
  moveSpeed: string
  radius7: string
  radius10: string
  isActive: boolean
  dataTime: string
}

export interface TyphoonPoint {
  id: number
  tfid: string
  pointTime: string
  lat: string
  lng: string
  strong: string
  power: string
  speed: string
  pressure: string
  moveDirection: string
  moveSpeed: string
  radius7: string
  radius10: string
}

export async function getTyphoonData(): Promise<TyphoonData[]> {
  try {
    const res: any = await get('/gis/typhoon')
    return res?.data || []
  } catch {
    return []
  }
}

export async function getActiveTyphoons(): Promise<TyphoonData[]> {
  try {
    const res: any = await get('/gis/typhoon/active')
    return res?.data || []
  } catch {
    return []
  }
}

export async function getTyphoonYears(): Promise<number[]> {
  try {
    const res: any = await get('/gis/typhoon/years')
    return res?.data || []
  } catch {
    return []
  }
}

export async function getTyphoonsByYear(year: number): Promise<TyphoonData[]> {
  try {
    const res: any = await get(`/gis/typhoon/year/${year}`)
    return res?.data || []
  } catch {
    return []
  }
}

export async function getTyphoonPoints(tfid: string): Promise<TyphoonPoint[]> {
  try {
    const res: any = await get(`/gis/typhoon/${tfid}`)
    return res?.data || []
  } catch {
    return []
  }
}

export async function autoCompleteInput(keywords: string, city: string = ''): Promise<any[]> {
  try {
    const res: any = await get('/gis/amap/inputtips', { keywords, city })
    return res?.data || []
  } catch {
    return []
  }
}

export async function getDistrictByAdcode(adcode: string, level: string = 'district'): Promise<any> {
  try {
    const res: any = await get('/gis/amap/district', {
      adcode,
      subdistrict: level === 'township' ? 0 : 1,
      extensions: 'all',
    })
    return res?.data || []
  } catch {
    return []
  }
}

export async function getSubDistricts(adcode: string, level: number = 2, extensions: string = 'base'): Promise<any[]> {
  try {
    const res: any = await get('/gis/amap/district', { adcode, subdistrict: level, extensions })
    const districts = res?.data
    if (!Array.isArray(districts) || districts.length === 0) return []
    if (level === 0) return districts
    return districts[0]?.districts || []
  } catch {
    return []
  }
}

export async function getWeather(city: string): Promise<any> {
  const response = await axios.get(`${AMAP_CONFIG.baseUrl}/weather/weatherInfo`, {
    params: {
      key: AMAP_CONFIG.key,
      city,
      output: 'JSON',
    },
  })
  return response.data
}

export default {
  geocode,
  reverseGeocode,
  routePlanning,
  searchPOI,
  getElevation,
  getWeather,
  autoCompleteInput,
  getDistrictByAdcode,
  getSubDistricts,
}
