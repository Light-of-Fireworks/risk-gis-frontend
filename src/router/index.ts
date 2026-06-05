import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'Login',
      component: () => import('@/views/Login/index.vue'),
      meta: { title: '登录', requiresAuth: false },
    },
    {
      path: '/',
      redirect: '/dashboard',
    },
    {
      path: '/dashboard',
      name: 'Dashboard',
      component: () => import('@/views/Dashboard/index.vue'),
      meta: { title: '仪表盘', requiresAuth: true },
    },
    {
      path: '/gis',
      name: 'GIS',
      component: () => import('@/views/GIS/index.vue'),
      meta: { title: 'GIS分析', requiresAuth: true },
    },
    {
      path: '/disaster',
      name: 'Disaster',
      component: () => import('@/views/Disaster/index.vue'),
      meta: { title: '灾害预警', requiresAuth: true },
    },
  ],
})

// 路由守卫
router.beforeEach((to, _from, next) => {
  // 设置页面标题
  if (to.meta.title) {
    document.title = `${to.meta.title} - 风险地理信息系统`
  }

  // 检查是否需要认证
  const requiresAuth = to.meta.requiresAuth !== false
  const token = localStorage.getItem('token')

  if (requiresAuth && !token) {
    // 需要认证但没有 token，跳转到登录页
    next('/login')
  } else if (to.path === '/login' && token) {
    // 已登录但访问登录页，跳转到首页
    next('/dashboard')
  } else {
    next()
  }
})

export default router
