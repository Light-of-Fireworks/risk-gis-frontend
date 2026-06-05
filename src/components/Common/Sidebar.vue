<template>
  <div class="sidebar-container">
    <div class="menu-list">
      <el-tooltip
        v-for="item in menuItems"
        :key="item.path"
        :content="item.name"
        placement="right"
        :show-after="300"
      >
        <div
          class="menu-item"
          :class="{ active: currentRoute === item.path }"
          @click="navigateTo(item.path)"
        >
          <el-icon :size="20"><component :is="item.icon" /></el-icon>
        </div>
      </el-tooltip>
    </div>

    <div class="menu-bottom">
      <el-tooltip content="退出登录" placement="right" :show-after="300">
        <div class="menu-item logout" @click="handleLogout">
          <el-icon :size="20"><SwitchButton /></el-icon>
        </div>
      </el-tooltip>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  DataBoard,
  MapLocation,
  AlarmClock,
  SwitchButton,
} from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'

const route = useRoute()
const router = useRouter()
const currentRoute = computed(() => route.path)

const menuItems = [
  { path: '/dashboard', name: '仪表盘', icon: DataBoard },
  { path: '/gis', name: 'GIS分析', icon: MapLocation },
  { path: '/disaster', name: '灾害预警', icon: AlarmClock },
]

function navigateTo(path: string) {
  router.push(path)
}

function handleLogout() {
  ElMessageBox.confirm('确定要退出登录吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  })
    .then(() => {
      localStorage.removeItem('token')
      localStorage.removeItem('username')
      localStorage.removeItem('roles')
      ElMessage.success('已退出登录')
      router.push('/login')
    })
    .catch(() => {})
}
</script>

<style lang="scss" scoped>
.sidebar-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  background-color: #304156;
}

.menu-list {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding-top: 10px;
}

.menu-item {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 56px;
  cursor: pointer;
  color: #bfcbd9;
  transition: all 0.3s;

  &:hover {
    background-color: #263445;
    color: #409eff;
  }

  &.active {
    background-color: #409eff;
    color: #fff;
  }

  &.logout {
    &:hover {
      background-color: #f56c6c;
      color: #fff;
    }
  }
}

.menu-bottom {
  padding-bottom: 10px;
}
</style>
