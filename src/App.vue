<template>
  <div class="app-wrapper">
    <!-- 登录页面：不显示侧边栏 -->
    <template v-if="isLoginPage">
      <router-view />
    </template>

    <!-- 其他页面：显示侧边栏和主内容 -->
    <template v-else>
      <el-container class="app-container">
        <el-aside width="64px" class="app-sidebar">
          <Sidebar />
        </el-aside>
        <el-main class="app-main">
          <router-view />
        </el-main>
      </el-container>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import Sidebar from '@/components/Common/Sidebar.vue'

const route = useRoute()

// 判断是否是登录页面
const isLoginPage = computed(() => {
  return route.path === '/login'
})
</script>

<style lang="scss">
.app-wrapper {
  width: 100%;
  height: 100vh;
}

.app-container {
  height: 100vh;
}

.app-sidebar {
  background-color: #304156;
  color: white;
  overflow: hidden;
}

.app-main {
  background-color: #f5f7fa;
  padding: 20px;
}
</style>
