<script setup>
import { ref, computed } from 'vue';
import { useFinanceStore } from '../stores/useFinanceStore';
import { PlusIcon, TrashIcon, PencilIcon, ChevronLeftIcon } from '@heroicons/vue/24/outline';
import { useRouter } from 'vue-router';

const router = useRouter();
const store = useFinanceStore();

const showModal = ref(false);
const isEditMode = ref(false);
const editingItemId = ref('');

const form = ref({
  name: '',
  category: '',
  amount: '',
  payment_method: '現金',
  note: ''
});

const categories = computed(() => store.expenseCategories);
const paymentMethods = computed(() => store.paymentMethods);

const resetForm = () => {
  form.value = {
    name: '',
    category: '',
    amount: '',
    payment_method: '現金',
    note: ''
  };
  isEditMode.value = false;
  editingItemId.value = '';
};

const openModal = () => {
  resetForm();
  showModal.value = true;
};

const openEditModal = (item) => {
  isEditMode.value = true;
  editingItemId.value = item.uuid;
  form.value = {
    name: item.name,
    category: item.category,
    amount: item.amount.toString(),
    payment_method: item.payment_method || '現金',
    note: item.note || ''
  };
  showModal.value = true;
};

const handleSave = async () => {
  if (!form.value.name || !form.value.category || !form.value.amount) {
    alert('請填寫所有必填欄位 (名稱、類別、金額)');
    return;
  }

  const itemData = {
    name: form.value.name,
    category: form.value.category,
    amount: Number(form.value.amount),
    payment_method: form.value.payment_method,
    note: form.value.note
  };

  if (isEditMode.value) {
    // 編輯模式
    const item = store.recurringItems.find(i => i.uuid === editingItemId.value);
    if (item) {
      await store.updateRecurringItem({
        ...item,
        ...itemData
      });
    }
  } else {
    // 新增模式
    await store.addRecurringItem(itemData);
  }

  showModal.value = false;
  resetForm();
};

const handleDelete = async (uuid) => {
  if (confirm('確定要刪除此週期項目嗎？')) {
    await store.deleteRecurringItem(uuid);
  }
};
</script>

<template>
  <div class="min-h-screen bg-surface-50 pb-24 pt-safe">
    <!-- Header -->
    <header class="sticky top-0 z-10 bg-white border-b border-slate-200/50 px-6 py-4 flex items-center justify-between shadow-sm">
      <button @click="router.back()" class="flex items-center gap-2 text-brand-600 font-bold">
        <ChevronLeftIcon class="w-5 h-5" />
        返回
      </button>
      <h1 class="text-lg font-black text-slate-900">定期項目設定</h1>
      <div class="w-[40px]"></div>
    </header>

    <main class="px-6 py-8">
      <!-- Info Card -->
      <div class="bg-blue-50 border border-blue-200 rounded-2xl px-4 py-3 mb-6 flex items-start gap-3">
        <div class="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold mt-0.5 shrink-0">i</div>
        <p class="text-sm text-blue-900 font-medium">建立固定的類別、名稱、金額組合，在記帳頁面快速選擇新增</p>
      </div>

      <!-- Items List -->
      <section v-if="store.recurringItems.length > 0" class="space-y-3 mb-8">
        <h2 class="text-sm font-bold text-slate-500 uppercase tracking-widest px-2 mb-4">已設定項目 ({{ store.recurringItems.length }})</h2>
        <div v-for="item in store.recurringItems" :key="item.uuid"
          class="bg-white rounded-2xl p-4 border border-slate-100 flex items-center justify-between hover:border-slate-200 transition-all">
          <div class="flex-1">
            <p class="font-bold text-slate-900">{{ item.name }}</p>
            <div class="flex items-center gap-2 mt-1">
              <span class="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-full">{{ item.category }}</span>
              <span class="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded-full">{{ item.payment_method || '現金' }}</span>
            </div>
            <p v-if="item.note" class="text-xs text-slate-500 mt-2">備註: {{ item.note }}</p>
          </div>
          <div class="flex flex-col items-end gap-2">
            <p class="font-bold text-brand-600 text-lg">NT${{ item.amount.toLocaleString() }}</p>
            <div class="flex gap-2">
              <button @click="openEditModal(item)"
                class="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 transition-colors">
                <PencilIcon class="w-4 h-4 text-slate-600" />
              </button>
              <button @click="handleDelete(item.uuid)"
                class="p-2 rounded-lg bg-red-100 hover:bg-red-200 transition-colors">
                <TrashIcon class="w-4 h-4 text-red-600" />
              </button>
            </div>
          </div>
        </div>
      </section>

      <!-- Empty State -->
      <div v-else class="text-center py-12">
        <div class="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <svg class="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
        </div>
        <p class="text-slate-500 font-medium mb-2">尚無定期項目</p>
        <p class="text-sm text-slate-400 mb-6">點擊下方按鈕新增第一個定期項目</p>
      </div>

      <!-- Add Button -->
      <button @click="openModal"
        class="fixed bottom-[calc(5rem+20px+env(safe-area-inset-bottom))] left-1/2 -translate-x-1/2 w-56 bg-gradient-to-r from-brand-600 to-brand-700 text-white font-bold py-3 rounded-2xl shadow-lg hover:shadow-xl transition-all active:scale-95 flex items-center justify-center gap-2 z-30">
        <PlusIcon class="w-5 h-5" />
        新增定期項目
      </button>
    </main>

    <!-- Modal -->
    <Transition name="modal">
      <div v-if="showModal" class="fixed inset-0 z-[60] bg-black/50 flex items-end">
        <Transition name="slide-up">
          <div class="w-full bg-white rounded-t-3xl px-6 py-6 pb-5 max-h-[90vh] overflow-y-auto">
            <div class="flex items-center justify-between mb-6">
              <h2 class="text-xl font-black text-slate-900">{{ isEditMode ? '編輯定期項目' : '新增定期項目' }}</h2>
              <button @click="showModal = false" class="text-slate-400 hover:text-slate-600">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form @submit.prevent="handleSave" class="space-y-5 mb-8">
              <!-- Name -->
              <div>
                <label class="block text-sm font-bold text-slate-700 mb-2">項目名稱 *</label>
                <input v-model="form.name" type="text" placeholder="如：房租、訂閱..." 
                  class="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none transition-all" />
              </div>

              <!-- Category -->
              <div>
                <label class="block text-sm font-bold text-slate-700 mb-2">類別 *</label>
                <select v-model="form.category"
                  class="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none transition-all">
                  <option value="">請選擇類別</option>
                  <option v-for="cat in categories" :key="cat" :value="cat">{{ cat }}</option>
                </select>
              </div>

              <!-- Amount -->
              <div>
                <label class="block text-sm font-bold text-slate-700 mb-2">金額 *</label>
                <input v-model="form.amount" type="number" placeholder="0" min="0"
                  class="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none transition-all" />
              </div>

              <!-- Payment Method -->
              <div>
                <label class="block text-sm font-bold text-slate-700 mb-2">支付方式</label>
                <select v-model="form.payment_method"
                  class="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none transition-all">
                  <option v-for="method in paymentMethods" :key="method" :value="method">{{ method }}</option>
                </select>
              </div>

              <!-- Note -->
              <div>
                <label class="block text-sm font-bold text-slate-700 mb-2">備註</label>
                <textarea v-model="form.note" placeholder="選填"
                  class="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none transition-all resize-none" rows="3"></textarea>
              </div>

              <!-- Buttons -->
              <div class="flex gap-3 pt-4">
                <button type="button" @click="showModal = false"
                  class="flex-1 px-4 py-3 rounded-xl border border-slate-200 text-slate-700 font-bold hover:bg-slate-50 transition-all">
                  取消
                </button>
                <button type="submit"
                  class="flex-1 px-4 py-3 rounded-xl bg-brand-600 text-white font-bold hover:bg-brand-700 transition-all active:scale-95">
                  {{ isEditMode ? '更新' : '新增' }}
                </button>
              </div>
            </form>
          </div>
        </Transition>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.modal-enter-active, .modal-leave-active {
  transition: opacity 0.3s ease-out;
}
.modal-enter-from, .modal-leave-to {
  opacity: 0;
}

.slide-up-enter-active, .slide-up-leave-active {
  transition: transform 0.3s ease-out;
}
.slide-up-enter-from, .slide-up-leave-to {
  transform: translateY(100%);
}
</style>
