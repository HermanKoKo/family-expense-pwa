<script setup>
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useFinanceStore } from '../stores/useFinanceStore';
import {
  CakeIcon, TruckIcon, ShoppingBagIcon, MusicalNoteIcon, HeartIcon, HomeIcon,
  AcademicCapIcon, GlobeAltIcon, RssIcon, CurrencyDollarIcon, BeakerIcon,
  LightBulbIcon, GiftIcon, FaceSmileIcon, BriefcaseIcon, ScissorsIcon,
  PhoneIcon, EllipsisHorizontalIcon, BanknotesIcon, ArrowTrendingUpIcon,
  PresentationChartLineIcon, SparklesIcon, TrophyIcon, HomeModernIcon,
  MagnifyingGlassIcon, AdjustmentsHorizontalIcon
} from '@heroicons/vue/24/outline';
import CustomSelect from '../components/CustomSelect.vue';

const router = useRouter();
const store = useFinanceStore();
const filterUser = ref('全部');
const searchQuery = ref('');
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

const getCategoryIcon = (c) => categoryIcons[c] || EllipsisHorizontalIcon;

const sortedLogs = computed(() => {
  let logs = [...store.logs];
  
  // User filter
  if (filterUser.value !== '全部') logs = logs.filter(l => l.user === filterUser.value);
  
  // Search filter
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase();
    logs = logs.filter(l => (l.note && l.note.toLowerCase().includes(q)) || (l.category && l.category.toLowerCase().includes(q)));
  }
  
  // Date filter
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

  return logs.sort((a, b) => new Date(b.date) - new Date(a.date));
});

const groupedLogs = computed(() => {
  const groups = {};
  sortedLogs.value.forEach(log => {
    if (!groups[log.date]) groups[log.date] = [];
    groups[log.date].push(log);
  });
  return groups;
});

const getPaymentMethodColor = (method) => {
  switch (method) {
    case '現金':
      return 'text-emerald-500';
    case '刷卡':
      return 'text-blue-500';
    case '轉帳':
      return 'text-orange-500';
    default:
      return 'text-gray-400';
  }
};
</script>

<template>
  <div class="min-h-screen bg-surface-50 pb-[30px] pt-safe">
    <header class="bg-white/60 backdrop-blur-xl border-b border-white/20 px-8 pt-8 pb-6 rounded-b-[2.5rem] shadow-premium relative z-10 mb-4 overflow-hidden">
      <div class="absolute top-0 right-0 w-40 h-40 bg-brand-50 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl opacity-50"></div>
      
      <div class="relative z-10">
        <div class="flex items-baseline gap-3">
          <h1 class="text-3xl font-black text-slate-900 tracking-tight">明細</h1>
          <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Transaction History</p>
        </div>
        
        <div class="mt-4 relative">
          <div class="flex items-center gap-4">
            <div class="bg-slate-100 p-1 rounded-2xl inline-flex gap-1">
              <button v-for="t in ['month', 'year']" :key="t" @click="filterType = t"
                class="px-4 py-1.5 rounded-xl text-[10px] font-black transition-all flex-1"
                :class="filterType === t ? 'bg-white text-brand-600 shadow-sm' : 'text-slate-400'">
                {{ t === 'month' ? '月' : '年' }}
              </button>
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

        <div class="mt-3 flex gap-2 overflow-x-auto no-scrollbar pb-1">
          <button v-for="u in ['全部', '柯', '心儀']" :key="u" @click="filterUser = u"
            class="px-5 py-2 rounded-2xl text-[10px] font-black transition-all whitespace-nowrap border"
            :class="filterUser === u ? 'bg-slate-900 text-white border-slate-900 shadow-lg' : 'bg-white text-slate-400 border-slate-100 hover:bg-slate-50'">{{ u }}</button>
        </div>

        <div class="mt-3 relative">
          <MagnifyingGlassIcon class="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
          <input v-model="searchQuery" type="text" placeholder="搜尋備註或類別..." 
            class="w-full pl-11 pr-4 py-3.5 bg-slate-100 border-none rounded-2xl focus:ring-2 focus:ring-brand-500/30 transition-all outline-none text-sm font-medium text-slate-700 placeholder:text-slate-300" />
        </div>
      </div>
    </header>

    <main class="px-6 space-y-8">
      <div v-if="Object.keys(groupedLogs).length === 0" class="flex flex-col items-center justify-center py-20 text-slate-300">
        <div class="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
          <AdjustmentsHorizontalIcon class="w-8 h-8 opacity-20" />
        </div>
        <p class="font-bold">找不到相關紀錄</p>
      </div>

      <div v-for="(logs, date) in groupedLogs" :key="date">
        <h3 class="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 ml-2">{{ date }}</h3>
        <div class="space-y-3">
          <div v-for="log in logs" :key="log.uuid"
            class="glass-card p-4 flex items-center justify-between group active:scale-95 transition-all duration-200 cursor-pointer overflow-hidden"
            :class="{
              'border-l-4 border-blue-500': log.user === '柯',
              'border-l-4 border-pink-500': log.user === '心儀',
              'border-l-4 border-slate-200': !log.user || (log.user !== '柯' && log.user !== '心儀')
            }"
            @click="editLog(log.uuid)">
            <div class="flex items-center gap-4">
              <div class="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center shadow-sm group-hover:bg-brand-50 transition-colors relative">
                <component :is="getCategoryIcon(log.category)" class="w-6 h-6 text-slate-600 group-hover:text-brand-600 transition-colors" />
                <div v-if="log.user === '柯'" 
                  class="w-5 h-5 bg-blue-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full ring-2 ring-white absolute -bottom-1 -right-1">
                  柯
                </div>
                <div v-else-if="log.user === '心儀'" 
                  class="w-5 h-5 bg-pink-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full ring-2 ring-white absolute -bottom-1 -right-1">
                  儀
                </div>
              </div>
              <div>
                <p class="text-sm font-bold text-slate-800">{{ log.category }}</p>
                <div class="flex items-center gap-2">
                  <p v-if="log.note" class="text-[10px] text-slate-400 font-medium truncate max-w-[120px]">{{ log.note }}</p>
                </div>
                <div v-if="log.tags && log.tags.trim()" class="flex flex-wrap gap-1 mt-1">
                  <span v-for="tag in log.tags.split(',').filter(t => t.trim())" :key="tag"
                    class="text-xs font-black bg-brand-50 text-brand-600 px-2 py-1 rounded-full uppercase tracking-tighter">
                    #{{ tag.trim() }}
                  </span>
                </div>
              </div>
            </div>
            <div class="text-right font-black text-slate-900 tracking-tighter">
              <span class="text-[10px] font-medium block mb-0.5" :class="getPaymentMethodColor(log.payment_method)">{{ log.payment_method }}</span>
              <span class="text-lg" :class="log.type === 'expense' ? 'text-slate-900' : 'text-green-600'">
                {{ log.type === 'expense' ? '-' : '+' }}${{ log.amount.toLocaleString() }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<style scoped>
.no-scrollbar::-webkit-scrollbar { display: none; }
</style>
