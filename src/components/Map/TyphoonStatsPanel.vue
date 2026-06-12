<template>
  <div v-if="visible" class="typhoon-stats-panel" :class="{ collapsed: !expanded }">
    <div class="panel-header" @click="expanded = !expanded">
      <span class="panel-title">查询结果</span>
      <el-icon class="toggle-icon">
        <ArrowUp v-if="expanded" />
        <ArrowDown v-else />
      </el-icon>
    </div>

    <div v-show="expanded" class="panel-body">
      <!-- 表头 -->
      <div class="stats-table-header">
        <span class="col-name">台风名称</span>
        <span class="col-count">标的数量</span>
        <span class="col-amount">保额(万元)</span>
        <span class="col-amount">保费(万元)</span>
      </div>

      <!-- 数据行 -->
      <div
        v-for="item in data?.typhoons"
        :key="item.tfid"
        class="stats-table-row"
      >
        <span class="col-name">{{ item.typhoonName }}</span>
        <span class="col-count">{{ item.targetCount }}</span>
        <span class="col-amount">{{ formatToWan(item.coverageAmount) }}</span>
        <span class="col-amount">{{ formatToWan(item.premium) }}</span>
      </div>

      <!-- 合计行 -->
      <div v-if="data?.total" class="stats-table-row total-row">
        <span class="col-name">合计</span>
        <span class="col-count">{{ data.total.targetCount }}</span>
        <span class="col-amount">{{ formatToWan(data.total.coverageAmount) }}</span>
        <span class="col-amount">{{ formatToWan(data.total.premium) }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { ArrowUp, ArrowDown } from '@element-plus/icons-vue'
import type { TyphoonPolicyStatsResponse } from '@/services/insuranceService'

defineProps<{
  visible: boolean
  data: TyphoonPolicyStatsResponse | null
}>()

const expanded = ref(true)

function formatToWan(amount: number): string {
  return (amount / 10000).toFixed(2)
}
</script>

<style lang="scss" scoped>
.typhoon-stats-panel {
  position: absolute;
  top: 20px;
  right: 20px;
  width: 400px;
  max-height: 500px;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  display: flex;
  flex-direction: column;
  backdrop-filter: blur(8px);
  overflow: hidden;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  cursor: pointer;
  border-bottom: 1px solid #ebeef5;
  flex-shrink: 0;

  &:hover {
    background: #f5f7fa;
  }

  .panel-title {
    font-size: 14px;
    font-weight: 600;
    color: #303133;
  }

  .toggle-icon {
    color: #909399;
    font-size: 14px;
  }
}

.panel-body {
  overflow-y: auto;
  max-height: 440px;
  padding: 0;
}

.stats-table-header {
  display: flex;
  align-items: center;
  padding: 10px 16px;
  background: #f5f7fa;
  border-bottom: 1px solid #ebeef5;
  font-size: 13px;
  font-weight: 600;
  color: #909399;
}

.stats-table-row {
  display: flex;
  align-items: center;
  padding: 10px 16px;
  border-bottom: 1px solid #f0f2f5;
  font-size: 13px;
  color: #303133;

  &:last-child {
    border-bottom: none;
  }

  &.total-row {
    background: #ecf5ff;
    font-weight: 600;
    color: #409eff;
    border-top: 2px solid #409eff;
  }
}

.col-name {
  flex: 2;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.col-count {
  flex: 1;
  text-align: center;
}

.col-amount {
  flex: 1.2;
  text-align: right;
}
</style>
