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

export interface InsurancePolicyGroupVO {
  lng: number
  lat: number
  count: number
  policies: InsurancePolicyVO[]
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
}
