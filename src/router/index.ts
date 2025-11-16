import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import HomeView from '@/views/HomeView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    // 公開頁面
    {
      path: '/',
      name: 'home',
      component: HomeView,
      meta: { requiresAuth: false }
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/LoginView.vue'),
      meta: { requiresAuth: false }
    },
    {
      path: '/register',
      name: 'register',
      component: () => import('@/views/RegisterView.vue'),
      meta: { requiresAuth: false }
    },

    // 內部頁面（需要認證）
    {
      path: '/app',
      component: () => import('@/views/AppLayout.vue'),
      meta: { requiresAuth: true },
      children: [
        {
          path: '',
          redirect: '/app/dashboard'
        },
        {
          path: 'dashboard',
          name: 'dashboard',
          component: () => import('@/views/DashboardView.vue'),
          meta: { requiresAuth: true }
        },
        {
          path: 'decks',
          name: 'decks',
          component: () => import('@/views/DeckListView.vue'),
          meta: { requiresAuth: true }
        },
        {
          path: 'decks/:deckId',
          name: 'deck-detail',
          component: () => import('@/views/DeckDetailView.vue'),
          meta: { requiresAuth: true }
        },
        {
          path: 'study/:deckId',
          name: 'study',
          component: () => import('@/views/StudyView.vue'),
          meta: { requiresAuth: true }
        },
        {
          path: 'cards',
          name: 'cards',
          component: () => import('@/views/CardListView.vue'),
          meta: { requiresAuth: true }
        },
        {
          path: 'statistics',
          name: 'statistics',
          component: () => import('@/views/StatisticsView.vue'),
          meta: { requiresAuth: true }
        },
        {
          path: 'settings',
          name: 'settings',
          component: () => import('@/views/SettingsView.vue'),
          meta: { requiresAuth: true }
        }
      ]
    },

    // 404 頁面
    {
      path: '/:pathMatch(.*)*',
      redirect: '/'
    }
  ]
})

// 路由守衛
router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()
  const requiresAuth = to.meta.requiresAuth

  if (requiresAuth && !authStore.isAuthenticated) {
    // 需要認證但未登入，重定向到登入頁
    next('/login')
  } else if (!requiresAuth && authStore.isAuthenticated && (to.path === '/login' || to.path === '/register')) {
    // 已登入但訪問登入/註冊頁，重定向到儀表板
    next('/app/dashboard')
  } else {
    next()
  }
})

export default router
