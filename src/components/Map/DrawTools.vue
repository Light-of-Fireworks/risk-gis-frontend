<template>
  <div class="measure-tools">
    <div class="tools-panel">
      <el-tooltip content="测量工具" placement="right" :show-after="300">
        <div
          class="tool-item"
          :class="{ active: showMeasureOptions }"
          @click="toggleMeasureOptions"
        >
          <svg viewBox="0 0 1024 1024" width="18" height="18" fill="currentColor">
            <path d="M128 384h768v64H128zM128 576h768v64H128zM128 768h768v64H128zM192 192v192h64V192zM384 192v192h64V192zM576 192v192h64V192zM768 192v192h64V192z"/>
          </svg>
        </div>
      </el-tooltip>

      <div v-show="showMeasureOptions" class="measure-options">
        <div
          v-for="option in measureOptions"
          :key="option.type"
          class="option-item"
          :class="{ active: activeMeasure === option.type }"
          @click="setMeasureType(option.type)"
        >
          <span>{{ option.name }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const emit = defineEmits<{
  (e: 'measure-change', type: string): void
  (e: 'clear'): void
}>()

const showMeasureOptions = ref(false)
const activeMeasure = ref('')

const measureOptions = [
  { type: 'distance', name: '测距离' },
  { type: 'area', name: '测面积' },
  { type: 'height', name: '测高度' },
]

function toggleMeasureOptions() {
  showMeasureOptions.value = !showMeasureOptions.value
  if (!showMeasureOptions.value) {
    activeMeasure.value = ''
    emit('clear')
  }
}

function setMeasureType(type: string) {
  if (activeMeasure.value === type) {
    activeMeasure.value = ''
    emit('clear')
  } else {
    activeMeasure.value = type
    emit('measure-change', type)
  }
}
</script>

<style lang="scss" scoped>
.measure-tools {
  .tools-panel {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 2px;
    position: relative;
  }

  .tool-item {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border-radius: 4px;
    cursor: pointer;
    color: #606266;
    background: rgba(255, 255, 255, 0.95);
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
    transition: all 0.2s;

    &:hover {
      background-color: #ecf5ff;
      color: #409eff;
    }

    &.active {
      background-color: #409eff;
      color: #fff;
    }
  }

  .measure-options {
    display: flex;
    flex-direction: column;
    background: rgba(255, 255, 255, 0.95);
    border-radius: 6px;
    padding: 4px;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
    position: absolute;
    left: 100%;
    bottom: 0;
    margin-left: 4px;

    .option-item {
      padding: 6px 12px;
      font-size: 13px;
      color: #606266;
      cursor: pointer;
      border-radius: 4px;
      white-space: nowrap;
      transition: all 0.2s;

      &:hover {
        background-color: #ecf5ff;
        color: #409eff;
      }

      &.active {
        background-color: #409eff;
        color: #fff;
      }
    }
  }
}
</style>
