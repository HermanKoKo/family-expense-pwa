import { createRouter, createWebHistory } from 'vue-router';
import { useFinanceStore } from '../stores/useFinanceStore';
import Editor from '../views/Editor.vue';
import Dashboard from '../views/Dashboard.vue';
import History from '../views/History.vue';
import Settings from '../views/Settings.vue';
import Onboarding from '../views/Onboarding.vue';
import RecurringSettings from '../views/RecurringSettings.vue';

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/onboarding', name: 'onboarding', component: Onboarding },
    { path: '/', name: 'editor', component: Editor },
    { path: '/stats', name: 'dashboard', component: Dashboard },
    { path: '/history', name: 'history', component: History },
    { path: '/settings', name: 'settings', component: Settings },
    { path: '/recurring-settings', name: 'recurring-settings', component: RecurringSettings }
  ]
});

// Magic Link 處理邏輯
router.beforeEach((to, from, next) => {
  const store = useFinanceStore();
  const { api, token } = to.query;

  if (api && token) {
    console.log('偵測到 Magic Link，正在設定 API...');
    store.setAuth(api, token);
    return next({ path: to.path, query: {} });
  }

  // 檢查是否已驗證，沒驗證只能去 onboarding
  if (!store.isAuthenticated && to.name !== 'onboarding') {
    return next({ name: 'onboarding' });
  }

  // 如果已驗證但還在 onboarding，跳回首頁
  if (store.isAuthenticated && to.name === 'onboarding') {
    return next({ name: 'editor' });
  }

  next();
});

export default router;
