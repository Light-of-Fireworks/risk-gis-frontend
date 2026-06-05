import { get, post } from '../utils/request'

export interface PointAssessRequest {
  longitude: number
  latitude: number
  disasterTypes?: string[]
}

export interface AreaAssessRequest {
  geometry: string
  disasterTypes?: string[]
}

export interface FactorDetail {
  value: number
  score: number
  weight: number
}

export interface DisasterAssessment {
  disasterType: string
  disasterTypeName: string
  riskScore: number
  riskLevel: string
  riskLevelName: string
  factors: Record<string, FactorDetail>
  gridCount?: number
  areaDistribution?: Record<string, number>
}

export interface RiskAssessResponse {
  assessments: DisasterAssessment[]
  overallRiskLevel: string
  overallRiskScore: number
  areaDistribution?: Record<string, number>
}

export const riskAssessService = {
  async assessPoint(params: PointAssessRequest): Promise<RiskAssessResponse> {
    const res = await post<any>('/risk/assess/point', params)
    return res.data
  },

  async assessArea(params: AreaAssessRequest): Promise<RiskAssessResponse> {
    const res = await post<any>('/risk/assess/area', params)
    return res.data
  },

  async assessRegion(regionCode: string, disasterTypes?: string[]): Promise<RiskAssessResponse> {
    const res = await get<any>(`/risk/assess/region/${regionCode}`, { disasterTypes })
    return res.data
  },
}

export default riskAssessService
