<template>
  <div v-if="visible" class="risk-result-panel">
    <div class="panel-header" @click="collapsed = !collapsed">
      <span class="header-title">查询结果</span>
      <svg
        :class="['header-toggle', { collapsed: collapsed }]"
        viewBox="0 0 1024 1024"
        width="14"
        height="14"
        fill="currentColor"
      >
        <path d="M715.8 493.5L335 165.1c-14.2-12.3-35-12.3-49.2 0l-40.2 34.5c-14.2 12.3-14.2 32.1 0 44.4l355.6 308.1c14.2 12.3 35 12.3 49.2 0l355.6-308.1c14.2-12.3 14.2-32.1 0-44.4l-40.2-34.5c-14.2-12.3-35-12.3-49.2 0z"/>
      </svg>
    </div>

    <div class="panel-body" v-show="!collapsed">
      <div class="section-title">风险评级</div>
      <div class="section-divider"></div>

      <!-- 各灾害类型列表 -->
      <div class="assessments-list">
        <div
          v-for="item in data?.assessments"
          :key="item.disasterType"
          class="assessment-item"
        >
          <div class="item-header" @click="toggleExpand(item.disasterType)">
            <span class="item-indicator" :style="{ background: getLevelColor(item.riskLevel) }"></span>
            <span class="item-name">{{ item.disasterTypeName }}</span>
            <span class="item-level" :style="{ color: getLevelColor(item.riskLevel) }">{{ item.riskLevelName }}</span>
            <span class="item-score">{{ item.riskScore?.toFixed(1) }}</span>
            <svg :class="['item-arrow', { expanded: expandedTypes.has(item.disasterType) }]" viewBox="0 0 1024 1024" width="12" height="12" fill="currentColor">
              <path d="M715.8 493.5L335 165.1c-14.2-12.3-35-12.3-49.2 0l-40.2 34.5c-14.2 12.3-14.2 32.1 0 44.4l355.6 308.1c14.2 12.3 35 12.3 49.2 0l355.6-308.1c14.2-12.3 14.2-32.1 0-44.4l-40.2-34.5c-14.2-12.3-35-12.3-49.2 0z"/>
            </svg>
          </div>

          <!-- 因子详情 -->
          <div v-if="expandedTypes.has(item.disasterType) && item.factors" class="item-factors">
            <div v-for="(detail, name) in item.factors" :key="name" class="factor-row">
              <span class="factor-name">{{ name }}</span>
              <span class="factor-weight">权重 {{ (detail.weight * 100).toFixed(0) }}%</span>
              <span class="factor-score">{{ detail.score?.toFixed(1) }}</span>
            </div>
          </div>

          <!-- 面积分布 -->
          <div v-if="expandedTypes.has(item.disasterType) && item.areaDistribution" class="area-distribution">
            <div v-for="(ratio, level) in item.areaDistribution" :key="level" class="dist-bar-wrapper">
              <span class="dist-label">{{ getLevelLabel(level) }}</span>
              <div class="dist-bar">
                <div class="dist-bar-fill" :style="{ width: (ratio * 100) + '%', background: getLevelColor(level) }"></div>
              </div>
              <span class="dist-pct">{{ (ratio * 100).toFixed(1) }}%</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 周边标的统计 -->
      <div v-if="policyStats" class="policy-stats-section">
        <div class="stats-table-header">
          <span class="col-name">周边标的</span>
          <span class="col-count">标的数量</span>
          <span class="col-amount">保额(万元)</span>
          <span class="col-amount">保费(万元)</span>
        </div>
        <div
          v-for="cat in policyStats.categories"
          :key="cat.typeName"
          class="stats-table-row"
        >
          <span class="col-name">{{ cat.typeName }}</span>
          <span class="col-count">{{ cat.targetCount }}</span>
          <span class="col-amount">{{ formatToWan(cat.coverageAmount) }}</span>
          <span class="col-amount">{{ formatToWan(cat.premium) }}</span>
        </div>
        <div class="stats-table-row total-row">
          <span class="col-name">合计</span>
          <span class="col-count">{{ policyStats.targetCount }}</span>
          <span class="col-amount">{{ formatToWan(policyStats.coverageAmount) }}</span>
          <span class="col-amount">{{ formatToWan(policyStats.premium) }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { RiskAssessResponse } from '@/services/riskAssess'
import type { PolicyStats } from '@/services/insuranceService'

const props = defineProps<{
  visible: boolean
  data: RiskAssessResponse | null
  policyStats?: PolicyStats | null
}>()

defineEmits<{
  (e: 'close'): void
}>()

const collapsed = ref(false)
const expandedTypes = ref(new Set<string>())

function toggleExpand(type: string) {
  if (expandedTypes.value.has(type)) {
    expandedTypes.value.delete(type)
  } else {
    expandedTypes.value.add(type)
  }
}

const LEVEL_COLORS: Record<string, string> = {
  LOW: '#4CAF50',
  MEDIUM: '#FFC107',
  HIGH: '#FF5722',
  VERY_HIGH: '#F44336',
}

const LEVEL_LABELS: Record<string, string> = {
  LOW: '低风险',
  MEDIUM: '中风险',
  HIGH: '高风险',
  VERY_HIGH: '极高风险',
}

function getLevelColor(level: string): string {
  return LEVEL_COLORS[level] || '#909399'
}

function getLevelLabel(level: string): string {
  return LEVEL_LABELS[level] || level
}

function formatToWan(amount: number): string {
  return (amount / 10000).toFixed(2)
}


</script>

<style lang="scss" scoped>
.risk-result-panel {
  position: absolute;
  top: 10px;
  right: 10px;
  width: 360px;
  max-height: calc(100% - 20px);
  background: rgba(255, 255, 255, 0.96);
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  display: flex;
  flex-direction: column;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  border-bottom: 1px solid #ebeef5;
  cursor: pointer;
  user-select: none;
  transition: background 0.2s;

  &:hover {
    background: #f5f7fa;
  }

  .header-title {
    font-size: 14px;
    font-weight: 600;
    color: #303133;
  }

  .header-toggle {
    color: #909399;
    cursor: pointer;
    transition: transform 0.2s;

    &:hover {
      color: #303133;
    }

    transform: rotate(180deg);

    &.collapsed {
      transform: rotate(0deg);
    }
  }
}

.panel-body {
  overflow-y: auto;
  padding: 12px;
}

.section-title {
  font-size: 13px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 6px;
}

.section-divider {
  height: 1px;
  background: #ebeef5;
  margin-bottom: 12px;
}

.assessments-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.assessment-item {
  border: 1px solid #ebeef5;
  border-radius: 6px;
  overflow: hidden;

  .item-header {
    display: flex;
    align-items: center;
    padding: 8px 10px;
    cursor: pointer;
    transition: background 0.15s;

    &:hover {
      background: #f5f7fa;
    }
  }

  .item-indicator {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    margin-right: 8px;
    flex-shrink: 0;
  }

  .item-name {
    flex: 1;
    font-size: 13px;
    color: #303133;
  }

  .item-level {
    font-size: 12px;
    margin-right: 8px;
  }

  .item-score {
    font-size: 13px;
    font-weight: 600;
    color: #303133;
    margin-right: 6px;
  }

  .item-arrow {
    color: #c0c4cc;
    transition: transform 0.2s;

    &.expanded {
      transform: rotate(180deg);
    }
  }
}

.item-factors {
  padding: 8px 10px;
  background: #f9fafb;
  border-top: 1px solid #ebeef5;

  .factor-row {
    display: flex;
    align-items: center;
    padding: 3px 0;
    font-size: 12px;

    .factor-name {
      flex: 1;
      color: #606266;
    }

    .factor-weight {
      color: #909399;
      margin-right: 10px;
    }

    .factor-score {
      color: #303133;
      font-weight: 500;
      width: 40px;
      text-align: right;
    }
  }
}

.area-distribution {
  padding: 8px 10px;
  background: #f9fafb;
  border-top: 1px solid #ebeef5;

  .dist-bar-wrapper {
    display: flex;
    align-items: center;
    padding: 3px 0;
    font-size: 12px;

    .dist-label {
      width: 50px;
      color: #606266;
      flex-shrink: 0;
    }

    .dist-bar {
      flex: 1;
      height: 12px;
      background: #ebeef5;
      border-radius: 6px;
      overflow: hidden;
      margin: 0 8px;
    }

    .dist-bar-fill {
      height: 100%;
      border-radius: 6px;
      transition: width 0.3s;
    }

    .dist-pct {
      width: 45px;
      text-align: right;
      color: #606266;
    }
  }
}

.policy-stats-section {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #ebeef5;

  .stats-table-header,
  .stats-table-row {
    display: flex;
    align-items: center;
    padding: 6px 0;
    font-size: 13px;

    .col-name {
      flex: 1;
      color: #606266;
    }

    .col-count {
      width: 60px;
      text-align: right;
      margin-right: 8px;
    }

    .col-amount {
      width: 80px;
      text-align: right;
      color: #303133;
    }
  }

  .stats-table-header {
    font-size: 12px;
    color: #909399;

    .col-count,
    .col-amount {
      color: #909399;
    }
  }

  .stats-table-row {
    color: #303133;

    .col-name {
      color: #303133;
    }
  }

  .total-row {
    margin-top: 4px;
    padding-top: 6px;
    border-top: 1px solid #ebeef5;
    font-weight: 600;
  }
}
</style>
