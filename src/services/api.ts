import { get, post, put, del } from '../utils/request'

export const api = {
  get<T>(url: string, params?: any): Promise<T> {
    return get<T>(url, params)
  },

  post<T>(url: string, data?: any): Promise<T> {
    return post<T>(url, data)
  },

  put<T>(url: string, data?: any): Promise<T> {
    return put<T>(url, data)
  },

  del<T>(url: string): Promise<T> {
    return del<T>(url)
  },
}

export default api
