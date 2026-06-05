import { Map, View } from 'ol'
import TileLayer from 'ol/layer/Tile'
import XYZ from 'ol/source/XYZ'
import { fromLonLat, toLonLat } from 'ol/proj'
import { defaults as defaultControls } from 'ol/control'

export function createAmapLayer(): TileLayer<XYZ> {
  return new TileLayer({
    source: new XYZ({
      url: 'https://webrd01.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}',
    }),
  })
}

export function createMap(
  target: string,
  center: number[] = [116.397428, 39.90923],
  zoom: number = 5
): Map {
  const map = new Map({
    target,
    layers: [createAmapLayer()],
    view: new View({
      center: fromLonLat(center),
      zoom,
      minZoom: 3,
      maxZoom: 18,
    }),
    controls: defaultControls({
      attribution: false,
      rotate: false,
    }),
  })

  return map
}

export function lngLatToOlCoordinate(lngLat: number[]): number[] {
  return fromLonLat(lngLat)
}

export function olCoordinateToLngLat(coordinate: number[]): number[] {
  return toLonLat(coordinate)
}

export function calculateDistance(coord1: number[], coord2: number[]): number {
  const R = 6371000
  const lat1 = (coord1[1] * Math.PI) / 180
  const lat2 = (coord2[1] * Math.PI) / 180
  const deltaLat = ((coord2[1] - coord1[1]) * Math.PI) / 180
  const deltaLng = ((coord2[0] - coord1[0]) * Math.PI) / 180

  const a =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLng / 2) * Math.sin(deltaLng / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

  return R * c
}

export function formatCoordinate(lngLat: number[]): string {
  const [lng, lat] = lngLat
  return `${lng.toFixed(6)}, ${lat.toFixed(6)}`
}

export default {
  createAmapLayer,
  createMap,
  lngLatToOlCoordinate,
  olCoordinateToLngLat,
  calculateDistance,
  formatCoordinate,
}
