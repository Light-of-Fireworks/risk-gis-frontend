import { get, post } from '../utils/request'

export const riskService = {
  getRiskData(params: {
    type?: string
    level?: string
    bounds?: string
    limit?: number
    offset?: number
  }): Promise<any> {
    return get('/risk/data', params)
  },

  getRiskStats(params?: {
    type?: string
    timeRange?: string
  }): Promise<any> {
    return get('/risk/stats', params)
  },

  getDisasterRecords(params: {
    type?: string
    startTime?: string
    endTime?: string
    bounds?: string
    limit?: number
    offset?: number
  }): Promise<any> {
    return get('/risk/disasters', params)
  },

  getWarnings(params?: {
    type?: string
    level?: string
    timeRange?: string
  }): Promise<any> {
    return get('/risk/warnings', params)
  },

  submitUnderwriting(data: {
    name: string
    type: string
    address: string
    amount: number
    location?: any
  }): Promise<any> {
    return post('/risk/underwriting', data)
  },

  getUnderwritingResult(id: string): Promise<any> {
    return get(`/risk/underwriting/${id}`)
  },

  getClaims(params?: {
    status?: string
    disasterType?: string
    limit?: number
    offset?: number
  }): Promise<any> {
    return get('/risk/claims', params)
  },

  handleClaim(
    id: string,
    data: {
      action: string
      comment?: string
      amount?: number
    }
  ): Promise<any> {
    return post(`/risk/claims/${id}/handle`, data)
  },
}

export default riskService
