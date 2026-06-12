import api from './api'

export interface OrganizationType {
  value: string
  label: string
  children?: OrganizationType[]
}

interface ApiResponse<T> {
  code: number
  message: string
  data: T
}

export const organizationService = {
  async getTree(): Promise<OrganizationType[]> {
    const res = await api.get<ApiResponse<OrganizationType[]>>('/organization/tree')
    return res.data
  },
}
