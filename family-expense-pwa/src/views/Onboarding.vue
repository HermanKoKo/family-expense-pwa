<script setup>
import { useFinanceStore } from '../stores/useFinanceStore';
import { LockClosedIcon, LinkIcon, SparklesIcon } from '@heroicons/vue/24/outline';

const store = useFinanceStore();
</script>

<template>
  <div class="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
    <div class="mb-12">
      <div class="w-20 h-20 bg-brand-100 rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-premium">
        <SparklesIcon class="w-10 h-10 text-brand-600" />
      </div>
      <h1 class="text-3xl font-bold text-slate-900 mb-2">FamilyExpense</h1>
      <p class="text-slate-500 font-medium italic">專屬於柯與心儀的精品記帳</p>
    </div>

    <div class="glass-card p-8 w-full max-w-sm">
      <div class="mb-8">
        <div class="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <LockClosedIcon class="w-6 h-6 text-amber-500" />
        </div>
        <h2 class="text-xl font-bold text-slate-800 mb-3">尚未連接雲端</h2>
        <p class="text-slate-500 text-sm leading-relaxed">
          請點擊「柯」傳給你的 <span class="text-brand-600 font-semibold">Magic Link</span> 以開始使用。該連結會自動設定你的私人金鑰。
        </p>
      </div>

      <div class="space-y-4">
        <div class="flex items-start gap-4 text-left p-4 bg-slate-50 rounded-2xl">
          <LinkIcon class="w-5 h-5 text-slate-400 mt-1" />
          <div>
            <p class="text-sm font-semibold text-slate-700">為什麼使用 Magic Link？</p>
            <p class="text-xs text-slate-500 mt-1 line-clamp-2">一鍵登入，不需輸入複雜的伺服器位址與金鑰。</p>
          </div>
        </div>
      </div>
    </div>

    <div class="mt-12 text-slate-400 text-xs flex items-center gap-2">
      <div class="w-1.5 h-1.5 rounded-full bg-slate-300"></div>
      Offline-First & PWA ready
    </div>
  </div>
</template>
