<script setup>
import { ref, computed, onMounted, onBeforeUnmount, nextTick } from 'vue';
import CustomCalendar from './CustomCalendar.vue';
import { CalendarIcon } from '@heroicons/vue/24/outline';

const props = defineProps({
  modelValue: {
    type: String,
    required: true
  }
});

const emit = defineEmits(['update:modelValue']);

const showCalendar = ref(false);
const dateDisplayRef = ref(null);
const calendarDropdownRef = ref(null);
const dropdownPosition = ref({ top: 0, left: 0 });

// 使用 computed property 來處理 modelValue 的 get/set
const internalValue = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
});

const formattedDate = computed(() => {
  const date = new Date(internalValue.value);
  return `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')}`;
});

const toggleCalendar = async () => {
  showCalendar.value = !showCalendar.value;
  
  if (showCalendar.value) {
    // Calculate position after showing
    await nextTick();
    if (dateDisplayRef.value) {
      const rect = dateDisplayRef.value.getBoundingClientRect();
      dropdownPosition.value = {
        top: rect.bottom + 8, // 8px below the element
        left: rect.left
      };
    }
  }
};

const handleDateSelected = (newDate) => {
  internalValue.value = newDate;
  showCalendar.value = false;
};

const handleClickOutside = (event) => {
  // 如果日曆沒有顯示，直接返回
  if (!showCalendar.value) return;

  try {
    // 檢查點擊是否在日期顯示區域內
    if (dateDisplayRef.value && dateDisplayRef.value.contains(event.target)) {
      return;
    }

    // 檢查點擊是否在日曆彈出層內
    if (calendarDropdownRef.value && calendarDropdownRef.value.contains(event.target)) {
      return;
    }

    // 點擊在外部，關閉日曆
    showCalendar.value = false;
  } catch (error) {
    console.error('Error in handleClickOutside:', error);
  }
};

// 在點擊日期框時，阻止事件冒泡導致的 handleClickOutside 被觸發
const handleDateDisplayClick = (event) => {
  event.stopPropagation();
  toggleCalendar();
};

onMounted(() => {
  document.addEventListener('click', handleClickOutside);
});

onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside);
});
</script>

<template>
  <div class="custom-date-picker-wrapper" @click.stop>
    <!-- 日期顯示部分 -->
    <div
      class="date-display"
      @click="handleDateDisplayClick"
      ref="dateDisplayRef"
    >
      <span class="date-text">{{ formattedDate }}</span>
      <CalendarIcon class="calendar-icon" />
    </div>

    <!-- 日曆彈出層 - 直接顯示在容器內 -->
    <transition name="fade">
      <div
        v-if="showCalendar"
        class="calendar-dropdown"
        ref="calendarDropdownRef"
      >
        <CustomCalendar
          v-model="internalValue"
          @update:modelValue="handleDateSelected"
        />
      </div>
    </transition>
  </div>
</template>

<style scoped>
.custom-date-picker-wrapper {
  position: relative;
  display: inline-block;
  pointer-events: auto;
}

.date-display {
  @apply bg-white border border-slate-200 rounded-2xl px-4 py-3;
  @apply flex items-center justify-between cursor-pointer;
  @apply shadow-sm transition-all duration-200;
  @apply relative z-[10];
  pointer-events: auto;
}

.date-text {
  @apply text-slate-900 font-medium text-base;
}

.calendar-icon {
  @apply w-5 h-5 text-slate-400;
}

.calendar-dropdown {
  @apply absolute top-full mt-2 left-0 z-[1000];
  @apply bg-white border border-slate-100 rounded-3xl;
  @apply shadow-2xl;
  @apply p-4;
  pointer-events: auto;
  min-width: 280px;
}

/* 淡入淡出動畫 */
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}
</style>