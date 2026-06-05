<template>
  <div v-if="loading" class="loading-overlay">
    <div class="loading-spinner">
      <el-icon class="is-loading" :size="40">
        <Loading />
      </el-icon>
      <p class="loading-text">{{ text }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Loading } from '@element-plus/icons-vue'

interface Props {
  loading?: boolean
  text?: string
}

withDefaults(defineProps<Props>(), {
  loading: false,
  text: '加载中...',
})
</script>

<style lang="scss" scoped>
.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(255, 255, 255, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
}

.loading-spinner {
  text-align: center;
}

.loading-text {
  margin-top: 10px;
  color: #666;
  font-size: 14px;
}
</style>
