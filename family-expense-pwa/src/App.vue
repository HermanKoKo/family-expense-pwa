<script setup>
import { onMounted } from 'vue';
import { useFinanceStore } from './stores/useFinanceStore';
import { RouterView, RouterLink, useRoute } from 'vue-router';
import { PencilSquareIcon, ChartPieIcon, ListBulletIcon, Cog6ToothIcon } from '@heroicons/vue/24/outline';
import { PencilSquareIcon as PencilSolid, ChartPieIcon as ChartSolid, ListBulletIcon as ListSolid, Cog6ToothIcon as CogSolid } from '@heroicons/vue/24/solid';

const store = useFinanceStore();
const route = useRoute(); // 取得目前在哪一頁

onMounted(() => {
  store.init(); // App 啟動時一樣要初始化資料庫
});

// 判斷目前是否在該頁面 (用來切換圖示實心/空心)
const isActive = (name) => route.name === name;
</script>

<template>
  <div class="min-h-screen bg-slate-50 font-sans pb-16">
    
    <!-- 主要內容區 (根據網址變換) -->
    <RouterView />

    <!-- 底部導航列 (固定在下方) -->
    <nav v-if="store.isAuthenticated" class="fixed bottom-0 w-full max-w-md left-0 right-0 mx-auto bg-white/60 backdrop-blur-xl border-t border-white/20 shadow-[0_-4px_30px_rgba(0,0,0,0.03)] pb-safe z-50">
      <div class="flex justify-around items-center h-20 px-4">

        <!-- 1. 記帳 (Editor) -->
        <RouterLink to="/" class="flex flex-col items-center justify-center w-full h-full">
          <component
            :is="isActive('editor') ? PencilSolid : PencilSquareIcon"
            class="w-7 h-7"
            :class="isActive('editor') ? 'text-blue-600 scale-110' : 'text-slate-400'"
          />
        </RouterLink>

        <!-- 2. 統計 (Dashboard) -->
        <RouterLink to="/stats" class="flex flex-col items-center justify-center w-full h-full">
          <component
            :is="isActive('dashboard') ? ChartSolid : ChartPieIcon"
            class="w-7 h-7"
            :class="isActive('dashboard') ? 'text-blue-600 scale-110' : 'text-slate-400'"
          />
        </RouterLink>

        <!-- 3. 明細 (History) -->
        <RouterLink to="/history" class="flex flex-col items-center justify-center w-full h-full">
          <component
            :is="isActive('history') ? ListSolid : ListBulletIcon"
            class="w-7 h-7"
            :class="isActive('history') ? 'text-blue-600 scale-110' : 'text-slate-400'"
          />
        </RouterLink>

        <!-- 4. 設定 (Settings) -->
        <RouterLink to="/settings" class="flex flex-col items-center justify-center w-full h-full">
          <component
            :is="isActive('settings') ? CogSolid : Cog6ToothIcon"
            class="w-7 h-7"
            :class="isActive('settings') ? 'text-blue-600 scale-110' : 'text-slate-400'"
          />
        </RouterLink>

      </div>
    </nav>
  </div>
</template>

<style>
/* 為了讓 iPhone 底部橫條不要擋住內容 */
.pb-safe {
  padding-bottom: env(safe-area-inset-bottom);
}
</style>
