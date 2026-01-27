<script setup>
import { computed, ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useFinanceStore } from '../stores/useFinanceStore';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, LineElement, PointElement, Filler, LineController } from 'chart.js';
import { Doughnut, Line } from 'vue-chartjs';
import {
  CakeIcon, TruckIcon, ShoppingBagIcon, MusicalNoteIcon, HeartIcon, HomeIcon,
  AcademicCapIcon, GlobeAltIcon, RssIcon, CurrencyDollarIcon, BeakerIcon,
  LightBulbIcon, GiftIcon, FaceSmileIcon, BriefcaseIcon, ScissorsIcon,
  PhoneIcon, EllipsisHorizontalIcon, BanknotesIcon, ArrowTrendingUpIcon,
  PresentationChartLineIcon, SparklesIcon, TrophyIcon, HomeModernIcon,
  FireIcon, BoltIcon
} from '@heroicons/vue/24/outline';
import RoughWaterLevel from '../components/RoughWaterLevel.vue';
import CustomSelect from '../components/CustomSelect.vue';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, LineElement, PointElement, Filler, LineController);

const router = useRouter();
const store = useFinanceStore();
const filterUser = ref('全部');
const filterType = ref('month'); // 'month' or 'year'
const selectedYear = ref(new Date().getFullYear());
const selectedMonth = ref(new Date().getMonth() + 1);

// 選項數據
const yearOptions = ref([
  { value: 2024, label: '2024' },
  { value: 2025, label: '2025' },
  { value: 2026, label: '2026' }
]);

const monthOptions = ref([
  { value: 1, label: '01' },
  { value: 2, label: '02' },
  { value: 3, label: '03' },
  { value: 4, label: '04' },
  { value: 5, label: '05' },
  { value: 6, label: '06' },
  { value: 7, label: '07' },
  { value: 8, label: '08' },
  { value: 9, label: '09' },
  { value: 10, label: '10' },
  { value: 11, label: '11' },
  { value: 12, label: '12' }
]);

const goToCurrentMonth = () => {
  filterType.value = 'month';
  selectedYear.value = new Date().getFullYear();
  selectedMonth.value = new Date().getMonth() + 1;
};

const editLog = (logId) => {
  router.push({ path: '/', query: { edit: logId } });
};

const categoryIcons = {
  '餐飲': CakeIcon, '交通': TruckIcon, '購物': ShoppingBagIcon, '娛樂': MusicalNoteIcon,
  '醫療': HeartIcon, '住家': HomeIcon, '教育': AcademicCapIcon, '旅遊': GlobeAltIcon,
  '訂閱': RssIcon, 'PT': CurrencyDollarIcon, '水費': BeakerIcon, '電費': LightBulbIcon,
  '送禮': GiftIcon, '貓': FaceSmileIcon, '工作': BriefcaseIcon, '剪頭髮': ScissorsIcon,
  '電話費': PhoneIcon, '其他': EllipsisHorizontalIcon,
  '薪資': BanknotesIcon, '利息': ArrowTrendingUpIcon, '投資': PresentationChartLineIcon,
  '獎金': SparklesIcon, '中獎': TrophyIcon, '租補': HomeModernIcon
};

const getCategoryStatus = (category) => {
  return categoryIcons[category] || EllipsisHorizontalIcon;
};

const filteredLogs = computed(() => {
  let logs = store.logs;
  
  if (filterUser.value !== '全部') {
    logs = logs.filter(l => l.user === filterUser.value);
  }
  
  logs = logs.filter(l => {
    const d = new Date(l.date);
    const yr = d.getFullYear();
    const mo = d.getMonth() + 1;
    if (filterType.value === 'year') {
      return yr === selectedYear.value;
    } else {
      return yr === selectedYear.value && mo === selectedMonth.value;
    }
  });
  
  return logs;
});

const totalExpense = computed(() => {
  if (!filteredLogs.value) return 0;
  return filteredLogs.value
    .filter(l => l.type === 'expense' && !l.is_deleted)
    .reduce((s, l) => s + Number(l.amount), 0);
});

const expenseByCategory = computed(() => {
  const expenses = filteredLogs.value.filter(l => l.type === 'expense' && !l.is_deleted);
  const map = {};
  expenses.forEach(e => { const cat = e.category || '其他'; map[cat] = (map[cat] || 0) + Number(e.amount); });
  return {
    labels: Object.keys(map),
    datasets: [{
      data: Object.values(map),
      backgroundColor: ['#0c92eb', '#36aff9', '#7cc8fc', '#bae0fd', '#e0effe', '#f1f5f9'],
      borderWidth: 0,
      hoverOffset: 4
    }]
  };
});

const dailyData = computed(() => {
  const dates = []; const amounts = []; const today = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today); d.setDate(today.getDate() - i);
    const s = d.toISOString().split('T')[0];
    dates.push(s.substring(5));
    const total = filteredLogs.value.filter(l => l.date === s && l.type === 'expense' && !l.is_deleted).reduce((sum, e) => sum + Number(e.amount), 0);
    amounts.push(total);
  }
  return {
    labels: dates,
    datasets: [{
      label: 'Spending', data: amounts,
      borderColor: '#0c92eb', backgroundColor: 'rgba(12, 146, 235, 0.1)',
      fill: true, tension: 0.4, pointRadius: 0
    }]
  };
});

const chartOptions = { responsive: true, maintainAspectRatio: false, cutout: '80%', plugins: { legend: { display: false } } };
const areaOptions = { 
  responsive: true, maintainAspectRatio: false, 
  scales: { x: { grid: { display: false }, ticks: { font: { size: 10 } } }, y: { display: false } },
  plugins: { legend: { display: false } }
};
</script>

<template>
  <div class="min-h-screen bg-surface-50 pb-[30px] pt-safe">
    <!-- Top Stats Section -->
    <header class="bg-white/60 backdrop-blur-xl border-b border-white/20 px-6 pt-10 pb-4 rounded-b-[2.5rem] shadow-premium relative overflow-hidden">
      <div class="flex justify-between items-center relative z-10">
        <div>
          <h1 class="text-3xl font-black text-slate-900 tracking-tight">概覽</h1>
          <p class="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Monthly Analytics</p>
        </div>
        <div class="bg-slate-100 p-1 rounded-2xl flex gap-1">
          <button v-for="u in ['全部', '柯', '心儀']" :key="u" @click="filterUser = u"
            class="px-3 py-1.5 text-xs font-bold rounded-xl transition-all"
            :class="filterUser === u ? 'bg-white text-brand-600 shadow-sm' : 'text-slate-400'">{{ u }}</button>
        </div>
      </div>
    </header>

    <main class="px-6 pt-2 relative z-20 space-y-1">
      <!-- Date Selection -->
      <div class="flex flex-col gap-2 relative z-10">
        <div class="bg-slate-50/50 p-2 rounded-[2rem] border border-slate-100 relative">
          <div class="flex items-center gap-4">
            <div class="bg-white p-1 rounded-2xl inline-flex gap-1 shadow-sm">
              <button @click="filterType = 'month'"
                class="px-4 py-2 text-xs font-black rounded-xl transition-all flex-1"
                :class="filterType === 'month' ? 'bg-brand-600 text-white' : 'text-slate-400'">月</button>
              <button @click="filterType = 'year'"
                class="px-4 py-2 text-xs font-black rounded-xl transition-all flex-1"
                :class="filterType === 'year' ? 'bg-brand-600 text-white' : 'text-slate-400'">年</button>
            </div>
            <CustomSelect
              v-model="selectedYear"
              :options="yearOptions"
              width="flex-1"
            />
            <CustomSelect
              v-if="filterType === 'month'"
              v-model="selectedMonth"
              :options="monthOptions"
              width="flex-1"
            />
            <button @click="goToCurrentMonth" class="ml-auto text-sm font-bold text-blue-500 hover:bg-blue-50 px-2 py-1.5 rounded-lg transition-colors whitespace-nowrap flex-shrink-0">當月</button>
          </div>
        </div>

        <div class="bg-white p-10 text-center shadow-sm border border-slate-100 rounded-3xl">
          <p class="text-[10px] font-black opacity-60 uppercase tracking-[0.2em] mb-3 text-slate-400">Total Investment</p>
          <div class="text-6xl font-black tracking-tighter transition-all duration-500">
            <span class="text-2xl opacity-40 mr-1 text-slate-600">$</span><span class="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">{{ totalExpense.toLocaleString() }}</span>
          </div>
        </div>
      </div>
      <!-- Category Distribution -->
      <section class="grid grid-cols-1 gap-6">
        <div class="glass-card p-8">
          <h3 class="text-slate-400 uppercase tracking-widest text-xs font-bold mb-8 flex items-center gap-2">
            <BoltIcon class="w-4 h-4 text-yellow-500" /> 消費分佈
          </h3>
          <div class="h-56 relative mb-8">
            <Doughnut :data="expenseByCategory" :options="chartOptions" />
            <div class="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Expenses</span>
              <span class="text-2xl font-black text-slate-900 tracking-tighter">${{ totalExpense.toLocaleString() }}</span>
            </div>
          </div>
          <div class="space-y-3">
            <div v-for="(label, i) in expenseByCategory.labels.slice(0, 4)" :key="label" class="flex items-center justify-between">
              <div class="flex items-center gap-3">
                <div class="w-2 h-2 rounded-full" :style="{ backgroundColor: expenseByCategory.datasets[0].backgroundColor[i] }"></div>
                <span class="text-xs font-bold text-slate-600">{{ label }}</span>
              </div>
              <span class="text-xs font-black text-slate-900">${{ expenseByCategory.datasets[0].data[i].toLocaleString() }}</span>
            </div>
          </div>
        </div>
      </section>

      <!-- Spending Trend -->
      <section class="glass-card p-6">
        <div class="flex items-center justify-between mb-6">
          <h3 class="text-slate-400 uppercase tracking-widest text-xs font-bold flex items-center gap-2">
            <FireIcon class="w-4 h-4 text-orange-500" /> 近七日趨勢
          </h3>
        </div>
        <div class="h-32">
          <Line :data="dailyData" :options="areaOptions" />
        </div>
      </section>
    </main>
  </div>
</template>

<style scoped>
.no-scrollbar::-webkit-scrollbar { display: none; }
</style>
