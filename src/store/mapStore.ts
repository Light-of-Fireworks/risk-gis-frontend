import { defineStore } from 'pinia'
import { ref } from 'vue'

const INITIAL_CENTER = [104.0, 37.0]
const INITIAL_ZOOM = 4

export const useMapStore = defineStore('map', () => {
  const map = ref<any>(null)
  const currentLayers = ref<any[]>([])
  const center = ref([...INITIAL_CENTER])
  const zoom = ref(INITIAL_ZOOM)
  const baseMapType = ref('amap')

  // 初始状态（用于重置）
  const initialCenter = ref([...INITIAL_CENTER])
  const initialZoom = ref(INITIAL_ZOOM)

  function setMap(mapInstance: any) {
    map.value = mapInstance
  }

  function addLayer(layer: any) {
    currentLayers.value.push(layer)
  }

  function removeLayer(layerId: string) {
    const index = currentLayers.value.findIndex((l: any) => l.id === layerId)
    if (index > -1) {
      currentLayers.value.splice(index, 1)
    }
  }

  function setCenter(newCenter: number[]) {
    center.value = newCenter
  }

  function setZoom(newZoom: number) {
    zoom.value = newZoom
  }

  return {
    map,
    currentLayers,
    center,
    zoom,
    baseMapType,
    initialCenter,
    initialZoom,
    setMap,
    addLayer,
    removeLayer,
    setCenter,
    setZoom,
  }
})
