<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useFinanceStore } from '../stores/useFinanceStore';
import { PencilSquareIcon, CheckIcon, ChevronLeftIcon, ChevronRightIcon, BanknotesIcon } from '@heroicons/vue/24/solid';
import {
  CakeIcon, TruckIcon, ShoppingBagIcon, MusicalNoteIcon,
  HeartIcon, HomeIcon, AcademicCapIcon, GlobeAltIcon,
  RssIcon, CurrencyDollarIcon, BeakerIcon, LightBulbIcon,
  GiftIcon, FaceSmileIcon, BriefcaseIcon, ScissorsIcon,
  PhoneIcon, EllipsisHorizontalIcon,
  ArrowTrendingUpIcon, PresentationChartLineIcon,
  SparklesIcon, TrophyIcon, HomeModernIcon,
  CalendarIcon, TagIcon, ReceiptPercentIcon, PlusIcon
} from '@heroicons/vue/24/outline';
import CustomDatePicker from '../components/CustomDatePicker.vue';

const categoryIcons = {
  '餐飲': CakeIcon, '交通': TruckIcon, '購物': ShoppingBagIcon, '娛樂': MusicalNoteIcon,
  '醫療': HeartIcon, '住家': HomeIcon, '教育': AcademicCapIcon, '旅遊': GlobeAltIcon,
  '訂閱': RssIcon, 'PT': CurrencyDollarIcon, '水費': BeakerIcon, '電費': LightBulbIcon,
  '送禮': GiftIcon, '貓': FaceSmileIcon, '工作': BriefcaseIcon, '剪頭髮': ScissorsIcon,
  '電話費': PhoneIcon, '其他': EllipsisHorizontalIcon,
  '薪資': BanknotesIcon, '利息': ArrowTrendingUpIcon, '投資': PresentationChartLineIcon,
  '獎金': SparklesIcon, '中獎': TrophyIcon, '租補': HomeModernIcon
};

const route = useRoute();
const store = useFinanceStore();
const isEditMode = ref(false);
const editingLogId = ref('');
const amount = ref('0');
const note = ref('');
const selectedCategory = ref('');
const today = new Date();
const selectedDate = ref(`${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`);
const selectedPaymentMethod = ref('現金');
const transactionType = ref('expense');
const tags = ref([]);
const customTagInput = ref('');
const showKeypad = ref(true);
const expression = ref('');
const isSaving = ref(false);
const showSuccess = ref(false);
const showRecurringDropdown = ref(false); // 新增：週期項目下拉選單
const toastMessage = ref(''); // 新增：Toast 訊息
const touchStartY = ref(0);
const touchEndY = ref(0);
const minSwipeDistance = 50; // Minimum distance for swipe to be registered

const onTouchStart = (e) => {
  touchStartY.value = e.changedTouches[0].screenY;
};

const onTouchEnd = (e) => {
  touchEndY.value = e.changedTouches[0].screenY;
  checkSwipeDirection();
};

const checkSwipeDirection = () => {
  if (touchEndY.value - touchStartY.value > minSwipeDistance) {
    showKeypad.value = false;
  }
};

const categories = computed(() => transactionType.value === 'expense' ? store.expenseCategories : store.incomeCategories);
const paymentMethods = computed(() => store.paymentMethods);

watch(categories, (newCats) => { if (newCats.length > 0 && !selectedCategory.value) selectedCategory.value = newCats[0]; }, { immediate: true });

onMounted(() => {
  const editId = route.query.edit;
  if (editId) {
    showKeypad.value = false; // 編輯模式預設隱藏計算機
    isEditMode.value = true;
    editingLogId.value = editId;
    const log = store.logs.find(l => l.uuid === editId);
    if (log) {
      amount.value = log.amount.toString();
      note.value = log.note || '';
      selectedCategory.value = log.category;
      selectedDate.value = log.date;
      selectedPaymentMethod.value = log.payment_method;
      transactionType.value = log.type;
      tags.value = log.tags ? log.tags.split(',').filter(t => t.trim()) : [];
    }
  }
});

const formattedAmount = computed(() => {
  if (amount.value === '' || amount.value === '0') return '0';
  return Number(amount.value).toLocaleString();
});

const handleInput = (key) => {
  if (key === 'OK') {
    if (expression.value !== '') handleInput('=');
    showKeypad.value = false;
    return;
  }
  if (key === '=') {
    try {
      let exp = expression.value + (amount.value !== '0' ? amount.value : '');
      exp = exp.replace(/×/g, '*').replace(/÷/g, '/').replace(/[+\-*/]+$/, '');
      const res = new Function('return ' + exp)();
      amount.value = res.toString();
      expression.value = '';
    } catch { amount.value = '0'; expression.value = ''; }
    return;
  }
  if (key === '⌫') {
    if (amount.value.length > 1) amount.value = amount.value.slice(0, -1);
    else amount.value = '0';
    return;
  }
  if (['+', '-', '×', '÷'].includes(key)) {
    if (amount.value !== '0') {
      expression.value += amount.value + key;
      amount.value = '0';
    } else if (expression.value.length > 0) {
      expression.value = expression.value.slice(0, -1) + key;
    }
    return;
  }
  if (key === '.') {
    if (!amount.value.includes('.')) amount.value += '.';
    return;
  }
  if (amount.value === '0') amount.value = key.toString();
  else amount.value += key.toString();
};

const handleSave = async () => {
  if (Number(amount.value) <= 0 && expression.value === '') return;
  if (!selectedCategory.value) {
    alert('請選擇一個類別');
    return;
  }

  // Auto-calculate if expression exists
  if (expression.value !== '') handleInput('=');

  const logData = {
    date: selectedDate.value,
    type: transactionType.value,
    category: selectedCategory.value,
    amount: Number(amount.value),
    note: note.value,
    payment_method: selectedPaymentMethod.value,
    tags: tags.value.join(',')
  };

  isSaving.value = true;

  if (isEditMode.value) {
    // 編輯模式：更新現有記錄
    const existingLog = store.logs.find(l => l.uuid === editingLogId.value);
    if (existingLog) {
      const updatedLog = {
        ...existingLog,
        ...logData,
        updated_at: new Date().toISOString()
      };
      await store.updateLog(updatedLog);
    }
  } else {
    // 新增模式：創建新記錄
    const newLog = {
      ...logData,
      uuid: crypto.randomUUID(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    await store.addLog(newLog);
  }

  // Success Feedback
  isSaving.value = false;
  showSuccess.value = true;
  setTimeout(() => { showSuccess.value = false; }, 2000);

  // 如果是編輯模式，導航回上一頁
  if (isEditMode.value) {
    // 可以選擇導航回歷史頁面或統計頁面
    // 這裡選擇導航回歷史頁面
    window.history.back();
  } else {
    // 新增模式：重置表單
    amount.value = '0'; note.value = ''; tags.value = [];
    expression.value = '';
    showKeypad.value = false;
  }
};

const toggleTag = (t) => {
  const i = tags.value.indexOf(t);
  if (i === -1) tags.value.push(t);
  else tags.value.splice(i, 1);
};

// 新增：從週期項目快速建立記帳
const handleSelectRecurringItem = async (recurringItem) => {
  showRecurringDropdown.value = false;
  isSaving.value = true;

  try {
    const newLog = await store.createLogFromRecurringItem(recurringItem);
    
    // 顯示 Toast 通知
    toastMessage.value = `已記帳 NT$${newLog.amount.toLocaleString()} - ${recurringItem.name}`;
    
    // 3秒後清除訊息
    setTimeout(() => {
      toastMessage.value = '';
    }, 3000);

    // 重置表單
    amount.value = '0'; 
    note.value = ''; 
    tags.value = [];
    expression.value = '';
    showKeypad.value = false;
  } catch (error) {
    console.error('建立記帳失敗:', error);
    toastMessage.value = '建立記帳失敗，請重試';
    setTimeout(() => {
      toastMessage.value = '';
    }, 3000);
  } finally {
    isSaving.value = false;
  }
};

const handleAddNewTag = async () => {
  const tagName = customTagInput.value.trim();
  if (!tagName) return;
  
  const success = await store.addTag(tagName);
  if (success) {
    if (!tags.value.includes(tagName)) tags.value.push(tagName);
    customTagInput.value = '';
  }
};
</script>

<template>
  <div class="min-h-screen bg-surface-50 pt-safe">
    <!-- Header: Amount Display -->
    <header class="sticky top-0 z-30 bg-white/60 backdrop-blur-xl border-b border-white/20 shadow-[0_4px_30px_rgba(0,0,0,0.03)] px-4 py-6">
      <div class="flex items-center justify-between">
        <!-- 左側：收支切換 -->
        <div class="bg-gray-100 p-1 rounded-2xl flex gap-1 shadow-lg">
          <button @click="transactionType = 'expense'" 
            class="flex-1 px-4 py-2 rounded-xl text-sm font-bold transition-all"
            :class="transactionType === 'expense' ? 'bg-white text-gray-800 shadow-md' : 'text-gray-400'">
            支出
          </button>
          <button @click="transactionType = 'income'" 
            class="flex-1 px-4 py-2 rounded-xl text-sm font-bold transition-all"
            :class="transactionType === 'income' ? 'bg-white text-gray-800 shadow-md' : 'text-gray-400'">
            收入
          </button>
        </div>

        <!-- 中間：金額顯示 -->
        <div @click="showKeypad = true" class="cursor-pointer">
          <span class="text-4xl font-black text-slate-800 amount">$ {{ formattedAmount }}</span>
        </div>

        <!-- 右側：儲存按鈕 -->
        <button @click="handleSave" 
          class="bg-blue-600 text-white px-4 py-2 rounded-full text-sm font-bold shadow-md hover:bg-blue-700 active:scale-95 transition-all"
          :disabled="isSaving">
          儲存
        </button>
      </div>
    </header>

    <main class="px-5 space-y-6 pt-[10px] pb-[30px]">
      <!-- Recurring Items Button -->
      <section v-if="store.recurringItems.length > 0" class="relative">
        <button @click="showRecurringDropdown = !showRecurringDropdown"
          class="w-full bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-200 rounded-2xl px-4 py-3 flex items-center justify-between text-left hover:border-purple-300 transition-all">
          <div class="flex items-center gap-3">
            <div class="w-8 h-8 bg-purple-200 rounded-lg flex items-center justify-center">
              <svg class="w-5 h-5 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                <path d="M6 2a2 2 0 11-4 0 2 2 0 014 0zm8 0a2 2 0 11-4 0 2 2 0 014 0zm8 0a2 2 0 11-4 0 2 2 0 014 0zM6 7a2 2 0 11-4 0 2 2 0 014 0zm8 0a2 2 0 11-4 0 2 2 0 014 0zm8 0a2 2 0 11-4 0 2 2 0 014 0zM6 12a2 2 0 11-4 0 2 2 0 014 0zm8 0a2 2 0 11-4 0 2 2 0 014 0zm8 0a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <span class="font-bold text-slate-700">週期項目</span>
          </div>
          <svg class="w-5 h-5 text-slate-400 transition-transform" :class="{'rotate-180': showRecurringDropdown}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </button>

        <!-- Recurring Items Dropdown -->
        <Transition name="dropdown">
          <div v-if="showRecurringDropdown" class="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl z-40 overflow-hidden max-h-80 overflow-y-auto">
            <button v-for="item in store.recurringItems" :key="item.uuid"
              @click="handleSelectRecurringItem(item)"
              class="w-full px-4 py-3 flex items-center justify-between hover:bg-purple-50 border-b border-slate-100 last:border-b-0 transition-colors">
              <div class="text-left">
                <p class="font-bold text-slate-900">{{ item.name }}</p>
                <p class="text-xs text-slate-500">{{ item.category }} · {{ item.payment_method || '現金' }}</p>
              </div>
              <p class="font-bold text-purple-600">NT${{ item.amount.toLocaleString() }}</p>
            </button>
          </div>
        </Transition>
      </section>

      <!-- Category Grid -->
      <section>
        <div class="flex items-center justify-between mb-4 px-2">
          <h3 class="text-sm font-bold text-slate-500 flex items-center gap-2">
            <SparklesIcon class="w-4 h-4 text-brand-500" /> 選擇類別
          </h3>
          <span class="text-[10px] bg-brand-50 text-brand-600 px-2 py-0.5 rounded-full font-bold">{{ selectedCategory }}</span>
        </div>
        <div class="grid grid-cols-5 gap-3">
          <button v-for="cat in categories" :key="cat" @click="selectedCategory = cat"
            class="flex flex-col items-center gap-2 p-3 rounded-2xl transition-all duration-200"
            :class="selectedCategory === cat ? 'bg-blue-50 text-blue-600 ring-2 ring-blue-500 ring-offset-2' : 'bg-transparent text-slate-400 hover:bg-slate-100'">
            <div class="w-10 h-10 rounded-2xl flex items-center justify-center bg-slate-50/50" :class="{'bg-white/20': selectedCategory === cat}">
              <component :is="categoryIcons[cat] || EllipsisHorizontalIcon" class="w-6 h-6" />
            </div>
            <span class="text-[10px] font-bold">{{ cat }}</span>
          </button>
        </div>
      </section>

      <!-- Details Card -->
      <section class="glass-card p-6 space-y-5">
        <!-- Date -->
        <div class="flex items-center gap-4">
          <div class="w-10 h-10 bg-orange-50 rounded-2xl flex items-center justify-center shrink-0">
            <CalendarIcon class="w-5 h-5 text-orange-500" />
          </div>
          <CustomDatePicker v-model="selectedDate" />
        </div>

        <!-- Payment -->
        <div class="flex items-center gap-4">
          <div class="w-10 h-10 bg-blue-50 rounded-2xl flex items-center justify-center shrink-0">
            <ReceiptPercentIcon class="w-5 h-5 text-blue-500" />
          </div>
          <div class="flex gap-2 overflow-x-auto no-scrollbar">
            <button v-for="m in paymentMethods" :key="m" @click="selectedPaymentMethod = m"
              class="px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all"
              :class="selectedPaymentMethod === m ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-500'">
              {{ m }}
            </button>
          </div>
        </div>

        <!-- Note -->
        <div class="flex items-center gap-4">
          <div class="w-10 h-10 bg-slate-50 rounded-2xl flex items-center justify-center shrink-0">
            <PencilSquareIcon class="w-5 h-5 text-slate-400" />
          </div>
          <input type="text" v-model="note" placeholder="新增備註..." class="bg-transparent font-medium text-slate-700 outline-none flex-1 placeholder:text-slate-300" />
        </div>
      </section>

      <!-- Tags -->
      <section>
        <div class="flex items-center gap-2 mb-3 px-2">
          <TagIcon class="w-4 h-4 text-slate-400" />
          <h3 class="text-sm font-bold text-slate-400">熱門標籤</h3>
        </div>
        <div class="flex flex-wrap gap-2 px-2">
          <!-- New Tag Input -->
          <div class="flex items-center bg-white border border-slate-100 rounded-2xl px-3 py-1.5 focus-within:border-brand-300 transition-all">
            <PlusIcon class="w-3 h-3 text-slate-400 mr-2" />
            <input 
              type="text" 
              v-model="customTagInput" 
              @keyup.enter="handleAddNewTag"
              placeholder="新增標籤..." 
              class="bg-transparent text-[10px] font-bold text-slate-600 outline-none w-16 placeholder:text-slate-300" 
            />
          </div>

          <button v-for="t in store.tags" :key="t" @click="toggleTag(t)"
            class="px-4 py-2 rounded-2xl text-xs font-bold transition-all border"
            :class="tags.includes(t) ? 'bg-brand-50 border-brand-200 text-brand-600' : 'bg-white border-slate-100 text-slate-400'">
            # {{ t }}
          </button>
        </div>
      </section>

      <div class="relative">
        <button @click="handleSave" :disabled="isSaving"
          class="btn-primary w-full py-5 rounded-[2rem] text-lg shadow-brand-500/20 flex items-center justify-center gap-3 transition-all active:scale-95 disabled:opacity-50">
          <template v-if="!isSaving && !showSuccess">
            <CheckIcon class="w-6 h-6" /> {{ isEditMode ? '更新紀錄' : '儲存紀錄' }}
          </template>
          <template v-else-if="isSaving">
            <ArrowTrendingUpIcon class="w-6 h-6 animate-bounce" /> 處理中...
          </template>
          <template v-else>
            <SparklesIcon class="w-6 h-6 text-yellow-300 animate-pulse" /> 完成！
          </template>
        </button>

        <!-- Success Sparkle Animation -->
        <div v-if="showSuccess" class="absolute inset-0 pointer-events-none flex items-center justify-center">
          <div class="sparkle-overlay absolute -top-20 left-1/2 -translate-x-1/2 w-40 h-40">
            <SparklesIcon v-for="i in 5" :key="i" 
              class="absolute text-yellow-400 animate-ping"
              :style="{ 
                top: Math.random() * 100 + '%', 
                left: Math.random() * 100 + '%', 
                animationDelay: i * 0.2 + 's',
                width: (Math.random() * 20 + 20) + 'px'
              }" 
            />
          </div>
        </div>
      </div>
    </main>

    <!-- Toast Notification -->
    <Transition
      enter-active-class="transition-all duration-300 ease-out"
      enter-from-class="transform opacity-0 translate-y-4"
      enter-to-class="transform opacity-100 translate-y-0"
      leave-active-class="transition-all duration-200 ease-in"
      leave-from-class="transform opacity-100 translate-y-0"
      leave-to-class="transform opacity-0 translate-y-4"
    >
      <div v-if="toastMessage" class="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-50 max-w-sm px-4">
        <div class="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-6 py-3 rounded-xl shadow-lg flex items-center space-x-3">
          <div class="bg-green-600/30 p-2 rounded-lg">
            <svg class="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
            </svg>
          </div>
          <span class="font-bold">{{ toastMessage }}</span>
        </div>
      </div>
    </Transition>

    <!-- Numeric Keypad Drawer -->
    <Transition name="slide-up">
      <div v-if="showKeypad" class="fixed inset-x-0 bottom-0 z-[60] bg-white/60 backdrop-blur-xl border-t border-white/20 rounded-t-[2.5rem] shadow-[0_-4px_30px_rgba(0,0,0,0.03)] max-w-md mx-auto pb-safe">
        <div class="p-6 pb-8">
          <div 
            class="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-6 cursor-pointer active:bg-slate-300 transition-colors touch-none" 
            @click="showKeypad = false"
            @touchstart="onTouchStart"
            @touchend="onTouchEnd"
          ></div>
          <div class="grid grid-cols-4 gap-3">
            <button v-for="n in [7,8,9]" :key="n" @click="handleInput(n)" class="keypad-btn">{{ n }}</button>
            <button @click="handleInput('÷')" class="keypad-btn bg-slate-50 text-brand-500 border-slate-200">÷</button>
            
            <button v-for="n in [4,5,6]" :key="n" @click="handleInput(n)" class="keypad-btn">{{ n }}</button>
            <button @click="handleInput('×')" class="keypad-btn bg-slate-50 text-brand-500 border-slate-200">×</button>
            
            <button v-for="n in [1,2,3]" :key="n" @click="handleInput(n)" class="keypad-btn">{{ n }}</button>
            <button @click="handleInput('-')" class="keypad-btn bg-slate-50 text-brand-500 border-slate-200">-</button>
            
            <button @click="handleInput('.')" class="keypad-btn">.</button>
            <button @click="handleInput(0)" class="keypad-btn">0</button>
            <button @click="handleInput('⌫')" class="keypad-btn text-rose-500 font-normal">⌫</button>
            <button @click="handleInput('+')" class="keypad-btn bg-slate-50 text-brand-500 border-slate-200">+</button>
            
            <button @click="handleInput('OK')" class="col-span-4 keypad-btn bg-brand-600 text-white">OK</button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.keypad-btn {
  @apply h-16 rounded-2xl flex items-center justify-center text-2xl font-black text-slate-700 bg-white border border-slate-100 active:scale-90 transition-all duration-100;
}

.keypad-btn.bg-brand-600 {
  @apply bg-gradient-to-r from-blue-600 to-indigo-600 shadow-lg shadow-blue-500/30 text-white;
}

.slide-up-enter-active, .slide-up-leave-active {
  transition: transform 0.3s ease-out;
}
.slide-up-enter-from, .slide-up-leave-to {
  transform: translateY(100%);
}

.dropdown-enter-active, .dropdown-leave-active {
  transition: all 0.2s ease-out;
}
.dropdown-enter-from {
  opacity: 0;
  transform: translateY(-8px);
}
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

.no-scrollbar::-webkit-scrollbar { display: none; }
.no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
</style>
