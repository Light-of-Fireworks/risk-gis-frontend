<template>
  <div class="disaster-container">
    <!-- 全屏地图 -->
    <div class="map-wrapper">
      <MapContainer />
    </div>

    <!-- 左上角灾害类型图标 -->
    <div class="disaster-icons">
      <el-tooltip content="台风" placement="right">
        <div class="icon-btn" :class="{ active: activeType === 'typhoon' }" @click="toggleType('typhoon')">
          <span class="icon-emoji">🌀</span>
        </div>
      </el-tooltip>
      <el-tooltip content="洪水" placement="right">
        <div class="icon-btn" :class="{ active: activeType === 'flood' }" @click="toggleType('flood')">
          <span class="icon-emoji">🌊</span>
        </div>
      </el-tooltip>
      <el-tooltip content="地震" placement="right">
        <div class="icon-btn" :class="{ active: activeType === 'earthquake' }" @click="toggleType('earthquake')">
          <span class="icon-emoji">🔔</span>
        </div>
      </el-tooltip>
    </div>

    <!-- 筛选面板（图标右侧） -->
    <transition name="slide-filter">
      <div v-if="activeType" class="filter-panel">
        <!-- 台风筛选 -->
        <template v-if="activeType === 'typhoon'">
          <div class="filter-title">台风预警</div>
          <el-radio-group v-model="typhoonMode" size="small" @change="onTyphoonModeChange">
            <el-radio-button value="realtime">实时台风</el-radio-button>
            <el-radio-button value="history">历史台风</el-radio-button>
          </el-radio-group>
          <!-- 历史台风：年份选择 + 台风名称多选 -->
          <template v-if="typhoonMode === 'history'">
            <el-select
              v-model="selectedYear"
              placeholder="选择年份"
              style="width: 100%; margin-top: 12px"
              @change="onYearChange"
            >
              <el-option v-for="y in typhoonYears" :key="y" :label="y + '年'" :value="y" />
            </el-select>
            <el-select
              v-model="selectedTyphoonIds"
              multiple
              collapse-tags
              collapse-tags-tooltip
              placeholder="选择台风（可多选）"
              style="width: 100%; margin-top: 12px"
              @change="onTyphoonSelect"
            >
              <el-option
                v-for="t in yearTyphoons"
                :key="t.tfid"
                :label="t.name + '(' + t.enName + ')'"
                :value="t.tfid"
              />
            </el-select>
          </template>
        </template>

        <!-- 洪水筛选 -->
        <template v-if="activeType === 'flood'">
          <div class="filter-title">洪水预警</div>
          <div class="filter-label">时间范围</div>
          <el-date-picker
            v-model="floodDateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD"
            style="width: 100%"
            @change="onFloodDateChange"
          />
        </template>

        <!-- 地震筛选 -->
        <template v-if="activeType === 'earthquake'">
          <div class="filter-title">地震预警</div>
          <div class="filter-label">时间范围</div>
          <el-date-picker
            v-model="earthquakeDateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD"
            style="width: 100%"
            @change="onEarthquakeFilterChange"
          />
          <div class="filter-label">震级范围</div>
          <el-slider v-model="magnitudeRange" :min="0" :max="10" :step="0.5" range show-stops @change="onEarthquakeFilterChange" />
          <div class="filter-label">深度范围 (km)</div>
          <div class="depth-input-row">
            <el-input-number v-model="depthRange[0]" :min="0" :max="depthRange[1]" :step="1" size="small" controls-position="right" @change="onEarthquakeFilterChange" />
            <span class="depth-sep">至</span>
            <el-input-number v-model="depthRange[1]" :min="depthRange[0]" :max="700" :step="1" size="small" controls-position="right" @change="onEarthquakeFilterChange" />
          </div>
        </template>
      </div>
    </transition>

    <!-- 右上角事件列表 -->
    <div v-if="activeType" class="event-list-panel" :class="{ collapsed: !eventListVisible }">
      <div class="event-list-header" @click="eventListVisible = !eventListVisible">
        <span class="event-list-title">事件列表</span>
        <el-badge :value="warnings.length" :max="99" type="danger" class="event-badge" />
        <el-icon class="event-toggle-icon">
          <ArrowDown v-if="!eventListVisible" />
          <ArrowUp v-else />
        </el-icon>
      </div>
      <div v-show="eventListVisible" class="event-list-body">
        <!-- 地震：四列表格布局 -->
        <template v-if="activeType === 'earthquake'">
          <div class="eq-table-header">
            <span class="eq-col-time">时间</span>
            <span class="eq-col-loc">参考位置</span>
            <span class="eq-col-mag">震级</span>
            <span class="eq-col-depth">深度</span>
          </div>
          <div
            v-for="w in warnings"
            :key="w.id"
            class="eq-table-row"
            :class="w.level"
            @click="selectWarning(w)"
          >
            <span class="eq-col-time">{{ w.time }}</span>
            <el-tooltip :content="w.location" placement="top" :show-after="300">
              <span class="eq-col-loc">{{ w.location }}</span>
            </el-tooltip>
            <span class="eq-col-mag">
              <span class="mag-badge" :class="w.level">{{ w.magnitude }}</span>
            </span>
            <span class="eq-col-depth">{{ w.depth }}km</span>
          </div>
        </template>
        <!-- 其他灾害类型：通用列表布局 -->
        <template v-else>
          <div
            v-for="w in warnings"
            :key="w.id"
            class="event-item"
            :class="w.level"
            @click="selectWarning(w)"
          >
            <div class="event-item-header">
              <span class="event-type">{{ w.type }}</span>
              <span class="event-time">{{ w.time }}</span>
            </div>
            <div class="event-content">{{ w.content }}</div>
          </div>
        </template>
        <el-empty v-if="!loading && warnings.length === 0" description="暂无数据" :image-size="60" />
      </div>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="loading-indicator">
      <el-icon class="is-loading"><Loading /></el-icon>
      <span>数据加载中...</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { ArrowDown, ArrowUp, Loading } from '@element-plus/icons-vue'
import MapContainer from '@/components/Map/MapContainer.vue'
import { useMapStore } from '@/store/mapStore'
import {
  getEarthquakeDataWithFilters,
  type EarthquakeData,
  getFloodWarningData,
  getFloodWarningDataByDateRange,
  type FloodWarningData,
  getActiveTyphoons,
  getTyphoonYears,
  getTyphoonsByYear,
  getTyphoonPoints,
  type TyphoonData,
  type TyphoonPoint,
} from '@/services/amapService'
import { fromLonLat } from 'ol/proj'
import VectorLayer from 'ol/layer/Vector'
import VectorSource from 'ol/source/Vector'
import Feature from 'ol/Feature'
import Point from 'ol/geom/Point'
import { Style, Fill, Stroke, Text as TextStyle, Circle as CircleStyle } from 'ol/style'
import Overlay from 'ol/Overlay'
import LineString from 'ol/geom/LineString'

const mapStore = useMapStore()
const loading = ref(false)

// 灾害类型
const activeType = ref<string | null>(null)

// 台风相关
const typhoonMode = ref<'realtime' | 'history'>('realtime')
const typhoonYears = ref<number[]>([])
const selectedYear = ref<number | null>(null)
const yearTyphoons = ref<TyphoonData[]>([])
const selectedTyphoonIds = ref<string[]>([])

// 洪水日期范围
const floodDateRange = ref<[string, string] | null>(null)

// 地震日期范围
const earthquakeDateRange = ref<[string, string] | null>(null)

// 地震筛选
const magnitudeRange = ref<[number, number]>([0, 10])
const depthRange = ref([0, 700])

// 事件列表
const eventListVisible = ref(true)
const warnings = ref<Warning[]>([])

// 地图图层
let earthquakeLayer: VectorLayer<VectorSource> | null = null
let floodLayer: VectorLayer<VectorSource> | null = null
let typhoonLayer: VectorLayer<VectorSource> | null = null
let typhoonTrajectoryLayer: VectorLayer<VectorSource> | null = null
let clickOverlay: Overlay | null = null
let popupContainer: HTMLDivElement | null = null

interface Warning {
  id: number
  type: string
  level: string
  time: string
  content: string
  location: string
  lng?: number
  lat?: number
  tfid?: string
  magnitude?: number
  depth?: number
}

// ============ 灾害类型切换 ============

function toggleType(type: string) {
  if (activeType.value === type) {
    activeType.value = null
    clearAllLayers()
    warnings.value = []
    return
  }
  activeType.value = type
  clearAllLayers()
  warnings.value = []
  loadDataForType(type)
}

function clearAllLayers() {
  if (earthquakeLayer) earthquakeLayer.setSource(new VectorSource())
  if (floodLayer) floodLayer.setSource(new VectorSource())
  if (typhoonLayer) typhoonLayer.setSource(new VectorSource())
  if (typhoonTrajectoryLayer) typhoonTrajectoryLayer.setSource(new VectorSource())
  if (clickOverlay) clickOverlay.setPosition(undefined)
}

function loadDataForType(type: string) {
  if (type === 'typhoon') {
    if (typhoonMode.value === 'realtime') {
      fetchActiveTyphoons()
    } else {
      loadTyphoonYears()
    }
  } else if (type === 'flood') {
    fetchFloodData()
  } else if (type === 'earthquake') {
    fetchEarthquakeData()
  }
}

// ============ 台风 ============

function onTyphoonModeChange(mode: string) {
  clearAllLayers()
  warnings.value = []
  selectedTyphoonIds.value = []
  selectedYear.value = null
  yearTyphoons.value = []
  if (mode === 'realtime') {
    fetchActiveTyphoons()
  } else {
    loadTyphoonYears()
  }
}

async function loadTyphoonYears() {
  typhoonYears.value = await getTyphoonYears()
}

async function onYearChange(year: number) {
  selectedTyphoonIds.value = []
  yearTyphoons.value = await getTyphoonsByYear(year)
  clearAllLayers()
  warnings.value = []
}

async function onTyphoonSelect(ids: string[]) {
  if (ids.length === 0) {
    if (typhoonLayer) typhoonLayer.setSource(new VectorSource())
    if (typhoonTrajectoryLayer) typhoonTrajectoryLayer.setSource(new VectorSource())
    warnings.value = []
    return
  }

  loading.value = true
  try {
    const allPoints: { tfid: string; points: TyphoonPoint[] }[] = []
    const selectedTyphoons = yearTyphoons.value.filter((t) => ids.includes(t.tfid))

    // 为每个选中的台风加载轨迹
    for (const tfid of ids) {
      const points = await getTyphoonPoints(tfid)
      if (points.length > 0) {
        allPoints.push({ tfid, points })
      }
    }

    // 更新台风标记图层
    const layer = ensureTyphoonLayer()
    if (layer) {
      layer.setSource(new VectorSource({ features: createTyphoonFeatures(selectedTyphoons) }))
    }

    // 更新轨迹图层
    const trajLayer = ensureTyphoonTrajectoryLayer()
    if (trajLayer) {
      const allFeatures: Feature[] = []
      for (const item of allPoints) {
        allFeatures.push(...createTyphoonTrajectoryFeatures(item.points))
      }
      trajLayer.setSource(new VectorSource({ features: allFeatures }))
    }

    // 更新事件列表
    warnings.value = convertTyphoonToWarnings(selectedTyphoons)

    // 缩放到轨迹范围
    const map = mapStore.map
    if (map && allPoints.length > 0) {
      const allCoords: number[][] = []
      for (const item of allPoints) {
        for (const p of item.points) {
          allCoords.push(fromLonLat([parseFloat(p.lng), parseFloat(p.lat)]))
        }
      }
      if (allCoords.length > 0) {
        const extent = new LineString(allCoords).getExtent()
        map.getView().fit(extent, { padding: [100, 400, 100, 100], duration: 500 })
      }
    }
  } finally {
    loading.value = false
  }
}

async function fetchActiveTyphoons() {
  loading.value = true
  try {
    const data = await getActiveTyphoons()
    warnings.value = convertTyphoonToWarnings(data)

    if (clickOverlay) clickOverlay.setPosition(undefined)
    if (typhoonTrajectoryLayer) typhoonTrajectoryLayer.setSource(new VectorSource())

    const layer = ensureTyphoonLayer()
    if (layer) {
      layer.setSource(new VectorSource({ features: createTyphoonFeatures(data) }))
    }
  } finally {
    loading.value = false
  }
}

// ============ 洪水 ============

function onFloodDateChange() {
  fetchFloodData()
}

async function fetchFloodData() {
  loading.value = true
  try {
    let data: FloodWarningData[]
    if (floodDateRange.value) {
      data = await getFloodWarningDataByDateRange(floodDateRange.value[0], floodDateRange.value[1])
    } else {
      data = await getFloodWarningData('7d')
    }
    warnings.value = convertFloodToWarnings(data)

    if (clickOverlay) clickOverlay.setPosition(undefined)

    const layer = ensureFloodLayer()
    if (layer) {
      layer.setSource(new VectorSource({ features: createFloodFeatures(data) }))
    }
  } finally {
    loading.value = false
  }
}

// ============ 地震 ============

function onEarthquakeFilterChange() {
  fetchEarthquakeData()
}

async function fetchEarthquakeData() {
  loading.value = true
  try {
    const data = await getEarthquakeDataWithFilters({
      startDate: earthquakeDateRange.value?.[0],
      endDate: earthquakeDateRange.value?.[1],
      minMagnitude: magnitudeRange.value[0] > 0 ? magnitudeRange.value[0] : undefined,
      maxMagnitude: magnitudeRange.value[1] < 10 ? magnitudeRange.value[1] : undefined,
      minDepth: depthRange.value[0] > 0 ? depthRange.value[0] : undefined,
      maxDepth: depthRange.value[1] < 700 ? depthRange.value[1] : undefined,
    })
    warnings.value = convertEarthquakeToWarnings(data)

    if (clickOverlay) clickOverlay.setPosition(undefined)

    const layer = ensureEarthquakeLayer()
    if (layer) {
      layer.setSource(new VectorSource({ features: createEarthquakeFeatures(data) }))
    }
  } finally {
    loading.value = false
  }
}

// ============ 事件列表选择 ============

function selectWarning(warning: Warning) {
  const map = mapStore.map
  if (!map || warning.lng == null || warning.lat == null) return

  const coord = fromLonLat([warning.lng, warning.lat])
  map.getView().animate({ center: coord, zoom: 14, duration: 500 }, () => {
    if (activeType.value === 'flood' && floodLayer) {
      const source = floodLayer.getSource()
      if (source) {
        const match = source.getFeatures().find((f) => {
          const fw = f.get('flood') as FloodWarningData
          return fw && fw.wrInfoId === warning.id
        })
        if (match) {
          const fw = match.get('flood') as FloodWarningData
          const geom = match.getGeometry() as Point
          showFloodPopup(fw, geom.getCoordinates())
        }
      }
    } else if (activeType.value === 'typhoon' && typhoonLayer) {
      const source = typhoonLayer.getSource()
      if (source) {
        const match = source.getFeatures().find((f) => {
          const ty = f.get('typhoon') as TyphoonData
          return ty && ty.tfid === warning.tfid
        })
        if (match) {
          const ty = match.get('typhoon') as TyphoonData
          const geom = match.getGeometry() as Point
          showTyphoonPopup(ty, geom.getCoordinates())
          loadTyphoonTrajectory(ty.tfid)
        }
      }
    } else if (activeType.value === 'earthquake' && earthquakeLayer) {
      const source = earthquakeLayer.getSource()
      if (source) {
        const match = source.getFeatures().find((f) => {
          const eq = f.get('earthquake') as EarthquakeData
          return eq && eq.longitude === warning.lng && eq.latitude === warning.lat
        })
        if (match) {
          const eq = match.get('earthquake') as EarthquakeData
          const geom = match.getGeometry() as Point
          showEarthquakePopup(eq, geom.getCoordinates())
        }
      }
    }
  })
}

// ============ 图层工具函数 ============

function ensureEarthquakeLayer(): VectorLayer<VectorSource> | null {
  const map = mapStore.map
  if (!map) return null
  if (!earthquakeLayer) {
    earthquakeLayer = new VectorLayer({ source: new VectorSource(), zIndex: 10 })
    map.addLayer(earthquakeLayer)
  }
  return earthquakeLayer
}

function ensureFloodLayer(): VectorLayer<VectorSource> | null {
  const map = mapStore.map
  if (!map) return null
  if (!floodLayer) {
    floodLayer = new VectorLayer({ source: new VectorSource(), zIndex: 10 })
    map.addLayer(floodLayer)
  }
  return floodLayer
}

function ensureTyphoonLayer(): VectorLayer<VectorSource> | null {
  const map = mapStore.map
  if (!map) return null
  if (!typhoonLayer) {
    typhoonLayer = new VectorLayer({ source: new VectorSource(), zIndex: 15 })
    map.addLayer(typhoonLayer)
  }
  return typhoonLayer
}

function ensureTyphoonTrajectoryLayer(): VectorLayer<VectorSource> | null {
  const map = mapStore.map
  if (!map) return null
  if (!typhoonTrajectoryLayer) {
    typhoonTrajectoryLayer = new VectorLayer({ source: new VectorSource(), zIndex: 14 })
    map.addLayer(typhoonTrajectoryLayer)
  }
  return typhoonTrajectoryLayer
}

// ============ 地震相关 ============

function getMagnitudeColor(magnitude: number): string {
  if (magnitude >= 5.0) return '#f56c6c'
  if (magnitude >= 4.0) return '#e6a23c'
  if (magnitude >= 3.0) return '#409eff'
  return '#67c23a'
}

function getMagnitudeRadius(magnitude: number): number {
  if (magnitude >= 5.0) return 12
  if (magnitude >= 4.0) return 10
  if (magnitude >= 3.0) return 8
  return 6
}

function getMagnitudeLevel(magnitude: number): string {
  if (magnitude >= 4.0) return 'high'
  if (magnitude >= 3.0) return 'medium'
  return 'low'
}

function convertEarthquakeToWarnings(data: EarthquakeData[]): Warning[] {
  return data.map((item, index) => ({
    id: index,
    type: '地震预警',
    level: getMagnitudeLevel(item.magnitude),
    time: item.occurTime,
    content: `${item.location}发生${item.magnitude}级地震，震源深度${item.depth}千米`,
    location: item.location,
    lng: item.longitude,
    lat: item.latitude,
    magnitude: item.magnitude,
    depth: item.depth,
  }))
}

function createEarthquakeFeatures(data: EarthquakeData[]): Feature[] {
  return data.map((item) => {
    const feature = new Feature({
      geometry: new Point(fromLonLat([item.longitude, item.latitude])),
      earthquake: item,
    })
    const color = getMagnitudeColor(item.magnitude)
    const radius = getMagnitudeRadius(item.magnitude)
    feature.setStyle(
      new Style({
        image: new CircleStyle({
          radius,
          fill: new Fill({ color }),
          stroke: new Stroke({ color: '#fff', width: 2 }),
        }),
        text: new TextStyle({
          text: String(item.magnitude),
          font: 'bold 10px sans-serif',
          fill: new Fill({ color: '#fff' }),
          offsetY: 1,
        }),
      })
    )
    return feature
  })
}

function showEarthquakePopup(eq: EarthquakeData, coordinate: number[]) {
  if (!popupContainer || !clickOverlay) return
  popupContainer.innerHTML = `
    <div style="font-weight:bold;margin-bottom:6px;color:#303133;">${eq.magnitude}级地震</div>
    <div style="margin-bottom:4px;">📍 ${eq.location}</div>
    <div style="margin-bottom:4px;">🕐 ${eq.occurTime}</div>
    <div style="margin-bottom:4px;">📏 震源深度 ${eq.depth} 千米</div>
    <div style="color:#909399;font-size:12px;">播报时间: ${eq.reportTime}</div>
  `
  clickOverlay.setPosition(coordinate)
}

// ============ 洪水相关 ============

function getFloodLevelColor(level: string): string {
  if (level.includes('红')) return '#f56c6c'
  if (level.includes('橙')) return '#e6a23c'
  if (level.includes('黄')) return '#f7ba2a'
  return '#409eff'
}

function convertFloodToWarnings(data: FloodWarningData[]): Warning[] {
  return data.map((item) => ({
    id: item.wrInfoId,
    type: item.wrType || '洪水预警',
    level: item.wrLevel.includes('红') ? 'high' : item.wrLevel.includes('橙') ? 'medium' : 'low',
    time: item.publishTime,
    content: item.wrDetail,
    location: item.influenceArea,
    lng: item.longitude,
    lat: item.latitude,
  }))
}

function createFloodFeatures(data: FloodWarningData[]): Feature[] {
  return data.map((item) => {
    const feature = new Feature({
      geometry: new Point(fromLonLat([item.longitude, item.latitude])),
      flood: item,
    })
    const color = getFloodLevelColor(item.wrLevel)
    feature.setStyle(
      new Style({
        image: new CircleStyle({
          radius: 8,
          fill: new Fill({ color }),
          stroke: new Stroke({ color: '#fff', width: 2 }),
        }),
        text: new TextStyle({
          text: '洪',
          font: 'bold 10px sans-serif',
          fill: new Fill({ color: '#fff' }),
          offsetY: 1,
        }),
      })
    )
    return feature
  })
}

function showFloodPopup(fw: FloodWarningData, coordinate: number[]) {
  if (!popupContainer || !clickOverlay) return
  popupContainer.innerHTML = `
    <div style="font-weight:bold;margin-bottom:6px;color:#303133;">${fw.wrTitle}</div>
    <div style="margin-bottom:4px;color:${getFloodLevelColor(fw.wrLevel)}">⚠ ${fw.wrLevel}</div>
    <div style="margin-bottom:4px;">📍 ${fw.influenceArea}</div>
    <div style="margin-bottom:4px;">🏢 ${fw.unitName}</div>
    <div style="margin-bottom:4px;">🕐 发布: ${fw.publishTime}</div>
    <div style="margin-bottom:4px;">⏰ 失效: ${fw.expireTime}</div>
    <div style="margin-bottom:4px;font-size:12px;color:#606266;max-height:100px;overflow-y:auto;">${fw.wrDetail}</div>
    <div style="color:#909399;font-size:12px;"><a href="${fw.detailUrl}" target="_blank" style="color:#409eff;">查看详情</a></div>
  `
  clickOverlay.setPosition(coordinate)
}

// ============ 台风相关 ============

function getTyphoonColor(strong: string): string {
  if (strong.includes('超强')) return '#ff0000'
  if (strong.includes('强')) return '#ff6600'
  if (strong.includes('台风')) return '#ff9900'
  if (strong.includes('强热带')) return '#ffcc00'
  if (strong.includes('热带风暴')) return '#00ccff'
  return '#00ff00'
}

function convertTyphoonToWarnings(data: TyphoonData[]): Warning[] {
  return data.map((item) => ({
    id: item.id,
    type: item.isActive ? '台风预警' : '历史台风',
    level: item.strong?.includes('超强') ? 'high' : item.strong?.includes('强') ? 'medium' : 'low',
    time: item.dataTime,
    content: `${item.name}(${item.enName})${item.isActive ? '' : ' [已停止]'}${item.strong ? ` ${item.strong}` : ''}${item.power ? `，最大风力${item.power}级` : ''}${item.speed ? `，风速${item.speed}m/s` : ''}${item.pressure ? `，气压${item.pressure}hPa` : ''}`,
    location: item.lat && item.lng ? `${item.lat}°N, ${item.lng}°E` : '位置未知',
    lng: item.lng,
    lat: item.lat,
    tfid: item.tfid,
  }))
}

function createTyphoonFeatures(data: TyphoonData[]): Feature[] {
  return data
    .filter((item) => item.lat != null && item.lng != null)
    .map((item) => {
      const feature = new Feature({
        geometry: new Point(fromLonLat([item.lng, item.lat])),
        typhoon: item,
      })
      const color = getTyphoonColor(item.strong || '')
      feature.setStyle(
        new Style({
          image: new CircleStyle({
            radius: 12,
            fill: new Fill({ color }),
            stroke: new Stroke({ color: item.isActive ? '#fff' : '#999', width: 2 }),
          }),
          text: new TextStyle({
            text: '🌀',
            font: '16px sans-serif',
            offsetY: 0,
          }),
        })
      )
      return feature
    })
}

function createTyphoonTrajectoryFeatures(points: TyphoonPoint[]): Feature[] {
  const features: Feature[] = []
  if (!points || points.length === 0) return features

  // 轨迹线
  const coords = points.map((p) => fromLonLat([parseFloat(p.lng), parseFloat(p.lat)]))
  const lineFeature = new Feature({
    geometry: new LineString(coords),
  })
  lineFeature.setStyle(
    new Style({
      stroke: new Stroke({ color: '#ff6600', width: 2, lineDash: [8, 4] }),
    })
  )
  features.push(lineFeature)

  // 轨迹点
  points.forEach((p, index) => {
    const feature = new Feature({
      geometry: new Point(fromLonLat([parseFloat(p.lng), parseFloat(p.lat)])),
      typhoonPoint: p,
    })
    const radius = 3 + (index / points.length) * 5
    const color = getTyphoonColor(p.strong || '')
    feature.setStyle(
      new Style({
        image: new CircleStyle({
          radius,
          fill: new Fill({ color }),
          stroke: new Stroke({ color: '#fff', width: 1 }),
        }),
      })
    )
    features.push(feature)
  })

  return features
}

function showTyphoonPopup(typhoon: TyphoonData, coordinate: number[]) {
  if (!popupContainer || !clickOverlay) return
  const statusText = typhoon.isActive
    ? `<span style="color:#67c23a;">● 活跃</span>`
    : `<span style="color:#909399;">● 已停止</span>`
  popupContainer.innerHTML = `
    <div style="font-weight:bold;margin-bottom:6px;color:#303133;">🌀 ${typhoon.name} (${typhoon.enName}) ${statusText}</div>
    ${typhoon.strong ? `<div style="margin-bottom:4px;color:${getTyphoonColor(typhoon.strong)}">强度: ${typhoon.strong}</div>` : ''}
    ${typhoon.power ? `<div style="margin-bottom:4px;">风力: ${typhoon.power}级 | 风速: ${typhoon.speed}m/s</div>` : ''}
    ${typhoon.pressure ? `<div style="margin-bottom:4px;">气压: ${typhoon.pressure} hPa</div>` : ''}
    ${typhoon.moveDirection ? `<div style="margin-bottom:4px;">移动: ${typhoon.moveDirection} ${typhoon.moveSpeed}km/h</div>` : ''}
    ${typhoon.radius7 ? `<div style="margin-bottom:4px;">7级风圈: ${typhoon.radius7}km | 10级风圈: ${typhoon.radius10}km</div>` : ''}
    ${typhoon.lat && typhoon.lng ? `<div style="margin-bottom:4px;">📍 ${typhoon.lat}°N, ${typhoon.lng}°E</div>` : ''}
    ${typhoon.dataTime ? `<div style="margin-bottom:4px;font-size:12px;color:#909399;">更新: ${typhoon.dataTime}</div>` : ''}
    <div style="color:#409eff;font-size:12px;cursor:pointer;" id="typhoon-detail-btn">点击查看轨迹详情 →</div>
  `
  clickOverlay.setPosition(coordinate)

  setTimeout(() => {
    const btn = document.getElementById('typhoon-detail-btn')
    if (btn) {
      btn.onclick = () => loadTyphoonTrajectory(typhoon.tfid)
    }
  }, 0)
}

function showTyphoonPointPopup(point: TyphoonPoint, coordinate: number[]) {
  if (!popupContainer || !clickOverlay) return
  popupContainer.innerHTML = `
    <div style="font-weight:bold;margin-bottom:6px;color:#303133;">轨迹点详情</div>
    <div style="margin-bottom:4px;">🕐 ${point.pointTime}</div>
    <div style="margin-bottom:4px;color:${getTyphoonColor(point.strong || '')}">强度: ${point.strong}</div>
    <div style="margin-bottom:4px;">风力: ${point.power}级 | 风速: ${point.speed}m/s</div>
    <div style="margin-bottom:4px;">气压: ${point.pressure} hPa</div>
    <div style="margin-bottom:4px;">移动: ${point.moveDirection} ${point.moveSpeed}km/h</div>
    <div style="margin-bottom:4px;">📍 ${point.lat}°N, ${point.lng}°E</div>
  `
  clickOverlay.setPosition(coordinate)
}

async function loadTyphoonTrajectory(tfid: string) {
  const points = await getTyphoonPoints(tfid)
  if (!points || points.length === 0) return

  if (typhoonTrajectoryLayer) {
    typhoonTrajectoryLayer.setSource(new VectorSource())
  }

  const layer = ensureTyphoonTrajectoryLayer()
  if (layer) {
    layer.setSource(new VectorSource({ features: createTyphoonTrajectoryFeatures(points) }))
  }

  const map = mapStore.map
  if (map && points.length > 0) {
    const coords = points.map((p) => fromLonLat([parseFloat(p.lng), parseFloat(p.lat)]))
    const extent = new LineString(coords).getExtent()
    map.getView().fit(extent, { padding: [50, 50, 50, 50], duration: 500 })
  }
}

// ============ 地图弹窗设置 ============

function setupMapOverlay() {
  const map = mapStore.map
  if (!map) return

  popupContainer = document.createElement('div')
  popupContainer.className = 'disaster-popup'
  popupContainer.style.cssText =
    'background:#fff;padding:10px 14px;border-radius:6px;box-shadow:0 2px 12px rgba(0,0,0,0.2);font-size:13px;min-width:180px;position:relative;'
  document.body.appendChild(popupContainer)

  clickOverlay = new Overlay({
    element: popupContainer,
    autoPan: true,
  })
  map.addOverlay(clickOverlay)

  map.on('click', (evt: any) => {
    const feature = map.forEachFeatureAtPixel(evt.pixel, (f: any) => f)
    if (feature && feature.get('earthquake')) {
      showEarthquakePopup(feature.get('earthquake') as EarthquakeData, evt.coordinate)
    } else if (feature && feature.get('flood')) {
      showFloodPopup(feature.get('flood') as FloodWarningData, evt.coordinate)
    } else if (feature && feature.get('typhoon')) {
      showTyphoonPopup(feature.get('typhoon') as TyphoonData, evt.coordinate)
    } else if (feature && feature.get('typhoonPoint')) {
      showTyphoonPointPopup(feature.get('typhoonPoint') as TyphoonPoint, evt.coordinate)
    } else {
      clickOverlay.setPosition(undefined)
    }
  })
}

// ============ 生命周期 ============

function waitForMap() {
  if (mapStore.map) {
    setupMapOverlay()
  } else {
    setTimeout(waitForMap, 200)
  }
}

onMounted(() => {
  waitForMap()
})

onUnmounted(() => {
  const map = mapStore.map
  if (map && earthquakeLayer) map.removeLayer(earthquakeLayer)
  if (map && floodLayer) map.removeLayer(floodLayer)
  if (map && typhoonLayer) map.removeLayer(typhoonLayer)
  if (map && typhoonTrajectoryLayer) map.removeLayer(typhoonTrajectoryLayer)
  if (map && clickOverlay) map.removeOverlay(clickOverlay)
  if (popupContainer && popupContainer.parentNode) {
    popupContainer.parentNode.removeChild(popupContainer)
  }
})
</script>

<style lang="scss" scoped>
.disaster-container {
  position: relative;
  width: 100%;
  height: 100%;
}

.map-wrapper {
  width: 100%;
  height: 100%;
}

/* 左上角灾害类型图标 */
.disaster-icons {
  position: absolute;
  top: 20px;
  left: 20px;
  z-index: 1000;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.icon-btn {
  width: 44px;
  height: 44px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.92);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  transition: all 0.2s ease;
  border: 2px solid transparent;

  &:hover {
    transform: scale(1.08);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  }

  &.active {
    background: #409eff;
    border-color: #337ecc;
    transform: scale(1.08);

    .icon-emoji {
      filter: brightness(1.2);
    }
  }

  .icon-emoji {
    font-size: 22px;
    line-height: 1;
  }
}

/* 筛选面板 */
.filter-panel {
  position: absolute;
  top: 20px;
  left: 76px;
  width: 260px;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  backdrop-filter: blur(8px);
}

.filter-title {
  font-size: 15px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 12px;
}

.filter-label {
  font-size: 13px;
  color: #606266;
  margin-top: 12px;
  margin-bottom: 4px;
}

.depth-input-row {
  display: flex;
  align-items: center;
  gap: 8px;

  .el-input-number {
    flex: 1;
  }

  .depth-sep {
    color: #909399;
    font-size: 13px;
    flex-shrink: 0;
  }
}

/* 事件列表面板 */
.event-list-panel {
  position: absolute;
  top: 20px;
  right: 20px;
  width: 420px;
  max-height: 400px;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  display: flex;
  flex-direction: column;
  backdrop-filter: blur(8px);
  overflow: hidden;
}

.event-list-header {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  cursor: pointer;
  border-bottom: 1px solid #ebeef5;
  flex-shrink: 0;

  &:hover {
    background: #f5f7fa;
  }
}

.event-list-title {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
}

.event-badge {
  margin-left: 8px;
}

.event-toggle-icon {
  margin-left: auto;
  color: #909399;
  font-size: 14px;
}

.event-list-body {
  overflow-y: auto;
  max-height: 340px;
}

.event-item {
  padding: 12px 16px;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover {
    background-color: #f5f7fa;
  }

  &.high {
    border-left: 3px solid #f56c6c;
  }

  &.medium {
    border-left: 3px solid #e6a23c;
  }

  &.low {
    border-left: 3px solid #67c23a;
  }
}

.event-item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}

.event-type {
  font-weight: 600;
  font-size: 13px;
  color: #303133;
}

.event-time {
  font-size: 12px;
  color: #909399;
}

.event-content {
  font-size: 12px;
  color: #606266;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* 加载状态 */
.loading-indicator {
  position: absolute;
  bottom: 30px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.7);
  color: #fff;
  padding: 8px 20px;
  border-radius: 20px;
  font-size: 13px;
  display: flex;
  align-items: center;
  gap: 8px;
  z-index: 1000;

  .is-loading {
    animation: rotate 1s linear infinite;
  }
}

@keyframes rotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* 筛选面板过渡动画 */
.slide-filter-enter-active,
.slide-filter-leave-active {
  transition: all 0.3s ease;
}

.slide-filter-enter-from,
.slide-filter-leave-to {
  opacity: 0;
  transform: translateX(-10px);
}

/* 地震四列表格 */
.eq-table-header {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  background: #f5f7fa;
  border-bottom: 1px solid #ebeef5;
  font-size: 12px;
  font-weight: 600;
  color: #909399;
}

.eq-table-row {
  display: flex;
  align-items: center;
  padding: 10px 12px;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
  transition: background-color 0.2s;
  font-size: 12px;
  color: #606266;

  &:hover {
    background-color: #f5f7fa;
  }

  &.high {
    .mag-badge { background: #fef0f0; color: #f56c6c; }
  }

  &.medium {
    .mag-badge { background: #fdf6ec; color: #e6a23c; }
  }

  &.low {
    .mag-badge { background: #f0f9eb; color: #67c23a; }
  }
}

.eq-col-time {
  width: 120px;
  flex-shrink: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.eq-col-loc {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  padding: 0 8px;
  cursor: default;

  &:hover {
    position: relative;
  }
}

.eq-col-mag {
  width: 50px;
  flex-shrink: 0;
  text-align: center;
}

.eq-col-depth {
  width: 55px;
  flex-shrink: 0;
  text-align: right;
}

.mag-badge {
  display: inline-block;
  padding: 1px 6px;
  border-radius: 4px;
  font-weight: 600;
  font-size: 12px;
}
</style>
