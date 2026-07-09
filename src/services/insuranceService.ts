import api from './api'

export interface InsuranceType {
  value: string
  label: string
  children?: InsuranceType[]
}

interface ApiResponse<T> {
  code: number
  message: string
  data: T
}

export interface InsurancePolicyVO {
  id: number
  policyNo: string
  policyHolder: string
  insuredName: string
  categoryName: string
  typeName: string
  targetNo: number
  coverageAmount: number
  premium: number
  startDate: string
  endDate: string
  status: string
  address: string
}

export interface CategoryPolicyStats {
  typeName: string
  targetCount: number
  coverageAmount: number
  premium: number
}

export interface PolicyStats {
  targetCount: number
  coverageAmount: number
  premium: number
  categories: CategoryPolicyStats[]
}

export interface InsurancePolicyGroupVO {
  lng: number
  lat: number
  count: number
  policies: InsurancePolicyVO[]
}

export interface TyphoonPointData {
  lng: number
  lat: number
}

export interface TyphoonData {
  tfid: string
  typhoonName: string
  points: TyphoonPointData[]
}

export interface TyphoonStats {
  tfid: string
  typhoonName: string
  targetCount: number
  coverageAmount: number
  premium: number
}

export interface TotalStats {
  targetCount: number
  coverageAmount: number
  premium: number
}

export interface TyphoonPolicyStatsResponse {
  typhoons: TyphoonStats[]
  total: TotalStats
  policyGroups: InsurancePolicyGroupVO[]
}

export const insuranceService = {
  async getTree(): Promise<InsuranceType[]> {
    const res = await api.get<ApiResponse<InsuranceType[]>>('/insurance/tree')
    return res.data
  },

  async queryByBuffer(params: {
    lng: number
    lat: number
    radius: number
    categoryCodes?: string[]
    typeCodes?: string[]
  }): Promise<InsurancePolicyGroupVO[]> {
    const res = await api.post<ApiResponse<InsurancePolicyGroupVO[]>>('/insurance/policy/query', params)
    return res.data
  },

  async queryByRegion(params: {
    geometry: string
    categoryCodes?: string[]
    typeCodes?: string[]
  }): Promise<InsurancePolicyGroupVO[]> {
    const res = await api.post<ApiResponse<InsurancePolicyGroupVO[]>>('/insurance/policy/query-region', params)
    return res.data
  },

  async queryByTyphoon(params: {
    typhoons: TyphoonData[]
    bufferRadius: number
    endDate?: string
    orgCodes?: string[]
    categoryCodes?: string[]
    typeCodes?: string[]
  }): Promise<TyphoonPolicyStatsResponse> {
    const res = await api.post<ApiResponse<TyphoonPolicyStatsResponse>>('/insurance/policy/query-typhoon', params)
    return res.data
  },
}
