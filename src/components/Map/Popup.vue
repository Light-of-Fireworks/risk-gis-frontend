<template>
  <div v-if="visible" class="popup" :style="popupStyle">
    <div class="popup-header">
      <span class="popup-title">{{ title }}</span>
      <el-button type="primary" link @click="close">
        <el-icon><Close /></el-icon>
      </el-button>
    </div>
    <div class="popup-content">
      <slot>{{ content }}</slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Close } from '@element-plus/icons-vue'

interface Props {
  visible?: boolean
  title?: string
  content?: string
  position?: { x: number; y: number }
}

const props = withDefaults(defineProps<Props>(), {
  visible: false,
  title: '',
  content: '',
  position: () => ({ x: 0, y: 0 }),
})

const emit = defineEmits(['close'])

const popupStyle = computed(() => ({
  left: `${props.position.x}px`,
  top: `${props.position.y}px`,
}))

function close() {
  emit('close')
}
</script>

<style lang="scss" scoped>
.popup {
  position: absolute;
  background-color: white;
  border-radius: 4px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  z-index: 1000;
  min-width: 200px;
  max-width: 300px;
}

.popup-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  border-bottom: 1px solid #eee;
}

.popup-title {
  font-weight: bold;
  font-size: 14px;
}

.popup-content {
  padding: 12px;
  font-size: 12px;
  color: #666;
}
</style>
