<script setup>
import { ref, computed } from 'vue';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/vue/24/outline';

const props = defineProps({
  modelValue: {
    type: String,
    required: true
  }
});

const emit = defineEmits(['update:modelValue']);

const currentDate = ref(new Date(props.modelValue));

const daysInMonth = computed(() => {
  return new Date(
    currentDate.value.getFullYear(),
    currentDate.value.getMonth() + 1,
    0
  ).getDate();
});

const firstDayOfMonth = computed(() => {
  return new Date(
    currentDate.value.getFullYear(),
    currentDate.value.getMonth(),
    1
  ).getDay();
});

const days = computed(() => {
  const daysArray = [];
  const totalDays = daysInMonth.value + firstDayOfMonth.value;

  // Add empty cells for days before the first day of month
  for (let i = 0; i < firstDayOfMonth.value; i++) {
    daysArray.push(null);
  }

  // Add days of the month
  for (let i = 1; i <= daysInMonth.value; i++) {
    daysArray.push(i);
  }

  return daysArray;
});

const monthNames = [
  '一月', '二月', '三月', '四月', '五月', '六月',
  '七月', '八月', '九月', '十月', '十一月', '十二月'
];

const formattedDate = computed(() => {
  const date = new Date(props.modelValue);
  return `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')}`;
});

const prevMonth = () => {
  currentDate.value = new Date(
    currentDate.value.getFullYear(),
    currentDate.value.getMonth() - 1,
    1
  );
};

const nextMonth = () => {
  currentDate.value = new Date(
    currentDate.value.getFullYear(),
    currentDate.value.getMonth() + 1,
    1
  );
};

const selectDate = (day) => {
  if (day === null) return;

  const selectedDate = new Date(
    currentDate.value.getFullYear(),
    currentDate.value.getMonth(),
    day
  );

  const formatted = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`;
  emit('update:modelValue', formatted);
};
</script>

<template>
  <div class="custom-calendar">
    <div class="calendar-header">
      <button @click="prevMonth" class="nav-button">
        <ChevronLeftIcon class="w-5 h-5" />
      </button>
      <div class="month-year">
        <span class="month">{{ monthNames[currentDate.getMonth()] }}</span>
        <span class="year">{{ currentDate.getFullYear() }}</span>
      </div>
      <button @click="nextMonth" class="nav-button">
        <ChevronRightIcon class="w-5 h-5" />
      </button>
    </div>
    <div class="calendar-weekdays">
      <div v-for="day in ['日', '一', '二', '三', '四', '五', '六']" :key="day" class="weekday">
        {{ day }}
      </div>
    </div>
    <div class="calendar-days">
      <div
        v-for="(day, index) in days"
        :key="index"
        class="day-cell"
        :class="{
          'empty': day === null,
          'today': day === new Date().getDate() &&
                  currentDate.getMonth() === new Date().getMonth() &&
                  currentDate.getFullYear() === new Date().getFullYear(),
          'selected': day === new Date(props.modelValue).getDate() &&
                      currentDate.getMonth() === new Date(props.modelValue).getMonth() &&
                      currentDate.getFullYear() === new Date(props.modelValue).getFullYear()
        }"
        @click="selectDate(day)"
      >
        <span v-if="day !== null">{{ day }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.custom-calendar {
  display: flex;
  flex-direction: column;
}

.calendar-header {
  @apply flex items-center justify-between mb-4;
}

.nav-button {
  @apply w-8 h-8 rounded-full flex items-center justify-center;
  @apply text-slate-400 hover:bg-slate-100 transition-colors cursor-pointer;
  @apply hover:text-slate-600;
}

.month-year {
  @apply flex flex-col items-center;
}

.month {
  @apply text-sm font-bold text-slate-900;
}

.year {
  @apply text-xs text-slate-500;
}

.calendar-weekdays {
  @apply grid grid-cols-7 gap-1 mb-2;
}

.weekday {
  @apply text-xs font-medium text-slate-500 text-center;
  @apply py-1;
}

.calendar-days {
  @apply grid grid-cols-7 gap-1;
}

.day-cell {
  @apply w-8 h-8 rounded-full flex items-center justify-center;
  @apply text-sm font-medium cursor-pointer;
  @apply transition-colors duration-150;
}

.day-cell:not(.empty):hover {
  @apply bg-slate-100;
}

.day-cell.today {
  @apply bg-brand-50 text-brand-600 pointer-events-auto;
}

.day-cell.selected {
  @apply bg-brand-600 text-white pointer-events-auto;
}

.day-cell.empty {
  @apply cursor-default pointer-events-none;
}
</style>