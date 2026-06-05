import { get, post } from '../utils/request'

export const gisService = {
  getGeoData(params: {
    type?: string
    bounds?: string
    limit?: number
    offset?: number
  }): Promise<any> {
    return get('/gis/geo-data', params)
  },

  getLayerData(layerId: string): Promise<any> {
    return get(`/gis/layers/${layerId}`)
  },

  spatialQuery(params: {
    geometry: any
    layerId: string
    buffer?: number
  }): Promise<any> {
    return post('/gis/spatial-query', params)
  },

  spatialAnalysis(params: {
    type: string
    geometry: any
    parameters?: any
  }): Promise<any> {
    return post('/gis/spatial-analysis', params)
  },

  geocode(address: string): Promise<any> {
    return get('/gis/geocode', { address })
  },

  reverseGeocode(lnglat: string): Promise<any> {
    return get('/gis/reverse-geocode', { lnglat })
  },

  exportData(params: {
    format: string
    layerId: string
    bounds?: string
  }): Promise<any> {
    return post('/gis/export', params)
  },
}

export default gisService
