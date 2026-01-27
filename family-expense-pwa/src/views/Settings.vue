<script setup>
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useFinanceStore } from '../stores/useFinanceStore';
import { PencilSquareIcon, CheckIcon, XMarkIcon, UserCircleIcon, CloudIcon, ArrowPathIcon, ExclamationTriangleIcon, PlusIcon, TrashIcon, ChevronRightIcon, ArrowPathRoundedSquareIcon } from '@heroicons/vue/24/outline';

const router = useRouter();
const store = useFinanceStore();
const activeTab = ref('expense');
const newCategoryName = ref('');
const newPaymentMethodName = ref('');
const newTagName = ref('');
const isEditMode = ref(false);

const toggleEditMode = () => isEditMode.value = !isEditMode.value;
const setActiveTab = (tab) => { activeTab.value = tab; newCategoryName.value = ''; };

const handleAddCategory = async () => {
  if (!newCategoryName.value.trim()) return;
  if (await store.addCategory(activeTab.value, newCategoryName.value.trim())) newCategoryName.value = '';
};

const handleRemoveCategory = async (cat) => {
  if (confirm(`確定刪除「${cat}」？`)) await store.removeCategory(activeTab.value, cat);
};

const handleAddPaymentMethod = async () => {
  if (!newPaymentMethodName.value.trim()) return;
  if (await store.addPaymentMethod(newPaymentMethodName.value.trim())) newPaymentMethodName.value = '';
};

const handleRemovePaymentMethod = async (m) => {
  if (confirm(`確定刪除「${m}」？`)) await store.removePaymentMethod(m);
};

const handleAddTag = async () => {
  if (!newTagName.value.trim()) return;
  if (await store.addTag(newTagName.value.trim())) newTagName.value = '';
};

const handleRemoveTag = async (t) => {
  if (confirm(`確定刪除「${t}」？`)) await store.removeTag(t);
};

const syncStatus = computed(() => {
  if (store.isSyncing) return { color: 'text-amber-500', text: '同步中...', icon: ArrowPathIcon, spin: true };
  if (store.syncQueue.length > 0) return { color: 'text-brand-500', text: '待同步', icon: CloudIcon, spin: false };
  return { color: 'text-green-500', text: '已同步', icon: CheckIcon, spin: false };
});

const switchUser = async (user) => await store.setCurrentUser(user);
const handleResetData = async () => {
  if (confirm('確定重置？這將從雲端重新下載資料。')) await store.resetData();
};
</script>

<template>
  <div class="min-h-screen bg-surface-50 pb-[30px] pt-safe">
    <header class="bg-white/60 backdrop-blur-xl border-b border-white/20 px-8 pt-8 pb-6 rounded-b-[2.5rem] shadow-premium relative z-10 mb-2 overflow-hidden text-center">
      <div class="absolute top-0 left-0 w-40 h-40 bg-brand-50 rounded-full -translate-y-1/2 -translate-x-1/2 blur-3xl opacity-50"></div>
      <div class="flex items-baseline justify-center gap-3">
        <h1 class="text-3xl font-black text-slate-900 tracking-tight">設定</h1>
        <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Preferences & Sync</p>
      </div>
    </header>

    <main class="px-6 space-y-1">
      <!-- Recurring Settings Button -->
      <section class="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
        <button @click="router.push('/recurring-settings')"
          class="w-full flex items-center justify-between p-4 rounded-2xl bg-gradient-to-r from-purple-50 to-pink-50 hover:from-purple-100 hover:to-pink-100 border-2 border-purple-200 transition-all">
          <div class="flex items-center gap-3">
            <div class="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center shadow-inner">
              <ArrowPathRoundedSquareIcon class="w-7 h-7 text-purple-600" />
            </div>
            <div class="text-left">
              <h3 class="text-sm font-bold text-slate-800">定期項目設定</h3>
              <p class="text-[10px] text-slate-500">管理快速記帳項目</p>
            </div>
          </div>
          <ChevronRightIcon class="w-5 h-5 text-slate-400" />
        </button>
      </section>

      <!-- Customization Section -->
      <section class="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
        <div class="flex items-center justify-between mb-6">
          <h3 class="text-sm font-bold text-slate-800">偏好管理</h3>
          <button @click="toggleEditMode" class="w-8 h-8 rounded-full flex items-center justify-center transition-all"
            :class="isEditMode ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-400'">
            <component :is="isEditMode ? CheckIcon : PencilSquareIcon" class="w-4 h-4" />
          </button>
        </div>

        <div class="flex p-1 bg-slate-100 rounded-2xl mb-6 overflow-x-auto no-scrollbar">
          <button v-for="tab in [{id:'expense',l:'支出'}, {id:'income',l:'收入'}, {id:'payment',l:'支付'}, {id:'tags',l:'標籤'}]"
            :key="tab.id" @click="setActiveTab(tab.id)"
            class="flex-1 py-2 text-[10px] font-bold rounded-xl whitespace-nowrap transition-all"
            :class="activeTab === tab.id ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400'">
            {{ tab.l }}
          </button>
        </div>

        <div class="space-y-4">
          <div class="flex flex-wrap gap-2">
            <template v-if="activeTab === 'expense' || activeTab === 'income'">
              <div v-for="c in (activeTab === 'expense' ? store.expenseCategories : store.incomeCategories)" :key="c"
                class="px-4 py-2 rounded-2xl text-[10px] font-bold text-slate-600 flex items-center gap-2 border border-slate-200">
                {{ c }}
                <TrashIcon v-if="isEditMode" @click="handleRemoveCategory(c)" class="w-3 h-3 text-rose-500 cursor-pointer" />
              </div>
            </template>
            <template v-else-if="activeTab === 'payment'">
              <div v-for="m in store.paymentMethods" :key="m"
                class="px-4 py-2 rounded-2xl text-[10px] font-bold text-slate-600 flex items-center gap-2 border border-slate-200">
                {{ m }}
                <TrashIcon v-if="isEditMode" @click="handleRemovePaymentMethod(m)" class="w-3 h-3 text-rose-500 cursor-pointer" />
              </div>
            </template>
            <template v-else-if="activeTab === 'tags'">
              <div v-for="t in store.tags" :key="t"
                class="px-4 py-2 rounded-2xl text-[10px] font-bold text-slate-600 flex items-center gap-2 border border-slate-200">
                # {{ t }}
                <TrashIcon v-if="isEditMode" @click="handleRemoveTag(t)" class="w-3 h-3 text-rose-500 cursor-pointer" />
              </div>
            </template>
          </div>

          <div v-if="isEditMode" class="flex gap-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <input v-if="activeTab === 'expense' || activeTab === 'income'" v-model="newCategoryName" @keyup.enter="handleAddCategory"
              type="text" placeholder="新增分類..." class="input-field py-3 text-xs" />
            <input v-else-if="activeTab === 'payment'" v-model="newPaymentMethodName" @keyup.enter="handleAddPaymentMethod"
              type="text" placeholder="新增支付方式..." class="input-field py-3 text-xs" />
            <input v-else-if="activeTab === 'tags'" v-model="newTagName" @keyup.enter="handleAddTag"
              type="text" placeholder="新增標籤..." class="input-field py-3 text-xs" />
            
            <button @click="activeTab === 'tags' ? handleAddTag() : (activeTab === 'payment' ? handleAddPaymentMethod() : handleAddCategory())"
              class="w-11 h-11 bg-slate-900 text-white rounded-2xl flex items-center justify-center shrink-0">
              <PlusIcon class="w-5 h-5" />
            </button>
          </div>
        </div>
      </section>

      <!-- User Identification -->
      <section class="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
        <div class="flex items-center gap-4 mb-6">
          <div class="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center">
            <UserCircleIcon class="w-7 h-7 text-slate-400" />
          </div>
          <div>
            <h3 class="text-sm font-bold text-slate-800">使用者身份</h3>
            <p class="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Selected Profile</p>
          </div>
        </div>
        <div class="flex gap-3">
          <button v-for="u in ['柯', '心儀']" :key="u" @click="switchUser(u)"
            class="flex-1 py-4 rounded-[2rem] text-sm font-black transition-all border"
            :class="store.currentUser === u 
              ? (u === '柯' ? 'bg-[#3B82F6] border-[#3B82F6]' : 'bg-[#EC4899] border-[#EC4899]') + ' text-white shadow-lg scale-105' 
              : 'bg-white text-slate-400 border-slate-100'">
            {{ u }}
          </button>
        </div>
      </section>
    </main>
  </div>
</template>

<style scoped>
.no-scrollbar::-webkit-scrollbar { display: none; }
</style>
