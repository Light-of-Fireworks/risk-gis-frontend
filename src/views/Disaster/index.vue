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

          <!-- 台风保单查询 -->
          <TyphoonPolicyQuery
            :get-typhoon-data="getTyphoonData"
            @query-result="onTyphoonQueryResult"
            @query-start="onTyphoonQueryStart"
            @query-end="onTyphoonQueryEnd"
            @buffer-data="onBufferData"
          />
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

    <!-- 左下角台风信息面板 -->
    <div v-if="activeType === 'typhoon' && warnings.length > 0" class="typhoon-info-panel" :class="{ collapsed: !eventListVisible }">
      <div class="typhoon-info-header" @click="eventListVisible = !eventListVisible">
        <span class="typhoon-info-title">台风信息</span>
        <el-badge :value="warnings.length" :max="99" type="danger" class="event-badge" />
        <el-icon class="event-toggle-icon">
          <ArrowDown v-if="!eventListVisible" />
          <ArrowUp v-else />
        </el-icon>
      </div>
      <div v-show="eventListVisible" class="typhoon-info-body">
        <div
          v-for="(w, index) in typhoonInfoList"
          :key="w.tfid || index"
          class="typhoon-card"
          @click="selectWarning(w)"
        >
          <div class="typhoon-name">{{ w.typhoonName }}</div>
          <div class="typhoon-detail-row">
            <span class="typhoon-detail-label">台风编号</span>
            <span class="typhoon-detail-value">{{ w.typhoonNumber }}</span>
          </div>
          <div class="typhoon-detail-row">
            <span class="typhoon-detail-label">起始时间</span>
            <span class="typhoon-detail-value">{{ w.startTime }}</span>
          </div>
          <div class="typhoon-detail-row">
            <span class="typhoon-detail-label">中心气压极值(百帕)</span>
            <span class="typhoon-detail-value">{{ w.pressure }}</span>
          </div>
          <div class="typhoon-detail-row">
            <span class="typhoon-detail-label">附近最大风速(米/秒)</span>
            <span class="typhoon-detail-value">{{ w.speed }}</span>
          </div>
        </div>
        <el-empty v-if="!loading && warnings.length === 0" description="暂无数据" :image-size="60" />
      </div>
    </div>

    <!-- 台风保单统计面板 -->
    <TyphoonStatsPanel
      :visible="showTyphoonStats"
      :data="typhoonStatsData"
    />

    <!-- 右上角事件列表（地震/洪水） -->
    <div v-if="activeType && activeType !== 'typhoon'" class="event-list-panel" :class="{ collapsed: !eventListVisible }">
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
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { ArrowDown, ArrowUp, Loading } from '@element-plus/icons-vue'
import MapContainer from '@/components/Map/MapContainer.vue'
import TyphoonPolicyQuery from '@/components/Map/TyphoonPolicyQuery.vue'
import TyphoonStatsPanel from '@/components/Map/TyphoonStatsPanel.vue'
import type { TyphoonPolicyStatsResponse } from '@/services/insuranceService'
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
import * as turf from '@turf/turf'
import VectorLayer from 'ol/layer/Vector'
import VectorSource from 'ol/source/Vector'
import Feature from 'ol/Feature'
import Point from 'ol/geom/Point'
import { Style, Fill, Stroke, Text as TextStyle, Circle as CircleStyle } from 'ol/style'
import LineString from 'ol/geom/LineString'
import MultiPoint from 'ol/geom/MultiPoint'
import Circle from 'ol/geom/Circle'
import Polygon from 'ol/geom/Polygon'
import { unlistenByKey } from 'ol/events'
import type { EventsKey } from 'ol/events'

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

// 台风保单查询
const showTyphoonStats = ref(false)
const typhoonStatsData = ref<TyphoonPolicyStatsResponse | null>(null)
let policyLayer: VectorLayer<VectorSource> | null = null
let selectedTyphoonTrajectoryPoints: Map<string, TyphoonPoint[]> = new Map()

// 台风信息列表（用于台风信息面板展示）
const typhoonInfoList = computed(() => {
  return warnings.value.map((w) => {
    const typhoon = typhoonDataMap.value[w.tfid || '']
    return {
      ...w,
      typhoonName: typhoon ? `${typhoon.name} ${typhoon.enName}` : w.content.split('(')[0] || '',
      typhoonNumber: getTyphoonNumber(w.tfid || ''),
      startTime: typhoon?.dataTime || w.time || '',
      pressure: typhoon?.pressure || '--',
      speed: typhoon?.speed || '--',
    }
  })
})

// 缓存台风原始数据，用于信息面板展示
const typhoonDataMap = ref<Record<string, TyphoonData>>({})

function getTyphoonNumber(tfid: string): string {
  if (!tfid) return '--'
  return tfid.length >= 4 ? tfid.slice(-4) : tfid
}

// 地图图层
let earthquakeLayer: VectorLayer<VectorSource> | null = null
let floodLayer: VectorLayer<VectorSource> | null = null
let typhoonLayer: VectorLayer<VectorSource> | null = null
let typhoonTrajectoryLayer: VectorLayer<VectorSource> | null = null
let popupContainer: HTMLDivElement | null = null
let mapClickKey: EventsKey | null = null
let popupVisible = false

// 台风轨迹点空间索引（存地图坐标，点击时 O(N) 查最近点，N<500 为微秒级）
let trajectoryCoords: number[][] = []
let trajectoryPoints: TyphoonPoint[] = []

// 存储各类型标记的屏幕坐标，用于点击命中查询（绕过 forEachFeatureAtPixel）
let typhoonMarkers: { data: any; coord: number[] }[] = []
let otherMarkers: { data: any; coord: number[] }[] = []
let policyMarkers: { data: any; coord: number[] }[] = []

function findNearestFeature(clickPx: number[], markers: { data: any; coord: number[] }[], maxPxDist: number): any | null {
  const map = mapStore.map
  if (!map || markers.length === 0) return null
  let minDist = Infinity
  let nearest: any = null
  for (const m of markers) {
    const px = map.getPixelFromCoordinate(m.coord)
    if (!px) continue
    const dx = px[0] - clickPx[0]
    const dy = px[1] - clickPx[1]
    const d = dx * dx + dy * dy
    if (d < minDist) {
      minDist = d
      nearest = m.data
    }
  }
  if (minDist > maxPxDist * maxPxDist) return null
  return nearest
}

// 预创建的弹窗子元素引用
let popupTitleEl: HTMLDivElement | null = null
let popupField1El: HTMLDivElement | null = null
let popupField2El: HTMLDivElement | null = null
let popupField3El: HTMLDivElement | null = null
let popupField4El: HTMLDivElement | null = null
let popupBtnEl: HTMLDivElement | null = null

function createPopupField(): HTMLDivElement {
  const el = document.createElement('div')
  el.style.cssText = 'margin-bottom:4px;font-size:13px;'
  return el
}

function ensurePopupStructure() {
  if (!popupContainer) return
  // 如果结构已存在且未被覆盖，直接返回
  if (popupTitleEl && popupTitleEl.parentNode === popupContainer) return

  // 清空容器，重建旧结构
  popupContainer.innerHTML = ''
  popupContainer.style.width = ''
  popupContainer.style.maxHeight = ''
  popupContainer.style.overflow = ''

  popupTitleEl = document.createElement('div')
  popupTitleEl.style.cssText = 'font-weight:bold;margin-bottom:6px;color:#303133;'
  popupContainer.appendChild(popupTitleEl)

  popupField1El = createPopupField()
  popupContainer.appendChild(popupField1El)
  popupField2El = createPopupField()
  popupContainer.appendChild(popupField2El)
  popupField3El = createPopupField()
  popupContainer.appendChild(popupField3El)
  popupField4El = createPopupField()
  popupContainer.appendChild(popupField4El)

  popupBtnEl = document.createElement('div')
  popupBtnEl.style.cssText = 'color:#409eff;font-size:12px;cursor:pointer;margin-top:4px;'
  popupBtnEl.textContent = '点击查看轨迹详情 →'
  popupContainer.appendChild(popupBtnEl)
}

function showPopup(coordinate: number[]) {
  if (!popupContainer) return
  // 隐藏未使用的字段（textContent 为空的），仅在使用旧结构时
  if (popupTitleEl && popupTitleEl.parentNode === popupContainer) {
    ;[popupField1El, popupField2El, popupField3El, popupField4El, popupBtnEl].forEach((el) => {
      if (el) el.style.display = el.textContent ? '' : 'none'
    })
  }
  // 用 CSS 定位弹窗，绕过 OL Overlay 触发的同步重绘
  const map = mapStore.map
  if (map) {
    const px = map.getPixelFromCoordinate(coordinate)
    if (px) {
      popupContainer.style.left = px[0] + 'px'
      popupContainer.style.top = px[1] + 'px'
      popupContainer.style.transform = 'translate(-50%, -100%)'
    }
  }
  popupContainer.style.visibility = 'visible'
  popupVisible = true
}

function resetPopupFields() {
  ;[popupField1El, popupField2El, popupField3El, popupField4El, popupBtnEl].forEach((el) => {
    if (el) {
      el.textContent = ''
      el.style.display = ''
      el.style.color = ''
    }
  })
}

function hidePopup() {
  if (!popupContainer) return
  popupContainer.style.visibility = 'hidden'
  popupContainer.style.width = ''
  popupContainer.style.maxHeight = ''
  popupContainer.style.overflow = ''
  popupVisible = false
}

// 轨迹数据缓存：避免同一台风重复请求 API 和重建 Feature
const trajectoryCache = new Map<string, { points: TyphoonPoint[]; features: Feature[] }>()

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
    typhoonDataMap.value = {}
    return
  }
  activeType.value = type
  clearAllLayers()
  warnings.value = []
  typhoonDataMap.value = {}
  eventListVisible.value = true
  // 重置各灾害类型筛选状态
  typhoonMode.value = 'realtime'
  selectedYear.value = null
  selectedTyphoonIds.value = []
  yearTyphoons.value = []
  floodDateRange.value = null
  earthquakeDateRange.value = null
  magnitudeRange.value = [0, 10]
  depthRange.value = [0, 700]
  loadDataForType(type)
}

function clearAllLayers() {
  if (earthquakeLayer) earthquakeLayer.setSource(new VectorSource())
  if (floodLayer) floodLayer.setSource(new VectorSource())
  if (typhoonLayer) typhoonLayer.setSource(new VectorSource())
  if (typhoonTrajectoryLayer) typhoonTrajectoryLayer.setSource(new VectorSource())
  clearPolicyResults()
  showTyphoonStats.value = false
  typhoonStatsData.value = null
  hidePopup()
  trajectoryCache.clear()
  trajectoryCoords = []
  trajectoryPoints = []
  typhoonMarkers = []
  otherMarkers = []
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
  typhoonDataMap.value = {}
  selectedTyphoonIds.value = []
  selectedYear.value = null
  yearTyphoons.value = []
  selectedTyphoonTrajectoryPoints.clear()
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
  typhoonDataMap.value = {}
}

async function onTyphoonSelect(ids: string[]) {
  if (ids.length === 0) {
    if (typhoonLayer) typhoonLayer.setSource(new VectorSource())
    if (typhoonTrajectoryLayer) typhoonTrajectoryLayer.setSource(new VectorSource())
    warnings.value = []
    typhoonDataMap.value = {}
    selectedTyphoonTrajectoryPoints.clear()
    return
  }

  loading.value = true
  try {
    const allPoints: { tfid: string; points: TyphoonPoint[] }[] = []
    selectedTyphoonTrajectoryPoints.clear()
    const selectedTyphoons = yearTyphoons.value.filter((t) => ids.includes(t.tfid))
    const typhoonMap: Record<string, TyphoonData> = {}
    selectedTyphoons.forEach((t) => { typhoonMap[t.tfid] = t })
    typhoonDataMap.value = typhoonMap
    typhoonMarkers = selectedTyphoons
      .filter((t) => t.lat != null && t.lng != null)
      .map((t) => ({ data: t, coord: fromLonLat([t.lng, t.lat]) }))

    for (const tfid of ids) {
      const points = await getTyphoonPoints(tfid)
      if (points.length > 0) {
        allPoints.push({ tfid, points })
        selectedTyphoonTrajectoryPoints.set(tfid, points)
      }
    }

    const layer = ensureTyphoonLayer()
    if (layer) {
      const typhoonFeatures = createTyphoonFeatures(selectedTyphoons)
      const existingTyphoonSource = layer.getSource()
      if (existingTyphoonSource) {
        existingTyphoonSource.clear()
        existingTyphoonSource.addFeatures(typhoonFeatures)
      } else {
        layer.setSource(new VectorSource({ features: typhoonFeatures }))
      }
    }

    const trajLayer = ensureTyphoonTrajectoryLayer()
    if (trajLayer) {
      const allFeatures: Feature[] = []
      const mergedPoints: TyphoonPoint[] = []
      for (const item of allPoints) {
        mergedPoints.push(...item.points)
        allFeatures.push(...createTyphoonTrajectoryLineFeatures(item.points))
      }
      if (mergedPoints.length > 0) {
        allFeatures.push(...createTyphoonTrajectoryPointFeatures(mergedPoints))
      }
      const existingSource = trajLayer.getSource()
      if (existingSource) {
        existingSource.clear()
        existingSource.addFeatures(allFeatures)
      } else {
        trajLayer.setSource(new VectorSource({ features: allFeatures }))
      }
    }

    warnings.value = convertTyphoonToWarnings(selectedTyphoons)

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
        map.getView().fit(extent, { padding: [100, 400, 100, 100], duration: 0 })
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
    // 缓存台风原始数据
    const typhoonMap: Record<string, TyphoonData> = {}
    data.forEach((t) => { typhoonMap[t.tfid] = t })
    typhoonDataMap.value = typhoonMap
    warnings.value = convertTyphoonToWarnings(data)
    typhoonMarkers = data
      .filter((t) => t.lat != null && t.lng != null)
      .map((t) => ({ data: t, coord: fromLonLat([t.lng, t.lat]) }))

    hidePopup()

    // 加载所有活跃台风的轨迹
    const allPoints: { tfid: string; points: TyphoonPoint[] }[] = []
    selectedTyphoonTrajectoryPoints.clear()
    for (const typhoon of data) {
      const points = await getTyphoonPoints(typhoon.tfid)
      if (points.length > 0) {
        allPoints.push({ tfid: typhoon.tfid, points })
        selectedTyphoonTrajectoryPoints.set(typhoon.tfid, points)
      }
    }

    const layer = ensureTyphoonLayer()
    if (layer) {
      layer.setSource(new VectorSource({ features: createTyphoonFeatures(data) }))
    }

    // 绘制轨迹线和轨迹点
    const trajLayer = ensureTyphoonTrajectoryLayer()
    if (trajLayer) {
      const allFeatures: Feature[] = []
      const mergedPoints: TyphoonPoint[] = []
      for (const item of allPoints) {
        mergedPoints.push(...item.points)
        allFeatures.push(...createTyphoonTrajectoryLineFeatures(item.points))
      }
      if (mergedPoints.length > 0) {
        allFeatures.push(...createTyphoonTrajectoryPointFeatures(mergedPoints))
      }
      trajLayer.setSource(new VectorSource({ features: allFeatures }))
    }

    // 自动定位到轨迹范围
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
        map.getView().fit(extent, { padding: [100, 400, 100, 100], duration: 0 })
      }
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
    otherMarkers = data
      .filter((d) => d.latitude != null && d.longitude != null)
      .map((d) => ({ data: d, coord: fromLonLat([d.longitude, d.latitude]) }))

    hidePopup()

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
    otherMarkers = data
      .filter((d) => d.latitude != null && d.longitude != null)
      .map((d) => ({ data: d, coord: fromLonLat([d.longitude, d.latitude]) }))

    hidePopup()

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

  // 台风：直接定位而不动画，避免与后续 loadTyphoonTrajectory 的 fit 动叠加造成 ~1 秒钟双重动画
  if (activeType.value === 'typhoon' && typhoonLayer) {
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
    map.getView().animate({ center: coord, zoom: 14, duration: 250 })
  } else {
    // 其他类型保持 500ms 动画
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
  if (!popupContainer) return
  ensurePopupStructure()
  resetPopupFields()
  popupTitleEl!.textContent = `${eq.magnitude}级地震`
  popupField1El!.textContent = `${eq.location}`
  popupField2El!.textContent = `${eq.occurTime}`
  popupField3El!.textContent = `震源深度 ${eq.depth} 千米`
  popupField4El!.textContent = `播报时间: ${eq.reportTime}`
  showPopup(coordinate)
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
  if (!popupContainer) return
  ensurePopupStructure()
  resetPopupFields()
  popupTitleEl!.textContent = fw.wrTitle
  popupField1El!.textContent = `${fw.wrLevel}`
  popupField1El!.style.color = getFloodLevelColor(fw.wrLevel)
  popupField2El!.textContent = `${fw.influenceArea} | ${fw.unitName}`
  popupField3El!.textContent = `发布: ${fw.publishTime}  失效: ${fw.expireTime}`
  popupField4El!.textContent = fw.wrDetail
  popupField4El!.style.cssText += 'font-size:12px;color:#606266;max-height:100px;overflow-y:auto;'
  showPopup(coordinate)
}

function showPolicyPopup(group: any, coordinate: number[]) {
  if (!popupContainer) return

  // 重新创建弹窗结构，支持保单列表
  popupContainer.innerHTML = ''
  popupContainer.style.width = '280px'
  popupContainer.style.maxHeight = '400px'
  popupContainer.style.overflow = 'hidden'

  // 标题栏
  const header = document.createElement('div')
  header.style.cssText = 'display:flex;align-items:center;justify-content:space-between;padding:10px 14px;border-bottom:1px solid #ebeef5;'
  const title = document.createElement('span')
  title.style.cssText = 'font-size:14px;font-weight:600;color:#303133;'
  title.textContent = `保单列表 (${group.count}条)`
  header.appendChild(title)
  const closeBtn = document.createElement('span')
  closeBtn.style.cssText = 'font-size:18px;color:#909399;cursor:pointer;line-height:1;'
  closeBtn.textContent = '×'
  closeBtn.onclick = () => hidePopup()
  header.appendChild(closeBtn)
  popupContainer.appendChild(header)

  // 保单列表
  const body = document.createElement('div')
  body.style.cssText = 'overflow-y:auto;max-height:350px;padding:8px;'

  const policies = group.policies || []
  for (const policy of policies) {
    const item = document.createElement('div')
    item.style.cssText = 'padding:10px;border:1px solid #ebeef5;border-radius:6px;margin-bottom:8px;'

    // 保单头部：保单号 + 险种
    const itemHeader = document.createElement('div')
    itemHeader.style.cssText = 'display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;'
    const policyNo = document.createElement('span')
    policyNo.style.cssText = 'font-size:13px;font-weight:600;color:#303133;'
    policyNo.textContent = policy.policyNo
    itemHeader.appendChild(policyNo)
    const typeName = document.createElement('span')
    typeName.style.cssText = 'font-size:12px;color:#409eff;background:#ecf5ff;padding:2px 8px;border-radius:4px;'
    typeName.textContent = policy.typeName || ''
    itemHeader.appendChild(typeName)
    item.appendChild(itemHeader)

    // 保单详情
    const detail = document.createElement('div')
    const rows = [
      { label: '投保人：', value: policy.policyHolder },
      { label: '被保险人：', value: policy.insuredName },
      { label: '险类：', value: policy.categoryName },
      { label: '保额：', value: policy.coverageAmount?.toLocaleString() + ' 元' },
      { label: '保费：', value: policy.premium?.toLocaleString() + ' 元' },
      { label: '标的序号：', value: policy.targetNo },
      { label: '保险期间：', value: `${policy.startDate} 至 ${policy.endDate}` },
    ]
    if (policy.address) {
      rows.push({ label: '地址：', value: policy.address })
    }

    for (const row of rows) {
      const rowEl = document.createElement('div')
      rowEl.style.cssText = 'display:flex;font-size:12px;line-height:1.8;'
      const labelEl = document.createElement('span')
      labelEl.style.cssText = 'color:#909399;flex-shrink:0;width:70px;'
      labelEl.textContent = row.label
      rowEl.appendChild(labelEl)
      const valueEl = document.createElement('span')
      valueEl.style.cssText = 'color:#303133;flex:1;'
      valueEl.textContent = row.value || ''
      rowEl.appendChild(valueEl)
      detail.appendChild(rowEl)
    }
    item.appendChild(detail)
    body.appendChild(item)
  }

  popupContainer.appendChild(body)
  showPopup(coordinate)
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

// 降采样：保留首尾点，中间均匀取样，最多 maxCount 个点
function downsamplePoints(points: TyphoonPoint[], maxCount: number): { sampled: TyphoonPoint[], indices: number[] } {
  if (points.length <= maxCount) {
    return { sampled: points, indices: points.map((_, i) => i) }
  }
  const step = (points.length - 1) / (maxCount - 1)
  const sampled: TyphoonPoint[] = []
  const indices: number[] = []
  for (let i = 0; i < maxCount; i++) {
    const idx = Math.round(i * step)
    sampled.push(points[idx])
    indices.push(idx)
  }
  return { sampled, indices }
}

// 单个台风的轨迹线（LineString）
function createTyphoonTrajectoryLineFeatures(points: TyphoonPoint[]): Feature[] {
  if (!points || points.length === 0) return []
  const coords = points.map((p) => fromLonLat([parseFloat(p.lng), parseFloat(p.lat)]))
  const lineFeature = new Feature({ geometry: new LineString(coords) })
  lineFeature.setStyle(
    new Style({
      stroke: new Stroke({ color: '#ff6600', width: 2, lineDash: [8, 4] }),
    })
  )
  return [lineFeature]
}

// 合并多个台风的轨迹点为一个 MultiPoint（用于渲染 + 点击检测）
function createTyphoonTrajectoryPointFeatures(points: TyphoonPoint[]): Feature[] {
  if (!points || points.length === 0) return []

  // 保存全部点坐标用于点击命中
  const allCoords = points.map((p) => fromLonLat([parseFloat(p.lng), parseFloat(p.lat)]))
  trajectoryCoords = allCoords
  trajectoryPoints = points

  // 降采样用于渲染，最多 60 个点
  const { sampled, indices } = downsamplePoints(points, 60)
  const sampledCoords = indices.map((i) => allCoords[i])

  const multiFeature = new Feature({
    geometry: new MultiPoint(sampledCoords),
  })
  multiFeature.set('isTrajectoryMultiPoint', true)
  const cachedStyles: Style[] = sampledCoords.map((coord, i) => {
    const origIdx = indices[i]
    const radius = 3 + (origIdx / points.length) * 5
    const color = getTyphoonColor(sampled[i].strong || '')
    return new Style({
      geometry: new Point(coord),
      image: new CircleStyle({
        radius,
        fill: new Fill({ color }),
        stroke: new Stroke({ color: '#fff', width: 1 }),
      }),
    })
  })
  multiFeature.setStyle(cachedStyles)
  return [multiFeature]
}

function findClickedTrajectoryPoint(clickCoord: number[]): TyphoonPoint | null {
  if (trajectoryCoords.length === 0) return null
  const map = mapStore.map
  if (!map) return null
  const clickPx = map.getPixelFromCoordinate(clickCoord)
  if (!clickPx) return null

  const maxPxDist = 10
  let minDist = Infinity
  let idx = -1
  for (let i = 0; i < trajectoryCoords.length; i++) {
    const px = map.getPixelFromCoordinate(trajectoryCoords[i])
    if (!px) continue
    const dx = px[0] - clickPx[0]
    const dy = px[1] - clickPx[1]
    const d = dx * dx + dy * dy
    if (d < minDist) {
      minDist = d
      idx = i
    }
  }
  if (idx < 0 || minDist > maxPxDist * maxPxDist) return null
  return trajectoryPoints[idx]
}

function showTyphoonPopup(typhoon: TyphoonData, coordinate: number[]) {
  if (!popupContainer) return
  ensurePopupStructure()
  resetPopupFields()
  const status = typhoon.isActive ? '● 活跃' : '● 已停止'
  popupTitleEl!.textContent = `🌀 ${typhoon.name} (${typhoon.enName}) ${status}`
  popupField1El!.textContent = typhoon.strong ? `强度: ${typhoon.strong}` : ''
  popupField1El!.style.color = getTyphoonColor(typhoon.strong || '')
  popupField2El!.textContent = typhoon.power ? `风力: ${typhoon.power}级 | 风速: ${typhoon.speed}m/s` : ''
  popupField3El!.textContent = typhoon.pressure ? `气压: ${typhoon.pressure} hPa` : ''
  popupField4El!.textContent = typhoon.dataTime ? `更新: ${typhoon.dataTime}` : ''
  popupField4El!.style.color = '#909399'
  popupBtnEl!.textContent = '点击查看轨迹详情 →'
  popupBtnEl!.onclick = () => loadTyphoonTrajectory(typhoon.tfid)
  showPopup(coordinate)
}

function showTyphoonPointPopup(point: TyphoonPoint, coordinate: number[]) {
  if (!popupContainer) return
  ensurePopupStructure()
  resetPopupFields()
  popupTitleEl!.textContent = '轨迹点详情'
  popupField1El!.textContent = `${point.pointTime}`
  popupField2El!.textContent = `强度: ${point.strong}`
  popupField2El!.style.color = getTyphoonColor(point.strong || '')
  popupField3El!.textContent = `风力: ${point.power}级 | 风速: ${point.speed}m/s`
  popupField4El!.textContent = `气压: ${point.pressure} hPa  📍 ${point.lat}°N, ${point.lng}°E`
  showPopup(coordinate)
}

async function loadTyphoonTrajectory(tfid: string) {
  let cached = trajectoryCache.get(tfid)
  if (!cached) {
    const points = await getTyphoonPoints(tfid)
    if (!points || points.length === 0) return
    const features = [
      ...createTyphoonTrajectoryLineFeatures(points),
      ...createTyphoonTrajectoryPointFeatures(points),
    ]
    cached = { points, features }
    trajectoryCache.set(tfid, cached)
  }

  const trajLayer = ensureTyphoonTrajectoryLayer()
  if (trajLayer) {
    const existingSource = trajLayer.getSource()
    if (existingSource) {
      existingSource.clear()
      existingSource.addFeatures(cached.features)
    } else {
      trajLayer.setSource(new VectorSource({ features: cached.features }))
    }
  }

  const map = mapStore.map
  if (map && cached.points.length > 0) {
    const coords = cached.points.map((p) => fromLonLat([parseFloat(p.lng), parseFloat(p.lat)]))
    const extent = new LineString(coords).getExtent()
    map.getView().fit(extent, { padding: [50, 50, 50, 50], duration: 0 })
  }
}

// ============ 地图弹窗设置 ============

let visibilityHandler: (() => void) | null = null

function setupMapOverlay() {
  const map = mapStore.map
  if (!map) return

  // 防止重复注册
  if (popupContainer) return

  // 切回浏览器时，canvas 可能已失效，OpenLayers 会在下次事件中同步重绘（阻塞主线程）
  // 提前用 rAF 触发一次异步渲染，避免阻塞 pointerup/click
  visibilityHandler = () => {
    if (document.visibilityState === 'visible') {
      requestAnimationFrame(() => { map.render() })
    }
  }
  document.addEventListener('visibilitychange', visibilityHandler)

  popupContainer = document.createElement('div')
  popupContainer.className = 'disaster-popup'
  popupContainer.style.cssText =
    'background:#fff;padding:10px 14px;border-radius:6px;box-shadow:0 2px 12px rgba(0,0,0,0.2);font-size:13px;min-width:180px;position:absolute;pointer-events:auto;z-index:100;visibility:hidden;'
  // 直接挂到地图容器，用 CSS 定位，不使用 OL Overlay（避免触发同步重绘）
  map.getTargetElement().appendChild(popupContainer)

  mapClickKey = map.on('click', (evt: any) => {
    const coordinate = evt.coordinate
    const clickPx = evt.pixel as [number, number]

    // 完全绕过 forEachFeatureAtPixel，用坐标距离做命中查询（微秒级）

    // 1. 查轨迹点
    const trajectoryHit = findClickedTrajectoryPoint(coordinate)
    if (trajectoryHit) {
      showTyphoonPointPopup(trajectoryHit, coordinate)
      return
    }

    // 2. 查台风标记
    const typhoonHit = findNearestFeature(clickPx, typhoonMarkers, 15)
    if (typhoonHit) {
      showTyphoonPopup(typhoonHit as TyphoonData, coordinate)
      return
    }

    // 3. 查保单标记
    const policyHit = findNearestFeature(clickPx, policyMarkers, 15)
    if (policyHit) {
      showPolicyPopup(policyHit, coordinate)
      return
    }

    // 4. 查地震/洪水等其他标记
    const otherHit = findNearestFeature(clickPx, otherMarkers, 15)
    if (otherHit && (otherHit as any).magnitude != null) {
      showEarthquakePopup(otherHit as EarthquakeData, coordinate)
      return
    }
    if (otherHit && (otherHit as any).wrLevel) {
      showFloodPopup(otherHit as FloodWarningData, coordinate)
      return
    }

    hidePopup()
  })
}

// ============ 台风保单查询 ============

function getTyphoonData() {
  const result: Array<{ tfid: string; name: string; enName: string; points: Array<{ lng: string; lat: string }> }> = []

  // 实时台风模式：使用 typhoonDataMap 中的所有活跃台风
  // 历史台风模式：使用 selectedTyphoonIds 中选中的台风
  const typhoonIds = typhoonMode.value === 'realtime'
    ? Object.keys(typhoonDataMap.value)
    : selectedTyphoonIds.value

  for (const tfid of typhoonIds) {
    const typhoon = typhoonDataMap.value[tfid]
    if (!typhoon) continue

    // 优先使用选中时加载的轨迹数据
    const trajectoryPoints = selectedTyphoonTrajectoryPoints.get(tfid)
    if (trajectoryPoints && trajectoryPoints.length > 0) {
      result.push({
        tfid: typhoon.tfid,
        name: typhoon.name,
        enName: typhoon.enName,
        points: trajectoryPoints.map(p => ({ lng: p.lng, lat: p.lat }))
      })
    } else {
      // 尝试从缓存获取
      const cached = trajectoryCache.get(tfid)
      if (cached && cached.points.length > 0) {
        result.push({
          tfid: typhoon.tfid,
          name: typhoon.name,
          enName: typhoon.enName,
          points: cached.points.map(p => ({ lng: p.lng, lat: p.lat }))
        })
      } else if (typhoon.lat != null && typhoon.lng != null) {
        result.push({
          tfid: typhoon.tfid,
          name: typhoon.name,
          enName: typhoon.enName,
          points: [{ lng: String(typhoon.lng), lat: String(typhoon.lat) }]
        })
      }
    }
  }

  return result
}

function onTyphoonQueryResult(data: TyphoonPolicyStatsResponse) {
  typhoonStatsData.value = data
  showTyphoonStats.value = true
  drawPolicyPoints(data.policyGroups)
}

function onTyphoonQueryStart() {
  clearPolicyResults()
}

function onTyphoonQueryEnd() {
  // Query completed
}

function clearPolicyResults() {
  if (policyLayer) {
    policyLayer.getSource()?.clear()
  }
  policyMarkers = []
  clearBufferLayer()
}

function drawPolicyPoints(groups: Array<{ lng: number; lat: number; count: number; policies: any[] }>) {
  ensurePolicyLayer()
  const map = mapStore.map
  if (!map || !policyLayer) return

  const source = policyLayer.getSource()
  if (!source) return
  source.clear()
  policyMarkers = []

  for (const group of groups) {
    const coord = fromLonLat([group.lng, group.lat])
    const feature = new Feature({
      geometry: new Point(coord),
    })

    const label = group.count > 1 ? String(group.count) : ''
    feature.setStyle(new Style({
      image: new CircleStyle({
        radius: group.count > 1 ? 12 : 8,
        fill: new Fill({ color: '#e6a23c' }),
        stroke: new Stroke({ color: '#fff', width: 2 }),
      }),
      text: label ? new Text({
        text: label,
        font: 'bold 11px sans-serif',
        fill: new Fill({ color: '#fff' }),
      }) : undefined,
    }))

    feature.set('groupData', group)
    source.addFeature(feature)
    policyMarkers.push({ data: group, coord })
  }
}

function ensurePolicyLayer() {
  if (policyLayer) return
  const map = mapStore.map
  if (!map) return

  policyLayer = new VectorLayer({
    source: new VectorSource(),
    zIndex: 20,
  })
  map.addLayer(policyLayer)
}

// ============ 台风路径缓冲区 ============

let bufferLayer: VectorLayer<VectorSource> | null = null

function ensureBufferLayer() {
  if (bufferLayer) return
  const map = mapStore.map
  if (!map) return

  bufferLayer = new VectorLayer({
    source: new VectorSource(),
    zIndex: 19,
  })
  map.addLayer(bufferLayer)
}

function onBufferData(data: { typhoons: Array<{ tfid: string; points: Array<{ lng: number; lat: number }> }>, radius: number }) {
  ensureBufferLayer()
  const map = mapStore.map
  if (!map || !bufferLayer) return

  const source = bufferLayer.getSource()
  if (!source) return
  source.clear()

  const radiusKm = data.radius

  for (const typhoon of data.typhoons) {
    if (typhoon.points.length === 0) continue

    // Create LineString in WGS84 for turf
    const lineCoords = typhoon.points.map(p => [p.lng, p.lat])

    if (lineCoords.length >= 2) {
      // Use turf to create buffer around the line
      const line = turf.lineString(lineCoords)
      const buffered = turf.buffer(line, radiusKm, { units: 'kilometers' })

      // Convert turf polygon to OpenLayers polygon
      const olCoords = buffered.geometry.coordinates[0].map((coord: number[]) => fromLonLat(coord))
      const polygonGeom = new Polygon([olCoords])

      const feature = new Feature({ geometry: polygonGeom })
      feature.setStyle(new Style({
        stroke: new Stroke({ color: '#409eff', width: 1.5, lineDash: [6, 4] }),
        fill: new Fill({ color: 'rgba(64, 158, 255, 0.08)' }),
      }))
      source.addFeature(feature)
    } else if (lineCoords.length === 1) {
      // Single point - create circle buffer
      const center = fromLonLat(lineCoords[0])
      const circleGeom = new Circle(center, radiusKm * 1000)

      const feature = new Feature({ geometry: circleGeom })
      feature.setStyle(new Style({
        stroke: new Stroke({ color: '#409eff', width: 1.5, lineDash: [6, 4] }),
        fill: new Fill({ color: 'rgba(64, 158, 255, 0.08)' }),
      }))
      source.addFeature(feature)
    }

    // Draw trajectory line
    if (typhoon.points.length > 1) {
      const coords = typhoon.points.map(p => fromLonLat([p.lng, p.lat]))
      const lineFeature = new Feature({ geometry: new LineString(coords) })
      lineFeature.setStyle(new Style({
        stroke: new Stroke({ color: '#409eff', width: 2, lineDash: [8, 4] }),
      }))
      source.addFeature(lineFeature)
    }
  }
}

function clearBufferLayer() {
  if (bufferLayer) {
    bufferLayer.getSource()?.clear()
  }
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
  if (map && policyLayer) map.removeLayer(policyLayer)
  if (map && bufferLayer) map.removeLayer(bufferLayer)
  if (mapClickKey) {
    unlistenByKey(mapClickKey)
    mapClickKey = null
  }
  if (visibilityHandler) {
    document.removeEventListener('visibilitychange', visibilityHandler)
    visibilityHandler = null
  }
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

/* 台风信息面板（左下角） */
.typhoon-info-panel {
  position: absolute;
  bottom: 60px;
  left: 10px;
  width: 320px;
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

.typhoon-info-header {
  display: flex;
  align-items: center;
  padding: 10px 14px;
  cursor: pointer;
  border-bottom: 1px solid #ebeef5;
  flex-shrink: 0;

  &:hover {
    background: #f5f7fa;
  }
}

.typhoon-info-title {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
}

.typhoon-info-body {
  overflow-y: auto;
  max-height: 350px;
  padding: 4px 0;
}

.typhoon-card {
  padding: 10px 14px;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover {
    background-color: #f5f7fa;
  }

  &:last-child {
    border-bottom: none;
  }
}

.typhoon-name {
  font-size: 15px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 8px;
}

.typhoon-detail-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  line-height: 1.8;
}

.typhoon-detail-label {
  color: #909399;
  flex-shrink: 0;
}

.typhoon-detail-value {
  color: #303133;
  font-weight: 500;
  text-align: right;
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
