import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useRiskStore = defineStore('risk', () => {
  const riskData = ref<any[]>([])
  const selectedRiskType = ref('earthquake')

  const riskLevels = ref([
    { level: 'high', label: '高风险', color: '#f56c6c' },
    { level: 'medium', label: '中风险', color: '#e6a23c' },
    { level: 'low', label: '低风险', color: '#67c23a' },
  ])

  const disasterTypes = ref([
    { type: 'earthquake', label: '地震' },
    { type: 'flood', label: '洪水' },
    { type: 'typhoon', label: '台风' },
    { type: 'landslide', label: '滑坡' },
    { type: 'mudflow', label: '泥石流' },
    { type: 'drought', label: '干旱' },
    { type: 'hail', label: '冰雹' },
    { type: 'snowstorm', label: '暴雪' },
    { type: 'forest_fire', label: '森林火灾' },
  ])

  function setRiskData(data: any[]) {
    riskData.value = data
  }

  function setSelectedRiskType(type: string) {
    selectedRiskType.value = type
  }

  return {
    riskData,
    selectedRiskType,
    riskLevels,
    disasterTypes,
    setRiskData,
    setSelectedRiskType,
  }
})
