<template>
  <div class="typhoon-policy-query">
    <div class="query-header">
      <span class="query-label">查询保单</span>
      <el-switch v-model="enabled" size="small" />
    </div>

    <div v-if="enabled" class="query-form">
      <!-- 缓冲区范围 -->
      <div class="form-item">
        <span class="form-label">缓冲区范围</span>
        <div class="slider-wrapper">
          <el-slider
            v-model="bufferRadius"
            :min="10"
            :max="100"
            :step="10"
            show-stops
            :marks="sliderMarks"
          />
          <span class="slider-value">{{ bufferRadius }} km</span>
        </div>
      </div>

      <!-- 保单截止日期 -->
      <div class="form-item">
        <span class="form-label">保单截止日期</span>
        <el-date-picker
          v-model="endDate"
          type="date"
          placeholder="选择截止日期"
          value-format="YYYY-MM-DD"
          size="small"
          style="width: 100%"
        />
      </div>

      <!-- 保单归属机构 -->
      <div class="form-item">
        <span class="form-label">保单归属机构</span>
        <el-cascader
          v-model="selectedOrg"
          :options="orgOptions"
          :props="orgCascaderProps"
          placeholder="选择机构"
          size="small"
          collapse-tags
          collapse-tags-tooltip
          :max-collapse-tags="1"
          clearable
          style="width: 100%"
        />
      </div>

      <!-- 险种险类 -->
      <div class="form-item">
        <span class="form-label">险种险类</span>
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
          style="width: 100%"
        />
      </div>

      <!-- 按钮 -->
      <div class="form-btns">
        <el-button size="small" @click="resetAll">重置</el-button>
        <el-button type="primary" size="small" :loading="querying" @click="handleQuery">查询</el-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { organizationService, type OrganizationType } from '@/services/organizationService'
import { insuranceService, type TyphoonPolicyStatsResponse } from '@/services/insuranceService'

const props = defineProps<{
  getTyphoonData: () => Array<{ tfid: string; name: string; enName: string; points: Array<{ lng: string; lat: string }> }>
}>()

const emit = defineEmits<{
  (e: 'query-result', data: TyphoonPolicyStatsResponse): void
  (e: 'query-start'): void
  (e: 'query-end'): void
  (e: 'buffer-data', data: { typhoons: Array<{ tfid: string; points: Array<{ lng: number; lat: number }> }>, radius: number }): void
}>()

const enabled = ref(false)
const bufferRadius = ref(50)
const endDate = ref<string>(getTodayDate())
const querying = ref(false)

const sliderMarks: Record<number, string> = {
  10: '10',
  50: '50',
  100: '100'
}

// Organization
const orgOptions = ref<OrganizationType[]>([])
const selectedOrg = ref<string[][]>([])
const orgCascaderProps = { multiple: true }

// Insurance
const insuranceOptions = ref<any[]>([])
const selectedInsurance = ref<string[][]>([])
const cascaderProps = { multiple: true }

function getTodayDate(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

async function loadOrgTree() {
  try {
    const tree = await organizationService.getTree()
    orgOptions.value = [
      {
        value: 'all',
        label: '全部',
        children: tree,
      },
    ]
    resetOrgSelection()
  } catch {
    orgOptions.value = []
    selectedOrg.value = []
  }
}

function resetOrgSelection() {
  const paths: string[][] = []
  if (orgOptions.value.length > 0) {
    const root = orgOptions.value[0]
    if (root.children) {
      for (const province of root.children) {
        if (province.children) {
          for (const city of province.children) {
            paths.push(['all', province.value, city.value])
          }
        } else {
          paths.push(['all', province.value])
        }
      }
    }
  }
  selectedOrg.value = paths
}

async function loadInsuranceTree() {
  try {
    const tree = await insuranceService.getTree()
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

function resetAll() {
  bufferRadius.value = 50
  endDate.value = getTodayDate()
  resetOrgSelection()
  resetInsuranceSelection()
}

async function handleQuery() {
  const typhoonData = props.getTyphoonData()
  if (!typhoonData || typhoonData.length === 0) {
    ElMessage.warning('请先选择台风')
    return
  }

  // Extract selected org codes (last level of each path)
  const orgCodes: string[] = []
  for (const path of selectedOrg.value) {
    if (path.length >= 2) {
      const orgCode = path[path.length - 1]
      if (!orgCodes.includes(orgCode)) {
        orgCodes.push(orgCode)
      }
    }
  }

  // Extract insurance codes
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
  emit('query-start')

  // Emit buffer data for drawing on map
  emit('buffer-data', {
    typhoons: typhoonData.map(t => ({
      tfid: t.tfid,
      points: t.points.map(p => ({
        lng: parseFloat(p.lng),
        lat: parseFloat(p.lat)
      }))
    })),
    radius: bufferRadius.value
  })

  try {
    const result = await insuranceService.queryByTyphoon({
      typhoons: typhoonData.map(t => ({
        tfid: t.tfid,
        typhoonName: `${t.name} ${t.enName}`,
        points: t.points.map(p => ({
          lng: parseFloat(p.lng),
          lat: parseFloat(p.lat)
        }))
      })),
      bufferRadius: bufferRadius.value,
      endDate: endDate.value || undefined,
      orgCodes: orgCodes.length > 0 ? orgCodes : undefined,
      categoryCodes: categoryCodes.length > 0 ? categoryCodes : undefined,
      typeCodes: typeCodes.length > 0 ? typeCodes : undefined,
    })

    emit('query-result', result)

    if (result.policyGroups.length === 0) {
      ElMessage.info('未查询到保单数据')
    }
  } catch (error) {
    ElMessage.error('查询失败')
  } finally {
    querying.value = false
    emit('query-end')
  }
}

onMounted(() => {
  loadOrgTree()
  loadInsuranceTree()
})
</script>

<style lang="scss" scoped>
.typhoon-policy-query {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #ebeef5;
}

.query-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;

  .query-label {
    font-size: 13px;
    color: #303133;
    font-weight: 500;
  }
}

.query-form {
  .form-item {
    margin-bottom: 10px;

    .form-label {
      display: block;
      font-size: 12px;
      color: #909399;
      margin-bottom: 4px;
    }
  }

  .slider-wrapper {
    display: flex;
    align-items: center;
    gap: 10px;

    :deep(.el-slider) {
      flex: 1;
    }

    .slider-value {
      font-size: 13px;
      color: #303133;
      font-weight: 500;
      min-width: 50px;
      text-align: right;
    }
  }

  .form-btns {
    display: flex;
    gap: 8px;
    margin-top: 12px;

    :deep(.el-button) {
      flex: 1;
    }
  }
}
</style>
