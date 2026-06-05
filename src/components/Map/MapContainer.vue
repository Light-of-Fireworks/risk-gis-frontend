<template>
  <div class="map-container">
    <div ref="mapRef" class="map"></div>
    <RiskQuery v-if="showRiskQuery" @risk-result="onRiskResult" />
    <RiskResultPanel :visible="showRiskResult" :data="riskResultData" @close="showRiskResult = false" />
    <div class="map-controls">
      <DrawTools @measure-change="handleMeasureChange" @clear="clearDrawings" />
    </div>
    <div class="map-coord-bar" v-show="coordText || scaleText">
      <span class="coord-text" v-show="coordText">{{ coordText }}</span>
      <span class="scale-text" v-show="scaleText">{{ scaleText }}</span>
    </div>
    <Popup :visible="popupVisible" :title="popupTitle" :content="popupContent" :position="popupPosition" @close="popupVisible = false" />
    <Loading :loading="loading" text="地图加载中..." />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import { useMapStore } from '@/store/mapStore'
import { createMap, olCoordinateToLngLat } from '@/utils/mapUtils'
import { getElevation } from '@/services/amapService'
import type { Map } from 'ol'
import type { DrawEvent } from 'ol/interaction/Draw'
import DrawTools from './DrawTools.vue'
import RiskQuery from './RiskQuery.vue'
import RiskResultPanel from './RiskResultPanel.vue'
import type { RiskAssessResponse } from '@/services/riskAssess'
import Popup from './Popup.vue'
import Loading from '@/components/Common/Loading.vue'

// OpenLayers imports
import VectorLayer from 'ol/layer/Vector'
import VectorSource from 'ol/source/Vector'
import Draw from 'ol/interaction/Draw'
import { Style, Stroke, Fill, Circle as CircleStyle } from 'ol/style'
import { unByKey } from 'ol/Observable'
import type { EventsKey } from 'ol/Observable'

const props = defineProps<{
  showRiskQuery?: boolean
}>()
import { toLonLat } from 'ol/proj'

const mapRef = ref<HTMLElement | null>(null)
const loading = ref(true)
const mapStore = useMapStore()
let mapInstance: Map | null = null
let retryTimer: ReturnType<typeof setTimeout> | null = null

const coordText = ref('')
const scaleText = ref('')

const showRiskResult = ref(false)
const riskResultData = ref<RiskAssessResponse | null>(null)

const popupVisible = ref(false)
const popupTitle = ref('')
const popupContent = ref('')
const popupPosition = ref({ x: 0, y: 0 })

// 绘图相关
let drawLayer: VectorLayer<VectorSource> | null = null
let drawInteraction: Draw | null = null
let measureItems: Map<string, { element: HTMLElement, feature: any }> = new Map()
let measureIdCounter = 0
let listener: EventsKey | null = null
let currentMeasureId: string = ''

// 测量样式
const drawStyles = {
  measure: new Style({
    stroke: new Stroke({ color: '#e6a23c', width: 3, lineDash: [10, 10] }),
    fill: new Fill({ color: 'rgba(230, 162, 60, 0.2)' }),
    image: new CircleStyle({
      radius: 5,
      fill: new Fill({ color: '#e6a23c' }),
      stroke: new Stroke({ color: '#fff', width: 2 }),
    }),
  }),
}

function onRiskResult(data: RiskAssessResponse) {
  riskResultData.value = data
  showRiskResult.value = true
}

function destroyMap() {
  if (retryTimer) {
    clearTimeout(retryTimer)
    retryTimer = null
  }
  if (mapInstance) {
    mapInstance.setTarget(undefined)
    mapInstance = null
  }
  mapStore.setMap(null)
}

function initMap() {
  if (mapRef.value && mapRef.value.offsetWidth > 0 && mapRef.value.offsetHeight > 0) {
    mapInstance = createMap(mapRef.value, mapStore.center, mapStore.zoom)
    mapStore.setMap(mapInstance)

    // 右下角：经纬度 + 比例尺
    updateScale()
    mapInstance.on('moveend', updateScale)
    mapInstance.on('pointermove', (evt: any) => {
      if (evt.coordinate) {
        const [lng, lat] = toLonLat(evt.coordinate)
        coordText.value = `LAT：${lat.toFixed(5)}  LON：${lng.toFixed(5)}`
      }
    })
    mapRef.value.addEventListener('pointerleave', () => {
      coordText.value = ''
    })

    // 创建绘图图层
    drawLayer = new VectorLayer({
      source: new VectorSource(),
      style: new Style({
        stroke: new Stroke({ color: '#409eff', width: 3 }),
        fill: new Fill({ color: 'rgba(64, 158, 255, 0.2)' }),
        image: new CircleStyle({
          radius: 7,
          fill: new Fill({ color: '#409eff' }),
          stroke: new Stroke({ color: '#fff', width: 2 }),
        }),
      }),
    })
    mapInstance.addLayer(drawLayer)

    mapInstance.on('moveend', () => {
      if (mapInstance) {
        const view = mapInstance.getView()
        const center = view.getCenter()
        if (center) {
          const lngLat = olCoordinateToLngLat(center)
          mapStore.setCenter([lngLat[0], lngLat[1]])
        }
        mapStore.setZoom(view.getZoom() || 5)

        // 更新测量标签位置
        measureItems.forEach((item) => {
          if (item.feature) {
            const geom = item.feature.getGeometry()
            if (geom) {
              let coord: number[] | undefined
              if (geom.getType() === 'Polygon') {
                coord = (geom as any).getCoordinates()[0][0]
              } else if (geom.getLastCoordinate) {
                coord = geom.getLastCoordinate()
              }
              if (coord) {
                const pixel = mapInstance.getPixelFromCoordinate(coord)
                if (pixel) {
                  item.element.style.left = pixel[0] + 'px'
                  item.element.style.top = (pixel[1] - 15) + 'px'
                }
              }
            }
          }
        })
      }
    })

    loading.value = false
  } else {
    retryTimer = setTimeout(initMap, 100)
  }
}

function updateScale() {
  if (!mapInstance) return
  const view = mapInstance.getView()
  const resolution = view.getResolution()
  if (!resolution) return
  // EPSG:3857 的 resolution 本身就是每像素对应的地面米数（赤道处）
  const metersPerPx = Math.abs(resolution)
  // 目标：100 像素对应的地面距离
  const targetMeters = metersPerPx * 100
  // 取整到合适的档位
  const niceSteps = [1, 2, 5, 10, 20, 25, 50, 100, 200, 250, 500, 1000, 2000, 5000, 10000, 20000, 25000, 50000, 100000, 200000, 500000, 1000000, 2000000, 5000000]
  let best = niceSteps[0]
  for (const step of niceSteps) {
    if (step <= targetMeters) {
      best = step
    } else {
      break
    }
  }
  if (best >= 1000) {
    scaleText.value = `${best / 1000} km`
  } else {
    scaleText.value = `${best} m`
  }
}

function handleMeasureChange(measureType: string) {
  if (!mapInstance || !drawLayer) return

  // 移除之前的绘图交互
  removeDrawInteraction()

  if (!measureType) return

  const source = drawLayer.getSource()
  if (!source) return

  if (measureType === 'height') {
    // 测高度：点击查询高程
    drawInteraction = new Draw({
      source: source,
      type: 'Point',
      style: drawStyles.measure,
    })

    drawInteraction.on('drawend', (event: DrawEvent) => {
      const measureId = `measure_${++measureIdCounter}`
      const feature = event.feature
      feature.set('_measureId', measureId)

      const tooltipElement = document.createElement('div')
      tooltipElement.className = 'measure-tooltip'

      const clearBtn = document.createElement('span')
      clearBtn.className = 'measure-clear-btn'
      clearBtn.innerHTML = '×'
      clearBtn.onclick = (e) => {
        e.stopPropagation()
        clearSingleDrawing(measureId)
      }

      tooltipElement.appendChild(document.createTextNode('查询中... '))
      tooltipElement.appendChild(clearBtn)
      document.body.appendChild(tooltipElement)

      measureItems.set(measureId, { element: tooltipElement, feature })

      if (mapInstance) {
        const coord = (feature.getGeometry() as any).getCoordinates()
        const pixel = mapInstance.getPixelFromCoordinate(coord)
        if (pixel) {
          tooltipElement.style.left = pixel[0] + 'px'
          tooltipElement.style.top = (pixel[1] - 15) + 'px'
        }

        const lngLat = olCoordinateToLngLat(coord)
        getElevation(lngLat[0], lngLat[1]).then((elevation) => {
          tooltipElement.innerHTML = ''
          const text = elevation != null ? `${elevation.toFixed(2)} m` : '查询失败'
          tooltipElement.appendChild(document.createTextNode(text + ' '))
          tooltipElement.appendChild(clearBtn)
        })
      }
    })
  } else {
    // 测距离 / 测面积
    let type: 'LineString' | 'Polygon' | undefined
    let style = drawStyles.measure

    switch (measureType) {
      case 'distance':
        type = 'LineString'
        break
      case 'area':
        type = 'Polygon'
        break
    }

    if (!type) return

    drawInteraction = new Draw({
      source: source,
      type: type,
      style: style,
    })

    drawInteraction.on('drawstart', (event: DrawEvent) => {
      // 为新的绘制创建测量提示
      const measureId = `measure_${++measureIdCounter}`
      currentMeasureId = measureId

      // 创建测量提示元素
      const tooltipElement = document.createElement('div')
      tooltipElement.className = 'measure-tooltip'

      // 创建清除按钮
      const clearBtn = document.createElement('span')
      clearBtn.className = 'measure-clear-btn'
      clearBtn.innerHTML = '×'
      clearBtn.onclick = (e) => {
        e.stopPropagation()
        clearSingleDrawing(measureId)
      }

      tooltipElement.appendChild(document.createTextNode('测量中... '))
      tooltipElement.appendChild(clearBtn)
      document.body.appendChild(tooltipElement)

      measureItems.set(measureId, { element: tooltipElement, feature: event.feature })

      // 给 sketch feature 添加标记
      event.feature.set('_measureId', measureId)

      const sketch = event.feature
      const geometry = sketch.getGeometry()

      if (geometry) {
        listener = geometry.on('change', (evt) => {
          const geom = evt.target
          let output = ''
          if (measureType === 'distance' && geom.getType() === 'LineString') {
            const length = geom.getLength()
            output = formatLength(length)
          } else if (measureType === 'area' && geom.getType() === 'Polygon') {
            const area = geom.getArea()
            output = formatArea(area)
          }

          // 更新测量提示
          tooltipElement.innerHTML = ''
          tooltipElement.appendChild(document.createTextNode(output + ' '))
          tooltipElement.appendChild(clearBtn)

          if (mapInstance) {
            const coord = geom.getType() === 'Polygon'
              ? (geom as any).getCoordinates()[0][0]
              : geom.getLastCoordinate()
            const pixel = mapInstance.getPixelFromCoordinate(coord)
            if (pixel) {
              tooltipElement.style.left = pixel[0] + 'px'
              tooltipElement.style.top = (pixel[1] - 15) + 'px'
            }
          }
        })
      }
    })

    drawInteraction.on('drawend', (event: DrawEvent) => {
      if (listener) {
        unByKey(listener)
        listener = null
      }

      // 将 feature 与测量提示关联
      const measureId = event.feature.get('_measureId')
      if (measureId && measureItems.has(measureId)) {
        measureItems.get(measureId)!.feature = event.feature
      }
    })
  }

  mapInstance.addInteraction(drawInteraction)
}

function removeDrawInteraction() {
  if (drawInteraction && mapInstance) {
    mapInstance.removeInteraction(drawInteraction)
    drawInteraction = null
  }
  if (listener) {
    unByKey(listener)
    listener = null
  }
}

function clearSingleDrawing(measureId: string) {
  const item = measureItems.get(measureId)
  if (!item) return

  // 移除对应的图形
  if (drawLayer) {
    const source = drawLayer.getSource()
    if (source) {
      let featureToRemove = null

      // 优先使用存储的 feature
      if (item.feature) {
        featureToRemove = item.feature
      } else {
        // 通过标记查找
        const features = source.getFeatures()
        for (const f of features) {
          if (f.get('_measureId') === measureId) {
            featureToRemove = f
            break
          }
        }
      }

      // 移除找到的 feature
      if (featureToRemove) {
        source.removeFeature(featureToRemove)
      }
    }
  }

  // 移除测量提示
  if (item.element.parentNode) {
    item.element.parentNode.removeChild(item.element)
  }

  // 从 Map 中移除
  measureItems.delete(measureId)

  // 更新当前ID
  if (currentMeasureId === measureId) {
    currentMeasureId = ''
  }
}

function clearDrawings() {
  if (drawLayer) {
    const source = drawLayer.getSource()
    if (source) {
      source.clear()
    }
  }
  removeDrawInteraction()
  removeMeasureTooltip()
}

function formatLength(length: number): string {
  if (length > 1000) {
    return (length / 1000).toFixed(2) + ' km'
  }
  return length.toFixed(2) + ' m'
}

function formatArea(area: number): string {
  if (area > 1000000) {
    return (area / 1000000).toFixed(2) + ' km²'
  }
  return area.toFixed(2) + ' m²'
}


function removeMeasureTooltip() {
  measureItems.forEach((item) => {
    if (item.element.parentNode) {
      item.element.parentNode.removeChild(item.element)
    }
  })
  measureItems.clear()
  currentMeasureId = ''
}

onMounted(() => {
  nextTick(() => {
    initMap()
  })
})

onUnmounted(() => {
  destroyMap()
  removeMeasureTooltip()
})
</script>

<style lang="scss" scoped>
.map-container {
  position: relative;
  width: 100%;
  height: 100%;
}

.map {
  width: 100%;
  height: 100%;
}

.map-controls {
  position: absolute;
  bottom: 10px;
  left: 80px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  z-index: 1000;
}
</style>

<style lang="scss">
/* OpenLayers 缩放控件 */
.ol-zoom {
  position: absolute !important;
  left: 10px !important;
  bottom: 10px !important;
  margin-left: 0 !important;
  top: auto !important;
  right: auto !important;
  display: flex !important;
  flex-direction: row !important;
  border-radius: 4px !important;
  overflow: hidden !important;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15) !important;

  .ol-zoom-in,
  .ol-zoom-out {
    display: block !important;
    width: 32px !important;
    height: 32px !important;
    font-size: 20px !important;
    font-weight: 400 !important;
    line-height: 32px !important;
    background-color: #fff !important;
    color: #606266 !important;
    border: none !important;
    margin: 0 !important;
    padding: 0 !important;
    cursor: pointer !important;
    text-align: center !important;
    transition: background-color 0.2s !important;

    &:hover {
      background-color: #ecf5ff !important;
      color: #409eff !important;
    }
  }

  .ol-zoom-in {
    border-radius: 4px 0 0 4px !important;
    border-right: 1px solid #e4e7ed !important;
  }

  .ol-zoom-out {
    border-radius: 0 4px 4px 0 !important;
  }
}

.measure-tooltip {
  position: absolute;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  white-space: nowrap;
  pointer-events: auto;
  z-index: 1000;
  display: flex;
  align-items: center;
  gap: 6px;
}

.measure-clear-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.3);
  color: white;
  font-size: 14px;
  line-height: 1;
  cursor: pointer;
  transition: background 0.2s;

  &:hover {
    background: rgba(255, 255, 255, 0.5);
  }
}

/* 右下角坐标+比例尺 */
.map-coord-bar {
  position: absolute;
  bottom: 8px;
  right: 0;
  padding-right: 10px;
  display: flex;
  align-items: center;
  gap: 14px;
  z-index: 100;
  pointer-events: none;
  color: #fff;
  font-size: 12px;
  font-family: monospace;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8);
  white-space: nowrap;
}

.coord-text {
  letter-spacing: 0.5px;
}

.scale-text {
  letter-spacing: 0.5px;
}
</style>
