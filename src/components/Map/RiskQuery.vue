<template>
  <div class="risk-query">
    <div class="query-header" @click="expanded = !expanded">
      <span class="header-text">风险查询</span>
      <svg :class="['arrow', { rotated: expanded }]" viewBox="0 0 1024 1024" width="14" height="14" fill="currentColor">
        <path d="M715.8 493.5L335 165.1c-14.2-12.3-35-12.3-49.2 0l-40.2 34.5c-14.2 12.3-14.2 32.1 0 44.4l355.6 308.1c14.2 12.3 35 12.3 49.2 0l355.6-308.1c14.2-12.3 14.2-32.1 0-44.4l-40.2-34.5c-14.2-12.3-35-12.3-49.2 0z"/>
      </svg>
    </div>

    <div v-show="expanded" class="query-body">
      <!-- 模式切换 -->
      <div class="mode-switch">
        <div
          class="mode-btn"
          :class="{ active: mode === 'point' }"
          @click="switchMode('point')"
        >单点</div>
        <div
          class="mode-btn"
          :class="{ active: mode === 'region' }"
          @click="switchMode('region')"
        >区域</div>
      </div>

      <!-- 单点模式 -->
      <div v-if="mode === 'point'" class="point-panel">
        <div class="search-input-wrapper">
          <el-input
            v-model="pointKeyword"
            placeholder="输入地址搜索"
            clearable
            size="small"
            @input="onPointInput"
            @focus="onFocus"
            @clear="clearPointSearch"
          >
            <template #append>
              <el-tooltip content="在地图上点击定位" placement="top" :show-after="300">
                <div class="locate-btn" :class="{ active: locatingMode }" @click="toggleLocateMode">
                  <svg viewBox="0 0 1024 1024" width="14" height="14" fill="currentColor">
                    <path d="M512 64C288 64 96 256 96 480c0 132 64 260 172 380 60 66 124 120 176 156 12 8 24 14 32 18 6 2 12 4 16 4h40c4 0 10-2 16-4 8-4 20-10 32-18 52-36 116-90 176-156C868 740 928 612 928 480c0-224-192-416-416-416zm0 704c-35 0-64-29-64-64s29-64 64-64 64 29 64 64-29 64-64 64z"/>
                  </svg>
                </div>
              </el-tooltip>
            </template>
          </el-input>
        </div>


        <!-- 历史记录 -->
        <div v-if="showHistory && pointHistory.length > 0 && mode === 'point'" class="suggestions-list history-list">
          <div class="history-header">
            <span>最近选择</span>
          </div>
          <div
            v-for="(item, idx) in pointHistory"
            :key="idx"
            class="suggestion-item"
            @click="selectHistoryItem(item)"
          >
            <div class="history-item-content">
              <div class="suggestion-name">{{ item.address }}</div>
              <div class="suggestion-addr">{{ item.lng.toFixed(6) }}, {{ item.lat.toFixed(6) }}</div>
            </div>
            <span class="history-item-remove" @click.stop="removeHistoryItem(idx)">×</span>
          </div>
        </div>
        <!-- 输入提示列表 -->
        <div v-if="showSuggestions && suggestions.length > 0" class="suggestions-list">
          <div
            v-for="(item, idx) in suggestions"
            :key="idx"
            class="suggestion-item"
            @click="selectSuggestion(item)"
          >
            <div class="suggestion-name">{{ item.name }}</div>
            <div class="suggestion-addr">{{ item.district }}{{ item.address ? ' ' + item.address : '' }}</div>
          </div>
        </div>

        <!-- 查询保单 -->
        <div class="insurance-query">
          <div class="insurance-header">
            <span class="insurance-label">查询保单</span>
            <el-switch v-model="insuranceEnabled" size="small" />
          </div>
          <div v-if="insuranceEnabled" class="insurance-form">
            <div class="insurance-row">
              <el-cascader
                v-model="selectedInsurance"
                :options="insuranceOptions"
                :props="cascaderProps"
                placeholder="险类 / 险种"
                size="small"
                collapse-tags
                collapse-tags-tooltip
                :max-collapse-tags="1"
                clearable
              />
              <el-select
                v-if="mode === 'point'"
                v-model="searchRadius"
                placeholder="范围"
              >
                <el-option
                  v-for="r in radiusOptions"
                  :key="r"
                  :label="r + ' km'"
                  :value="r"
                />
              </el-select>
            </div>
          </div>
          <div class="insurance-btns">
            <el-button size="small" @click="resetAll">重置</el-button>
            <el-button type="primary" size="small" :loading="querying" @click="handleQuery">查询</el-button>
          </div>
        </div>

        <!-- 单点信息 -->
        <div v-if="pointInfo" class="point-info">
          <div class="info-row">
            <span class="info-label">地址：</span>
            <span class="info-value">{{ pointInfo.address }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">坐标：</span>
            <span class="info-value">{{ pointInfo.lng.toFixed(6) }}, {{ pointInfo.lat.toFixed(6) }}</span>
          </div>
          <div class="clear-btn" @click="clearPointSearch">清除</div>
        </div>
      </div>

      <!-- 区域模式 -->
      <div v-if="mode === 'region'" class="region-panel">
        <!-- 行政区划选择 -->
        <div class="district-wrapper">
        <div class="district-trigger" @click="toggleCascading">
          <span class="trigger-label">地区选择</span>
          <span class="trigger-value">{{ cascadingDisplay || '请选择' }}</span>
          <svg :class="['trigger-arrow', { rotated: showCascading }]" viewBox="0 0 1024 1024" width="12" height="12" fill="currentColor">
            <path d="M715.8 493.5L335 165.1c-14.2-12.3-35-12.3-49.2 0l-40.2 34.5c-14.2 12.3-14.2 32.1 0 44.4l355.6 308.1c14.2 12.3 35 12.3 49.2 0l355.6-308.1c14.2-12.3 14.2-32.1 0-44.4l-40.2-34.5c-14.2-12.3-35-12.3-49.2 0z"/>
          </svg>
        </div>

        <!-- 级联面板 -->
        <div v-if="showCascading" class="cascading-panel">
          <div class="cascading-columns">
            <!-- 省列表 -->
            <div class="cascading-col">
              <div
                v-for="p in provinces"
                :key="p.adcode"
                class="cascading-item"
                :class="{ active: cascadingPath[0]?.adcode === p.adcode }"
                @click="onCascadingClick(p, 0)"
              >
                <span>{{ p.name }}</span>
              </div>
            </div>

            <!-- 市列表 -->
            <div v-if="cascadingLevel >= 1" class="cascading-col">
              <div
                v-for="c in cascadingCities"
                :key="c.adcode"
                class="cascading-item"
                :class="{ active: cascadingPath[1]?.adcode === c.adcode }"
                @click="onCascadingClick(c, 1)"
              >
                <span>{{ c.name }}</span>
              </div>
            </div>

            <!-- 区列表 -->
            <div v-if="cascadingLevel >= 2" class="cascading-col">
              <div
                v-for="(d, dIdx) in cascadingDistricts"
                :key="d.adcode || dIdx"
                class="cascading-item"
                @click="selectCascadingRegion(d, 2, dIdx)"
              >
                <span class="item-radio" :style="selectedDistrictIdx === dIdx ? 'border-color:#409eff' : 'border-color:#c0c4cc'">
                  <span v-if="selectedDistrictIdx === dIdx" class="radio-dot"></span>
                </span>
                <span>{{ d.name }}</span>
              </div>
            </div>
          </div>
        </div>
        </div>

        <!-- 自定义图形 -->
        <div class="custom-shapes">
          <div class="shapes-label">自定义图形</div>
          <div class="shapes-btns">
            <div
              class="shape-btn"
              :class="{ active: activeShape === 'Circle' }"
              @click="startDrawShape('Circle')"
            >
              <svg viewBox="0 0 1024 1024" width="16" height="16" fill="currentColor">
                <path d="M512 64C264.6 64 64 264.6 64 512s200.6 448 448 448 448-200.6 448-448S759.4 64 512 64zm0 820c-205.4 0-372-166.6-372-372s166.6-372 372-372 372 166.6 372 372-166.6 372-372 372z"/>
              </svg>
              <span>圆形</span>
            </div>
            <div
              class="shape-btn"
              :class="{ active: activeShape === 'Square' }"
              @click="startDrawShape('Square')"
            >
              <svg viewBox="0 0 1024 1024" width="16" height="16" fill="currentColor">
                <path d="M864 144H160c-35.3 0-64 28.7-64 64v608c0 35.3 28.7 64 64 64h704c35.3 0 64-28.7 64-64V208c0-35.3-28.7-64-64-64zm-8 664H168V216h688v592z"/>
              </svg>
              <span>正方形</span>
            </div>
            <div
              class="shape-btn"
              :class="{ active: activeShape === 'Polygon' }"
              @click="startDrawShape('Polygon')"
            >
              <svg viewBox="0 0 1024 1024" width="16" height="16" fill="currentColor">
                <path d="M512 64L960 384 768 960H256L64 384z"/>
              </svg>
              <span>多边形</span>
            </div>
          </div>
          <div v-if="activeShape" class="shape-tip">
            {{ shapeTipText }}
            <span class="cancel-draw" @click="cancelDraw">取消</span>
          </div>
        </div>

        <!-- 区域信息 -->
        <div v-if="regionInfo" class="region-info">
          <div class="info-row">
            <span class="info-label">区域：</span>
            <span class="info-value">{{ regionInfo.name }}</span>
          </div>
          <div class="clear-btn" @click="clearRegion">清除</div>
        </div>

        <!-- 查询保单 -->
        <div class="insurance-query">
          <div class="insurance-header">
            <span class="insurance-label">查询保单</span>
            <el-switch v-model="insuranceEnabled" size="small" />
          </div>
          <div v-if="insuranceEnabled" class="insurance-form">
            <div class="insurance-row">
              <el-cascader
                v-model="selectedInsurance"
                :options="insuranceOptions"
                :props="cascaderProps"
                placeholder="险类 / 险种"
                size="small"
                collapse-tags
                collapse-tags-tooltip
                :max-collapse-tags="1"
                clearable
              />
            </div>
          </div>
          <div class="insurance-btns">
            <el-button size="small" @click="resetAll">重置</el-button>
            <el-button type="primary" size="small" :loading="querying" @click="handleQuery">查询</el-button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { useMapStore } from '@/store/mapStore'
import {
  autoCompleteInput,
  reverseGeocode,
  getSubDistricts,
} from '@/services/amapService'
import { insuranceService, type InsurancePolicyGroupVO, type PolicyStats, type CategoryPolicyStats } from '@/services/insuranceService'
import { riskAssessService, type RiskAssessResponse } from '@/services/riskAssess'
import { fromLonLat, toLonLat } from 'ol/proj'
import VectorLayer from 'ol/layer/Vector'
import VectorSource from 'ol/source/Vector'
import Feature from 'ol/Feature'
import Point from 'ol/geom/Point'
import Circle from 'ol/geom/Circle'
import Polygon from 'ol/geom/Polygon'
import { Style, Stroke, Fill, Circle as CircleStyle, Text } from 'ol/style'
import Draw from 'ol/interaction/Draw'
import Overlay from 'ol/Overlay'
import Select from 'ol/interaction/Select'
import { click } from 'ol/events/condition'
import type { Map } from 'ol'
import type { EventsKey } from 'ol/Observable'
import { unByKey } from 'ol/Observable'

const mapStore = useMapStore()
const emit = defineEmits<{
  (e: 'risk-result', data: RiskAssessResponse | null): void
  (e: 'policy-stats', data: PolicyStats | null): void
}>()
const expanded = ref(true)
const mode = ref<'point' | 'region'>('point')

// === 单点相关 ===
const pointKeyword = ref('')
const suggestions = ref<any[]>([])
const showSuggestions = ref(false)
const locatingMode = ref(false)
const pointInfo = ref<{ address: string; lng: number; lat: number } | null>(null)

// === 单点历史记录 ===
const showHistory = ref(false)
const pointHistory = ref<{ address: string; lng: number; lat: number; timestamp: number }[]>([])

// === 查询保单 ===
const insuranceEnabled = ref(false)
const searchRadius = ref(2)
const querying = ref(false)

const insuranceOptions = ref<any[]>([])
const selectedInsurance = ref<string[][]>([])
const cascaderProps = { multiple: true }

// === 保单查询结果 ===
const policyGroups = ref<InsurancePolicyGroupVO[]>([])

let bufferLayer: VectorLayer<VectorSource> | null = null
let policyLayer: VectorLayer<VectorSource> | null = null
let policyOverlay: Overlay | null = null
let policyPopupEl: HTMLElement | null = null

async function loadInsuranceTree() {
  try {
    const tree = await insuranceService.getTree()
    // 在顶层加一个"全部"节点
    insuranceOptions.value = [
      {
        value: 'all',
        label: '全部',
        children: tree,
      },
    ]
    resetInsuranceSelection()
  } catch {
    insuranceOptions.value = []
    selectedInsurance.value = []
  }
}

function resetInsuranceSelection() {
  const paths: string[][] = []
  if (insuranceOptions.value.length > 0) {
    for (const cat of insuranceOptions.value[0].children) {
      for (const type of cat.children) {
        paths.push(['all', cat.value, type.value])
      }
    }
  }
  selectedInsurance.value = paths
}

function resetInsuranceQuery() {
  insuranceEnabled.value = false
  searchRadius.value = 2
  resetInsuranceSelection()
  clearPolicyResults()
  emit('policy-stats', null)
}

// === 保单查询 ===
async function handleQuery() {
  // 1. 风险评级查询（无论保单开关是否开启都执行）
  await handleRiskAssess()

  // 2. 保单查询（仅在开关开启时执行）
  if (insuranceEnabled.value) {
    await handleInsuranceQuery()
    emitPolicyStats()
  } else {
    emit('policy-stats', null)
  }
}

function emitPolicyStats() {
  let targetCount = 0
  let coverageAmount = 0
  let premium = 0
  const categoryMap = new Map<string, { targetCount: number; coverageAmount: number; premium: number }>()

  for (const group of policyGroups.value) {
    targetCount += group.count
    for (const policy of group.policies) {
      coverageAmount += policy.coverageAmount || 0
      premium += policy.premium || 0

      const name = policy.typeName || '其他'
      const cat = categoryMap.get(name)
      if (cat) {
        cat.targetCount += 1
        cat.coverageAmount += policy.coverageAmount || 0
        cat.premium += policy.premium || 0
      } else {
        categoryMap.set(name, {
          targetCount: 1,
          coverageAmount: policy.coverageAmount || 0,
          premium: policy.premium || 0,
        })
      }
    }
  }

  const categories: CategoryPolicyStats[] = Array.from(categoryMap.entries())
    .map(([typeName, stats]) => ({ typeName, ...stats }))
    .sort((a, b) => b.targetCount - a.targetCount)

  emit('policy-stats', targetCount > 0 ? { targetCount, coverageAmount, premium, categories } : null)
}

async function handleRiskAssess() {
  try {
    let result: RiskAssessResponse

    if (mode.value === 'point') {
      if (!pointInfo.value) {
        ElMessage.warning('请先在地图上定位一个点')
        return
      }
      result = await riskAssessService.assessPoint({
        longitude: pointInfo.value.lng,
        latitude: pointInfo.value.lat,
      })
    } else {
      if (!regionGeometry.value) {
        ElMessage.warning('请先选择一个区域')
        return
      }
      result = await riskAssessService.assessArea({
        geometry: regionGeometry.value,
      })
    }

    emit('risk-result', result)
  } catch (error) {
    console.error('风险评级查询失败:', error)
  }
}

async function handleInsuranceQuery() {

  // 提取选中的险类和险种
  const categoryCodes: string[] = []
  const typeCodes: string[] = []
  for (const path of selectedInsurance.value) {
    if (path.length >= 3) {
      const categoryCode = path[1]
      const typeCode = path[2]
      if (!categoryCodes.includes(categoryCode)) {
        categoryCodes.push(categoryCode)
      }
      if (!typeCodes.includes(typeCode)) {
        typeCodes.push(typeCode)
      }
    }
  }

  querying.value = true
  try {
    let result: InsurancePolicyGroupVO[] = []

    if (mode.value === 'point') {
      // 单点模式
      if (!pointInfo.value) {
        ElMessage.warning('请先在地图上定位一个点')
        return
      }

      result = await insuranceService.queryByBuffer({
        lng: pointInfo.value.lng,
        lat: pointInfo.value.lat,
        radius: searchRadius.value,
        categoryCodes: categoryCodes.length > 0 ? categoryCodes : undefined,
        typeCodes: typeCodes.length > 0 ? typeCodes : undefined,
      })

      // 绘制缓冲区圆圈
      drawBufferCircle(pointInfo.value.lng, pointInfo.value.lat, searchRadius.value)
    } else {
      // 区域模式
      if (!regionGeometry.value) {
        ElMessage.warning('请先选择一个区域')
        return
      }

      result = await insuranceService.queryByRegion({
        geometry: regionGeometry.value,
        categoryCodes: categoryCodes.length > 0 ? categoryCodes : undefined,
        typeCodes: typeCodes.length > 0 ? typeCodes : undefined,
      })
    }

    policyGroups.value = result

    // 绘制保单点位
    drawPolicyPoints(result)

    if (result.length === 0) {
      ElMessage.info('未查询到保单数据')
    }
  } catch (error) {
    ElMessage.error('查询失败')
  } finally {
    querying.value = false
  }
}

function drawBufferCircle(lng: number, lat: number, radiusKm: number) {
  ensureBufferLayer()
  const map = getMap()
  if (!map || !bufferLayer) return

  const source = bufferLayer.getSource()
  if (!source) return
  source.clear()

  // 创建圆形缓冲区（半径单位：米）
  const center = fromLonLat([lng, lat])
  const circleGeom = new Circle(center, radiusKm * 1000)

  const feature = new Feature({ geometry: circleGeom })
  feature.setStyle(new Style({
    stroke: new Stroke({ color: '#409eff', width: 2, lineDash: [8, 4] }),
    fill: new Fill({ color: 'rgba(64, 158, 255, 0.1)' }),
  }))
  source.addFeature(feature)
}

function drawPolicyPoints(groups: InsurancePolicyGroupVO[]) {
  ensurePolicyLayer()
  const map = getMap()
  if (!map || !policyLayer) return

  const source = policyLayer.getSource()
  if (!source) return
  source.clear()

  for (const group of groups) {
    const feature = new Feature({
      geometry: new Point(fromLonLat([group.lng, group.lat])),
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

    // 存储分组数据
    feature.set('groupData', group)
    source.addFeature(feature)
  }

  // 添加点击交互
  setupPolicyClickInteraction(map)
}

let selectInteraction: Select | null = null

function setupPolicyClickInteraction(map: Map) {
  // 移除之前的交互
  if (selectInteraction) {
    map.removeInteraction(selectInteraction)
    selectInteraction = null
  }

  // 创建 Select 交互，只作用于保单图层
  selectInteraction = new Select({
    condition: click,
    layers: (layer) => layer === policyLayer,
    style: new Style({
      image: new CircleStyle({
        radius: 12,
        fill: new Fill({ color: '#409eff' }),
        stroke: new Stroke({ color: '#fff', width: 3 }),
      }),
    }),
  })

  selectInteraction.on('select', (evt) => {
    const selected = evt.selected
    if (selected.length > 0) {
      const feature = selected[0]
      const group = feature.get('groupData') as InsurancePolicyGroupVO
      if (group) {
        updatePolicyPopupContent(group)
        const geom = feature.getGeometry() as Point
        const coord = geom.getCoordinates()
        if (policyOverlay) {
          policyOverlay.setPosition(coord)
        }
      }
    } else {
      closePolicyPopup()
    }
  })

  map.addInteraction(selectInteraction)
}

function closePolicyPopup() {
  if (policyOverlay) {
    policyOverlay.setPosition(undefined)
  }
}

function clearPolicyResults() {
  policyGroups.value = []
  if (bufferLayer) {
    bufferLayer.getSource()?.clear()
  }
  if (policyLayer) {
    policyLayer.getSource()?.clear()
  }
  if (selectInteraction && mapInstance) {
    mapInstance.removeInteraction(selectInteraction)
    selectInteraction = null
  }
  if (policyOverlay) {
    policyOverlay.setPosition(undefined)
  }
}

function ensureBufferLayer() {
  if (bufferLayer) return
  const map = getMap()
  if (!map) return
  bufferLayer = new VectorLayer({
    source: new VectorSource(),
    zIndex: 10,
  })
  map.addLayer(bufferLayer)
}

function createPolicyPopupElement(): HTMLElement {
  const container = document.createElement('div')
  container.className = 'ol-policy-popup'
  container.innerHTML = `
    <div class="ol-policy-popup-header">
      <span class="ol-policy-popup-title"></span>
      <span class="ol-policy-popup-close">&times;</span>
    </div>
    <div class="ol-policy-popup-body"></div>
  `
  // 关闭按钮事件
  container.querySelector('.ol-policy-popup-close')?.addEventListener('click', () => {
    closePolicyPopup()
  })
  return container
}

function updatePolicyPopupContent(group: InsurancePolicyGroupVO) {
  if (!policyPopupEl) return

  const titleEl = policyPopupEl.querySelector('.ol-policy-popup-title')
  if (titleEl) {
    titleEl.textContent = `保单列表 (${group.count}条)`
  }

  const bodyEl = policyPopupEl.querySelector('.ol-policy-popup-body')
  if (bodyEl) {
    let html = ''
    for (const policy of group.policies) {
      html += `
        <div class="ol-policy-item">
          <div class="ol-policy-item-header">
            <span class="ol-policy-no">${policy.policyNo}</span>
            <span class="ol-policy-type">${policy.typeName}</span>
          </div>
          <div class="ol-policy-item-detail">
            <div class="ol-policy-row"><span class="ol-policy-label">投保人：</span><span class="ol-policy-value">${policy.policyHolder}</span></div>
            <div class="ol-policy-row"><span class="ol-policy-label">被保险人：</span><span class="ol-policy-value">${policy.insuredName}</span></div>
            <div class="ol-policy-row"><span class="ol-policy-label">险类：</span><span class="ol-policy-value">${policy.categoryName}</span></div>
            <div class="ol-policy-row"><span class="ol-policy-label">保额：</span><span class="ol-policy-value">${policy.coverageAmount?.toLocaleString()} 元</span></div>
            <div class="ol-policy-row"><span class="ol-policy-label">保费：</span><span class="ol-policy-value">${policy.premium?.toLocaleString()} 元</span></div>
            <div class="ol-policy-row"><span class="ol-policy-label">标的序号：</span><span class="ol-policy-value">${policy.targetNo}</span></div>
            <div class="ol-policy-row"><span class="ol-policy-label">保险期间：</span><span class="ol-policy-value">${policy.startDate} 至 ${policy.endDate}</span></div>
            ${policy.address ? `<div class="ol-policy-row"><span class="ol-policy-label">地址：</span><span class="ol-policy-value">${policy.address}</span></div>` : ''}
          </div>
        </div>
      `
    }
    bodyEl.innerHTML = html
  }
}

function ensurePolicyLayer() {
  if (policyLayer) return
  const map = getMap()
  if (!map) return

  // 创建弹窗元素
  policyPopupEl = createPolicyPopupElement()

  // 创建 Overlay
  policyOverlay = new Overlay({
    element: policyPopupEl,
    autoPan: true,
    autoPanAnimation: {
      duration: 250,
    },
  })
  map.addOverlay(policyOverlay)

  policyLayer = new VectorLayer({
    source: new VectorSource(),
    zIndex: 20,
  })
  map.addLayer(policyLayer)
}

// 重置所有状态到初始状态
function resetAll() {
  // 重置单点模式
  clearPointSearch()

  // 重置区域模式
  showCascading.value = false
  cascadingLevel.value = 0
  cascadingPath.value = []
  cascadingCities.value = []
  cascadingDistricts.value = []
  selectedDistrictAdcode.value = ''
  selectedDistrictIdx.value = -1
  selectedDisplayPath.value = []
  activeShape.value = null
  removeDrawInteraction()
  clearRegion()

  // 重置查询保单
  resetInsuranceQuery()

  // 清除保单查询结果
  clearPolicyResults()

  // 重置地图视图到初始状态
  const map = getMap()
  if (map) {
    const view = map.getView()
    view.animate({
      center: fromLonLat(mapStore.initialCenter),
      zoom: mapStore.initialZoom,
      duration: 500,
    })
  }
}

const radiusOptions = [1, 2, 3, 4, 5]

let pointLayer: VectorLayer<VectorSource> | null = null
let mapClickKey: EventsKey | null = null

// === 区域相关 ===
const provinces = ref<any[]>([])
const showCascading = ref(false)
const cascadingLevel = ref(0)
const cascadingPath = ref<{ name: string; adcode: string }[]>([])
const cascadingCities = ref<any[]>([])
const cascadingDistricts = ref<any[]>([])
const selectedDistrictAdcode = ref('')
const selectedDistrictIdx = ref(-1)

const regionInfo = ref<{ name: string } | null>(null)
const regionGeometry = ref<string | null>(null)  // WKT 格式的区域几何

const selectedDisplayPath = ref<{ name: string; adcode: string }[]>([])

const cascadingDisplay = computed(() => {
  return selectedDisplayPath.value.map(p => p.name).join('/')
})

let regionLayer: VectorLayer<VectorSource> | null = null
let drawInteraction: Draw | null = null
const activeShape = ref<string | null>(null)

let mapInstance: Map | null = null

const shapeTipText = ref('')

watch(activeShape, (val) => {
  if (val === 'Circle') shapeTipText.value = '在地图上按住拖动绘制圆形'
  else if (val === 'Square') shapeTipText.value = '在地图上按住拖动绘制正方形'
  else if (val === 'Polygon') shapeTipText.value = '在地图上点击绘制多边形，双击结束'
  else shapeTipText.value = ''
})

function getMap(): Map | null {
  return mapStore.map
}

// 初始化图层
function ensurePointLayer() {
  if (pointLayer) return
  const map = getMap()
  if (!map) return
  pointLayer = new VectorLayer({
    source: new VectorSource(),
    style: new Style({
      image: new CircleStyle({
        radius: 8,
        fill: new Fill({ color: '#f56c6c' }),
        stroke: new Stroke({ color: '#fff', width: 3 }),
      }),
      text: new Text({
        text: '',
        offsetY: -20,
        fill: new Fill({ color: '#333' }),
        stroke: new Stroke({ color: '#fff', width: 3 }),
      }),
    }),
  })
  map.addLayer(pointLayer)
}

function ensureRegionLayer() {
  if (regionLayer) return
  const map = getMap()
  if (!map) return
  regionLayer = new VectorLayer({
    source: new VectorSource(),
    style: new Style({
      stroke: new Stroke({ color: '#409eff', width: 2 }),
      fill: new Fill({ color: 'rgba(64, 158, 255, 0.15)' }),
    }),
  })
  map.addLayer(regionLayer)
}

// === 模式切换 ===
function switchMode(m: 'point' | 'region') {
  mode.value = m
  clearPointSearch()
  clearRegion()
  removeDrawInteraction()
  activeShape.value = null
  showCascading.value = false
  cascadingLevel.value = 0
  cascadingPath.value = []
  cascadingCities.value = []
  cascadingDistricts.value = []
  selectedDistrictAdcode.value = ''
  selectedDistrictIdx.value = -1
  selectedDisplayPath.value = []
  resetInsuranceQuery()
  clearPolicyResults()
  emit('risk-result', null)
}

// === 单点模式 ===
let inputTimer: ReturnType<typeof setTimeout> | null = null

function toggleLocateMode() {
  locatingMode.value = !locatingMode.value
  const map = getMap()
  if (map) {
    map.getTargetElement().style.cursor = locatingMode.value ? 'crosshair' : ''
  }
}

function onPointInput(val: string) {
  if (inputTimer) clearTimeout(inputTimer)
  if (!val.trim()) {
    suggestions.value = []
    showSuggestions.value = false
    showHistory.value = true
    return
  }
  showHistory.value = false
  inputTimer = setTimeout(async () => {
    try {
      const tips = await autoCompleteInput(val)
      suggestions.value = tips.filter((t: any) => t.location)
      if (suggestions.value.length > 0) showSuggestions.value = true
    } catch {
      suggestions.value = []
    }
  }, 300)
}

function selectSuggestion(item: any) {
  showSuggestions.value = false
  showHistory.value = false
  pointKeyword.value = item.name
  suggestions.value = []

  const lng = parseFloat(item.location.split(',')[0])
  const lat = parseFloat(item.location.split(',')[1])

  setPointOnMap(lng, lat, item.name)
}

function onMapClick(lng: number, lat: number) {
  if (mode.value !== 'point') return
  // 逆地理编码
  reverseGeocode(`${lng},${lat}`).then((res) => {
    const addr = res?.regeocode?.formatted_address || `${lng.toFixed(6)}, ${lat.toFixed(6)}`
    pointInfo.value = { address: addr, lng, lat }
    setPointOnMap(lng, lat, addr)
  }).catch(() => {
    pointInfo.value = { address: `${lng.toFixed(6)}, ${lat.toFixed(6)}`, lng, lat }
    setPointOnMap(lng, lat, `${lng.toFixed(4)}, ${lat.toFixed(4)}`)
  })
}

function setPointOnMap(lng: number, lat: number, label: string) {
  ensurePointLayer()
  const map = getMap()
  if (!map || !pointLayer) return

  const source = pointLayer.getSource()
  if (!source) return
  source.clear()

  const feature = new Feature({
    geometry: new Point(fromLonLat([lng, lat])),
  })
  feature.setStyle(new Style({
    image: new CircleStyle({
      radius: 8,
      fill: new Fill({ color: '#f56c6c' }),
      stroke: new Stroke({ color: '#fff', width: 3 }),
    }),
    text: new Text({
      text: label,
      offsetY: -20,
      font: '12px sans-serif',
      fill: new Fill({ color: '#333' }),
      stroke: new Stroke({ color: '#fff', width: 3 }),
    }),
  }))
  source.addFeature(feature)

  // 缩放到200米范围
  const view = map.getView()
  view.animate({
    center: fromLonLat([lng, lat]),
    zoom: 17,
    duration: 500,
  })

  pointInfo.value = { address: label, lng, lat }
  saveToPointHistory(label, lng, lat)
}

function clearPointSearch() {
  pointKeyword.value = ''
  suggestions.value = []
  showSuggestions.value = false
  showHistory.value = false
  locatingMode.value = false
  pointInfo.value = null
  if (pointLayer) {
    pointLayer.getSource()?.clear()
  }
  const map = getMap()
  if (map) map.getTargetElement().style.cursor = ''
  clearPolicyResults()
}

// === 单点历史记录 ===
function loadPointHistory() {
  try {
    const raw = localStorage.getItem('risk-query-point-history')
    pointHistory.value = raw ? JSON.parse(raw) : []
  } catch {
    pointHistory.value = []
  }
}

function saveToPointHistory(address: string, lng: number, lat: number) {
  const filtered = pointHistory.value.filter(h => !(h.lng === lng && h.lat === lat))
  filtered.unshift({ address, lng, lat, timestamp: Date.now() })
  pointHistory.value = filtered.slice(0, 15)
  localStorage.setItem('risk-query-point-history', JSON.stringify(pointHistory.value))
}

function clearPointHistory() {
  pointHistory.value = []
  showHistory.value = false
  localStorage.removeItem('risk-query-point-history')
}

function removeHistoryItem(idx: number) {
  pointHistory.value.splice(idx, 1)
  localStorage.setItem('risk-query-point-history', JSON.stringify(pointHistory.value))
  if (pointHistory.value.length === 0) {
    showHistory.value = false
  }
}

function selectHistoryItem(item: { address: string; lng: number; lat: number }) {
  pointKeyword.value = item.address
  showHistory.value = false
  showSuggestions.value = false
  setPointOnMap(item.lng, item.lat, item.address)
}

function onFocus() {
  if (pointKeyword.value.length === 0) {
    showSuggestions.value = false
    showHistory.value = true
  } else {
    showHistory.value = false
  }
}

// === 区域模式 ===
function toggleCascading() {
  showCascading.value = !showCascading.value
}

async function loadProvinces() {
  try {
    provinces.value = await getSubDistricts('100000', 1)
  } catch {
    provinces.value = []
  }
}

async function onCascadingClick(item: any, level: number) {
  // 更新路径：截断到当前级别，放入新选择
  cascadingPath.value = cascadingPath.value.slice(0, level)
  cascadingPath.value.push({ name: item.name, adcode: item.adcode })

  // 清除下级数据
  if (level === 0) {
    cascadingCities.value = []
    cascadingDistricts.value = []
  } else if (level === 1) {
    cascadingDistricts.value = []
  }

  selectedDistrictAdcode.value = ''
  selectedDistrictIdx.value = -1
  clearRegion()

  // 加载下一级
  try {
    const children = await getSubDistricts(item.adcode, 1)
    if (level === 0) {
      cascadingCities.value = children
    } else if (level === 1) {
      cascadingDistricts.value = children
    }
    cascadingLevel.value = level + 1
  } catch {
    // ignore
  }
}

async function selectCascadingRegion(item: any, level: number, idx?: number) {
  selectedDistrictAdcode.value = item.adcode
  selectedDistrictIdx.value = idx ?? -1

  // 保存显示路径（用于触发框显示）
  selectedDisplayPath.value = [...cascadingPath.value.slice(0, level), { name: item.name, adcode: item.adcode }]

  // 清除自定义图形
  activeShape.value = null
  removeDrawInteraction()

  clearRegion()
  zoomToAdcode(item.adcode)

  // 选中后关闭面板
  showCascading.value = false
}

function resetCascading(toLevel: number) {
  cascadingPath.value = cascadingPath.value.slice(0, toLevel)
  selectedDistrictAdcode.value = ''
  selectedDistrictIdx.value = -1
  if (toLevel === 0) {
    cascadingLevel.value = 0
    cascadingCities.value = []
    cascadingDistricts.value = []
  } else if (toLevel === 1) {
    cascadingLevel.value = 1
    cascadingDistricts.value = []
  }
  clearRegion()
}

async function zoomToAdcode(adcode: string) {
  const map = getMap()
  if (!map) return

  try {
    const res = await getSubDistricts(adcode, 0, 'all')
    if (res.length > 0 && res[0].polyline) {
      drawDistrictPolygon(res[0])
    } else {
      // 如果没有polyline，尝试用center
      const district = res[0]
      if (district?.center) {
        const [lng, lat] = district.center.split(',').map(Number)
        map.getView().animate({
          center: fromLonLat([lng, lat]),
          zoom: 11,
          duration: 500,
        })
      }
    }
  } catch {
    // ignore
  }
}

function drawDistrictPolygon(district: any) {
  ensureRegionLayer()
  const map = getMap()
  if (!map || !regionLayer) return

  const source = regionLayer.getSource()
  if (!source) return
  source.clear()

  const polylines = district.polyline.split('|')
  let allCoords: number[][] = []
  let wktParts: string[] = []

  for (const ring of polylines) {
    const coords = ring.split(';').map((p: string) => {
      const [lng, lat] = p.split(',').map(Number)
      return fromLonLat([lng, lat])
    })
    allCoords = allCoords.concat(coords)

    const feature = new Feature({
      geometry: new Polygon([coords]),
    })
    source.addFeature(feature)

    // 生成 WKT（使用原始经纬度坐标）
    const wktCoords = ring.split(';').map((p: string) => {
      const [lng, lat] = p.split(',').map(Number)
      return `${lng} ${lat}`
    })
    wktParts.push(`(${wktCoords.join(',')})`)
  }

  // 保存区域几何 WKT
  if (wktParts.length > 0) {
    regionGeometry.value = `POLYGON(${wktParts.join(',')})`
  }

  // 缩放到区域范围
  if (allCoords.length > 0) {
    const extent = source.getExtent()
    map.getView().fit(extent, { padding: [50, 50, 50, 50], duration: 500 })
  }

  regionInfo.value = { name: district.name }
}

function clearRegion() {
  regionInfo.value = null
  regionGeometry.value = null
  if (regionLayer) {
    regionLayer.getSource()?.clear()
  }
}

// === 自定义图形绘制 ===
function startDrawShape(type: string) {
  const map = getMap()
  if (!map) return

  removeDrawInteraction()
  activeShape.value = type

  // 清除地区选择
  selectedDistrictAdcode.value = ''
  selectedDistrictIdx.value = -1
  selectedDisplayPath.value = []
  clearRegion()

  ensureRegionLayer()
  const source = regionLayer?.getSource()
  if (!source) return
  source.clear()

  let drawType: string
  let geometryFunction: any = undefined

  if (type === 'Circle') {
    drawType = 'Circle'
  } else if (type === 'Square') {
    drawType = 'Circle'
    geometryFunction = (coordinates: any, geometry: any) => {
      const center = coordinates[0]
      const end = coordinates[1]
      const dx = end[0] - center[0]
      const dy = end[1] - center[1]
      const radius = Math.sqrt(dx * dx + dy * dy)
      // 用正方形近似
      const half = radius / Math.sqrt(2)
      if (!geometry) {
        geometry = new Polygon([[
          [center[0] - half, center[1] - half],
          [center[0] + half, center[1] - half],
          [center[0] + half, center[1] + half],
          [center[0] - half, center[1] + half],
          [center[0] - half, center[1] - half],
        ]])
      } else {
        geometry.setCoordinates([[
          [center[0] - half, center[1] - half],
          [center[0] + half, center[1] - half],
          [center[0] + half, center[1] + half],
          [center[0] - half, center[1] + half],
          [center[0] - half, center[1] - half],
        ]])
      }
      return geometry
    }
  } else {
    drawType = 'Polygon'
  }

  drawInteraction = new Draw({
    source,
    type: drawType as any,
    geometryFunction,
    style: new Style({
      stroke: new Stroke({ color: '#e6a23c', width: 2, lineDash: [6, 4] }),
      fill: new Fill({ color: 'rgba(230, 162, 60, 0.15)' }),
      image: new CircleStyle({
        radius: 5,
        fill: new Fill({ color: '#e6a23c' }),
        stroke: new Stroke({ color: '#fff', width: 2 }),
      }),
    }),
  })

  drawInteraction.on('drawend', (evt: any) => {
    removeDrawInteraction()
    activeShape.value = null
    regionInfo.value = { name: '自定义区域' }

    // 保存绘制的几何 WKT
    const geom = evt.feature.getGeometry()
    if (geom) {
      const coords = geom.getCoordinates()
      let wkt = ''

      if (geom.getType() === 'Circle') {
        // 圆形转换为多边形近似（32边形）
        const center = geom.getCenter()
        const radius = geom.getRadius()
        const centerLngLat = toLonLat(center)
        const points: string[] = []
        for (let i = 0; i <= 32; i++) {
          const angle = (i * 2 * Math.PI) / 32
          const x = center[0] + radius * Math.cos(angle)
          const y = center[1] + radius * Math.sin(angle)
          const [lng, lat] = toLonLat([x, y])
          points.push(`${lng} ${lat}`)
        }
        wkt = `POLYGON((${points.join(',')}))`
      } else if (geom.getType() === 'Polygon') {
        const rings = coords.map((ring: number[][]) => {
          const points = ring.map((c: number[]) => {
            const [lng, lat] = toLonLat(c)
            return `${lng} ${lat}`
          })
          return `(${points.join(',')})`
        })
        wkt = `POLYGON(${rings.join(',')})`
      }

      if (wkt) {
        regionGeometry.value = wkt
      }
    }
  })

  map.addInteraction(drawInteraction)
}

function cancelDraw() {
  removeDrawInteraction()
  activeShape.value = null
}

function removeDrawInteraction() {
  const map = getMap()
  if (!map) return
  // 移除所有 Draw 类型的交互
  const interactions = map.getInteractions().getArray().slice()
  for (const interaction of interactions) {
    if (interaction instanceof Draw) {
      map.removeInteraction(interaction)
    }
  }
  drawInteraction = null
}

// === 生命周期 ===
onMounted(() => {
  loadInsuranceTree()

  loadPointHistory()

  // 等地图初始化
  const checkMap = () => {
    const map = getMap()
    if (map) {
      mapInstance = map
      loadProvinces()

      // 监听地图点击（单点定位模式）
      mapClickKey = map.on('singleclick', (evt: any) => {
        if (mode.value !== 'point' || !locatingMode.value) return
        const [lng, lat] = toLonLat(evt.coordinate)
        onMapClick(lng, lat)
        locatingMode.value = false
        map.getTargetElement().style.cursor = ''
      })

      // 点击其他地方关闭建议列表
      document.addEventListener('click', handleDocClick)
    } else {
      setTimeout(checkMap, 200)
    }
  }
  checkMap()
})

function handleDocClick(e: MouseEvent) {
  const target = e.target as HTMLElement
  if (!target.closest('.risk-query')) {
    showSuggestions.value = false
    showCascading.value = false
    showHistory.value = false
  }
}

onUnmounted(() => {
  if (mapClickKey) {
    unByKey(mapClickKey)
    mapClickKey = null
  }
  document.removeEventListener('click', handleDocClick)
  removeDrawInteraction()
  if (pointLayer && mapInstance) {
    mapInstance.removeLayer(pointLayer)
  }
  if (regionLayer && mapInstance) {
    mapInstance.removeLayer(regionLayer)
  }
  if (bufferLayer && mapInstance) {
    mapInstance.removeLayer(bufferLayer)
  }
  if (policyLayer && mapInstance) {
    mapInstance.removeLayer(policyLayer)
  }
  if (policyOverlay && mapInstance) {
    mapInstance.removeOverlay(policyOverlay)
  }
  if (selectInteraction && mapInstance) {
    mapInstance.removeInteraction(selectInteraction)
    selectInteraction = null
  }
})
</script>

<style lang="scss" scoped>
.risk-query {
  position: absolute;
  top: 10px;
  left: 10px;
  width: 305px;
  background: rgba(255, 255, 255, 0.96);
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.15);
  z-index: 1000;
}

.query-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  cursor: pointer;
  color: #303133;
  font-size: 14px;
  font-weight: 600;
  user-select: none;
  transition: background 0.2s;

  &:hover {
    background: #f5f7fa;
  }

  .header-text {
    flex: 1;
  }

  .arrow {
    transition: transform 0.2s;
    &.rotated {
      transform: rotate(180deg);
    }
  }
}

.query-body {
  padding: 0 12px 14px;
}

.mode-switch {
  display: flex;
  background: #f0f2f5;
  border-radius: 6px;
  padding: 3px;
  margin-bottom: 12px;

  .mode-btn {
    flex: 1;
    text-align: center;
    padding: 6px 0;
    font-size: 13px;
    border-radius: 4px;
    cursor: pointer;
    color: #606266;
    transition: all 0.2s;

    &.active {
      background: #409eff;
      color: #fff;
      font-weight: 500;
    }

    &:not(.active):hover {
      color: #409eff;
    }
  }
}

// 单点模式
.search-input-wrapper {
  :deep(.el-input) {
    width: 100%;
    height: 30px;

    .el-input__wrapper {
      height: 30px;
    }

    .el-input-group__append {
      padding: 0 8px;
      background: #f5f7fa;
    }
  }

  .locate-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    color: #909399;
    transition: color 0.2s;

    &:hover,
    &.active {
      color: #409eff;
    }
  }
}

.insurance-query {
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px solid #ebeef5;

  .insurance-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 8px;

    .insurance-label {
      font-size: 13px;
      color: #303133;
      font-weight: 500;
    }
  }

  .insurance-form {
    .insurance-row {
      display: flex;
      align-items: stretch;
      gap: 8px;

      :deep(.el-cascader) {
        flex: 1;
        min-width: 0;
      }

      :deep(.el-select) {
        width: 80px;
        flex-shrink: 0;
      }
    }
  }

  .insurance-btns {
    display: flex;
    gap: 8px;
    margin-top: 8px;

    :deep(.el-button) {
      flex: 1;
    }
  }
}

.suggestions-list {
  margin-top: 6px;
  max-height: 200px;
  overflow-y: auto;
  border: 1px solid #e4e7ed;
  border-radius: 4px;

  .suggestion-item {
    padding: 8px 10px;
    cursor: pointer;
    transition: background 0.15s;
    border-bottom: 1px solid #f0f2f5;

    &:last-child {
      border-bottom: none;
    }

    &:hover {
      background: #ecf5ff;
    }

    .suggestion-name {
      font-size: 13px;
      color: #303133;
      font-weight: 500;
    }

    .suggestion-addr {
      font-size: 11px;
      color: #909399;
      margin-top: 2px;
    }
  }

  &.history-list .suggestion-item {
    display: flex;
    align-items: center;

    .history-item-content {
      flex: 1;
      min-width: 0;
    }
  }

  .history-item-remove {
    width: 18px;
    height: 18px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 14px;
    color: #c0c4cc;
    cursor: pointer;
    flex-shrink: 0;
    margin-left: 8px;
    transition: all 0.15s;
    line-height: 1;
    user-select: none;

    &:hover {
      color: #f56c6c;
      background: #fef0f0;
    }
  }

  .history-header {
    padding: 6px 10px;
    font-size: 12px;
    color: #909399;
    border-bottom: 1px solid #f0f2f5;
  }

}

.point-info,
.region-info {
  margin-top: 10px;
  padding: 10px;
  background: #f5f7fa;
  border-radius: 6px;

  .info-row {
    display: flex;
    font-size: 12px;
    line-height: 1.6;

    .info-label {
      color: #909399;
      flex-shrink: 0;
    }

    .info-value {
      color: #303133;
      word-break: break-all;
    }
  }

  .clear-btn {
    margin-top: 8px;
    text-align: center;
    font-size: 12px;
    color: #f56c6c;
    cursor: pointer;

    &:hover {
      text-decoration: underline;
    }
  }
}

// 区域模式
.region-panel {
  position: relative;
}

.district-wrapper {
  position: relative;
}

.district-trigger {
  display: flex;
  align-items: center;
  padding: 6px 10px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;
  transition: border-color 0.2s;

  &:hover {
    border-color: #c0c4cc;
  }

  .trigger-label {
    color: #909399;
    margin-right: 8px;
    flex-shrink: 0;
  }

  .trigger-value {
    flex: 1;
    color: #303133;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: 13px;
  }

  .trigger-arrow {
    margin-left: 4px;
    color: #c0c4cc;
    transition: transform 0.2s;
    flex-shrink: 0;

    &.rotated {
      transform: rotate(180deg);
    }
  }
}

.cascading-panel {
  position: absolute;
  top: 100%;
  left: 0;
  margin-top: 4px;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  background: #fff;
  z-index: 10;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
}

.cascading-columns {
  display: flex;
  max-height: 210px;
  overflow-x: auto;
}

.cascading-col {
  width: 179px;
  min-width: 179px;
  border-right: 1px solid #f0f2f5;
  overflow-y: auto;
  max-height: 210px;

  &:last-child {
    border-right: none;
  }
}

.cascading-item {
  display: flex;
  align-items: center;
  height: 34px;
  padding: 0 10px;
  font-size: 13px;
  color: #606266;
  cursor: pointer;
  white-space: nowrap;
  transition: background 0.15s;
  gap: 6px;

  &:hover {
    background: #f5f7fa;
  }

  &.active {
    color: #409eff;
    font-weight: 500;
    background: #ecf5ff;
  }

  &.selectable:hover {
    background: #ecf5ff;
    color: #409eff;
  }

  .item-radio {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 14px;
    height: 14px;
    border-radius: 50%;
    border: 2px solid #c0c4cc;
    flex-shrink: 0;
    cursor: pointer;
    transition: border-color 0.2s;

    .radio-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: #409eff;
    }
  }
}

.custom-shapes {
  margin-top: 14px;
  padding-top: 12px;
  border-top: 1px solid #ebeef5;

  .shapes-label {
    font-size: 12px;
    color: #909399;
    margin-bottom: 8px;
  }

  .shapes-btns {
    display: flex;
    gap: 8px;

    .shape-btn {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 4px;
      padding: 6px 0;
      font-size: 12px;
      color: #606266;
      border: 1px solid #dcdfe6;
      border-radius: 4px;
      cursor: pointer;
      transition: all 0.2s;

      &:hover {
        border-color: #409eff;
        color: #409eff;
      }

      &.active {
        background: #409eff;
        border-color: #409eff;
        color: #fff;
      }
    }
  }

  .shape-tip {
    margin-top: 8px;
    font-size: 11px;
    color: #e6a23c;
    display: flex;
    align-items: center;
    justify-content: space-between;

    .cancel-draw {
      color: #f56c6c;
      cursor: pointer;
      font-size: 12px;

      &:hover {
        text-decoration: underline;
      }
    }
  }
}
</style>

<style lang="scss">
.insurance-form .el-cascader {
  .el-input__wrapper {
    height: 32px !important;
    min-height: 32px !important;
  }

  .el-cascader__tags {
    flex-wrap: nowrap !important;
    overflow: hidden !important;
    right: 30px !important;
  }

  .el-tag {
    max-width: 120px !important;

    .el-tag__content {
      max-width: 90px !important;
      overflow: hidden !important;
      text-overflow: ellipsis !important;
      white-space: nowrap !important;
    }
  }
}

// OpenLayers 保单弹窗样式（全局）
.ol-policy-popup {
  background: #fff !important;
  border-radius: 8px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
  width: 320px;
  max-height: 400px;
  display: flex;
  flex-direction: column;
  pointer-events: auto;

  .ol-policy-popup-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px 14px;
    border-bottom: 1px solid #ebeef5;
    background: #fff !important;
    border-radius: 8px 8px 0 0;

    .ol-policy-popup-title {
      font-size: 14px;
      font-weight: 600;
      color: #303133;
    }

    .ol-policy-popup-close {
      font-size: 18px;
      color: #909399;
      cursor: pointer;
      line-height: 1;

      &:hover {
        color: #f56c6c;
      }
    }
  }

  .ol-policy-popup-body {
    overflow-y: auto;
    max-height: 350px;
    padding: 8px;
    background: #fff !important;
    border-radius: 0 0 8px 8px;

    .ol-policy-item {
      padding: 10px;
      border: 1px solid #ebeef5;
      border-radius: 6px;
      margin-bottom: 8px;
      background: #fff !important;

      &:last-child {
        margin-bottom: 0;
      }

      .ol-policy-item-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 8px;

        .ol-policy-no {
          font-size: 13px;
          font-weight: 600;
          color: #303133;
        }

        .ol-policy-type {
          font-size: 12px;
          color: #409eff;
          background: #ecf5ff;
          padding: 2px 8px;
          border-radius: 4px;
        }
      }

      .ol-policy-item-detail {
        .ol-policy-row {
          display: flex;
          font-size: 12px;
          line-height: 1.8;

          .ol-policy-label {
            color: #909399;
            flex-shrink: 0;
            width: 70px;
          }

          .ol-policy-value {
            color: #303133;
            flex: 1;
          }
        }
      }
    }
  }
}
</style>
