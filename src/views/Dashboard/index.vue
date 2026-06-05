<template>
  <div class="dashboard-container">
    <el-row :gutter="20">
      <el-col :span="8">
        <el-card class="stat-card">
          <template #header>
            <div class="card-header">
              <span>承保标的数量</span>
              <el-tag type="success">正常</el-tag>
            </div>
          </template>
          <div class="stat-value">{{ stats.insuranceTargets }}</div>
          <div class="stat-label">个</div>
        </el-card>
      </el-col>

      <el-col :span="8">
        <el-card class="stat-card">
          <template #header>
            <div class="card-header">
              <span>高风险区域</span>
              <el-tag type="danger">警告</el-tag>
            </div>
          </template>
          <div class="stat-value">{{ stats.highRiskAreas }}</div>
          <div class="stat-label">个</div>
        </el-card>
      </el-col>

      <el-col :span="8">
        <el-card class="stat-card">
          <template #header>
            <div class="card-header">
              <span>本月灾害预警</span>
              <el-tag type="warning">注意</el-tag>
            </div>
          </template>
          <div class="stat-value">{{ stats.monthlyWarnings }}</div>
          <div class="stat-label">次</div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" class="chart-row">
      <el-col :span="12">
        <el-card>
          <template #header>
            <span>灾害类型分布</span>
          </template>
          <div class="chart-container">
            <p>灾害类型分布图表</p>
          </div>
        </el-card>
      </el-col>

      <el-col :span="12">
        <el-card>
          <template #header>
            <span>风险等级分布</span>
          </template>
          <div class="chart-container">
            <p>风险等级分布图表</p>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" class="map-row">
      <el-col :span="24">
        <el-card>
          <template #header>
            <span>全国风险概览</span>
          </template>
          <div class="map-container">
            <MapContainer />
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import MapContainer from '@/components/Map/MapContainer.vue'
import api from '@/services/api'

const stats = ref({
  insuranceTargets: 0,
  highRiskAreas: 0,
  monthlyWarnings: 0,
})

onMounted(async () => {
  try {
    const res = await api.get('/dashboard/stats')
    const data = res.data
    stats.value.insuranceTargets = data.insuranceTargets ?? 0
    stats.value.highRiskAreas = data.highRiskAreas ?? 0
    stats.value.monthlyWarnings = data.monthlyWarnings ?? 0
  } catch {
    // 使用默认值
  }
})
</script>

<style lang="scss" scoped>
.dashboard-container {
  padding: 20px;
}

.stat-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.stat-value {
  font-size: 32px;
  font-weight: bold;
  color: #409eff;
  text-align: center;
  margin: 10px 0;
}

.stat-label {
  text-align: center;
  color: #909399;
  font-size: 14px;
}

.chart-row {
  margin-bottom: 20px;
}

.chart-container {
  height: 300px;
  display: flex;
  justify-content: center;
  align-items: center;
  color: #909399;
}

.map-row {
  margin-bottom: 20px;
}

.map-container {
  height: 500px;
}
</style>
