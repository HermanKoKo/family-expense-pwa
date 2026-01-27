# UI 更新實作計畫 - Apple 簡約風格下拉選單

## 概述

本文件提供了將 Family Expense PWA 中的下拉選單元件更新為 Apple 簡約設計風格的詳細實作計畫，遵循項目憲法和技術規範。

## 實作階段

### 阶段 1: 準備工作 (1 小時)

**任務**:
1. 設置開發環境
2. 創建功能分支: `feat/apple-style-dropdowns`
3. 審查現有代碼和依賴關係

**檔案修改**: 無

### 阶段 2: 創建可重用組件 (4 小時)

#### 2.1 創建 CustomSelect 組件 (2 小時)

**新建檔案**: `src/components/CustomSelect.vue`

```vue
<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue';
import { ChevronDownIcon } from '@heroicons/vue/24/outline';

const props = defineProps({
  modelValue: {
    type: [String, Number],
    required: true
  },
  options: {
    type: Array,
    required: true,
    validator: (value) => value.every(opt => 'value' in opt && 'label' in opt)
  },
  width: {
    type: String,
    default: 'w-16'
  },
  placeholder: {
    type: String,
    default: '請選擇'
  }
});

const emit = defineEmits(['update:modelValue']);

const showDropdown = ref(false);
const dropdownRef = ref(null);
const selectedOption = computed(() => props.options.find(opt => opt.value === props.modelValue) || { label: props.placeholder });

const toggleDropdown = () => {
  showDropdown.value = !showDropdown.value;
};

const selectOption = (value) => {
  emit('update:modelValue', value);
  showDropdown.value = false;
};

const handleClickOutside = (event) => {
  if (dropdownRef.value && !dropdownRef.value.contains(event.target)) {
    showDropdown.value = false;
  }
};

const handleKeyDown = (event) => {
  if (event.key === 'Escape') {
    showDropdown.value = false;
  }
};

onMounted(() => {
  document.addEventListener('click', handleClickOutside);
});

onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside);
});
</script>

<template>
  <div class="custom-select-container" ref="dropdownRef" @keydown="handleKeyDown">
    <div
      class="select-display"
      @click="toggleDropdown"
      :class="width"
      tabindex="0"
      role="combobox"
      aria-expanded="showDropdown"
      aria-haspopup="listbox"
    >
      <span class="select-value">{{ selectedOption.label }}</span>
      <ChevronDownIcon
        class="chevron-icon"
        :class="{ 'rotate-180': showDropdown }"
      />
    </div>
    <transition name="slide-fade">
      <div v-if="showDropdown" class="dropdown-menu" :class="width">
        <div
          v-for="option in options"
          :key="option.value"
          class="dropdown-option"
          :class="{ 'active': option.value === modelValue }"
          @click="selectOption(option.value)"
          role="option"
          :aria-selected="option.value === modelValue"
        >
          {{ option.label }}
        </div>
      </div>
    </transition>
  </div>
</template>

<style scoped>
.custom-select-container {
  position: relative;
  display: inline-block;
}

.select-display {
  @apply bg-slate-50 border-none rounded-xl px-3 py-2 cursor-pointer;
  @apply flex items-center justify-between;
  @apply transition-all duration-200;
}

.select-value {
  @apply text-slate-900 font-bold text-xs text-center;
  @apply truncate;
}

.chevron-icon {
  @apply w-4 h-4 text-slate-400;
  @apply transition-transform duration-200;
}

.dropdown-menu {
  @apply absolute z-50 mt-1 bg-white border border-slate-100;
  @apply rounded-2xl shadow-lg overflow-hidden;
  @apply max-h-48 overflow-y-auto;
}

.dropdown-option {
  @apply px-4 py-2.5 text-sm font-medium text-slate-700;
  @apply cursor-pointer transition-colors duration-150;
  @apply hover:bg-slate-50;
}

.dropdown-option.active {
  @apply bg-brand-50 text-brand-600;
}

/* 滑動淡入動畫 */
.slide-fade-enter-active, .slide-fade-leave-active {
  transition: all 0.2s ease;
}
.slide-fade-enter-from, .slide-fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>
```

#### 2.2 創建 CustomCalendar 組件 (1.5 小時)

**新建檔案**: `src/components/CustomCalendar.vue`

```vue
<script setup>
import { ref, computed, watch } from 'vue';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/vue/24/outline';

const props = defineProps({
  modelValue: {
    type: String,
    required: true
  }
});

const emit = defineEmits(['update:modelValue']);

const currentDate = ref(new Date(props.modelValue));
const showCalendar = ref(false);

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

  const formatted = selectedDate.toISOString().split('T')[0];
  emit('update:modelValue', formatted);
  showCalendar.value = false;
};

const toggleCalendar = () => {
  showCalendar.value = !showCalendar.value;
};

const closeCalendar = () => {
  showCalendar.value = false;
};
</script>

<template>
  <div class="custom-date-picker">
    <div class="date-display" @click="toggleCalendar">
      <span class="date-text">{{ formattedDate }}</span>
      <CalendarIcon class="calendar-icon" />
    </div>
    <transition name="fade">
      <div v-if="showCalendar" class="calendar-dropdown">
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
    </transition>
  </div>
</template>

<style scoped>
.custom-date-picker {
  position: relative;
  display: inline-block;
}

.date-display {
  @apply bg-white border border-slate-200 rounded-2xl px-4 py-3;
  @apply flex items-center justify-between cursor-pointer;
  @apply shadow-sm transition-all duration-200;
}

.date-text {
  @apply text-slate-900 font-medium text-base;
}

.calendar-icon {
  @apply w-5 h-5 text-slate-400;
}

.calendar-dropdown {
  @apply absolute z-50 mt-2 w-64;
  @apply bg-white border border-slate-100 rounded-3xl;
  @apply shadow-2xl p-4;
}

.calendar-header {
  @apply flex items-center justify-between mb-4;
}

.nav-button {
  @apply w-8 h-8 rounded-full flex items-center justify-center;
  @apply text-slate-400 hover:bg-slate-100 transition-colors;
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
  @apply bg-brand-50 text-brand-600;
}

.day-cell.selected {
  @apply bg-brand-600 text-white;
}

.day-cell.empty {
  @apply cursor-default;
}

/* 淡入淡出動畫 */
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}
</style>
```

#### 2.3 創建 CustomDatePicker 組件 (0.5 小時)

**新建檔案**: `src/components/CustomDatePicker.vue`

```vue
<script setup>
import { ref, computed } from 'vue';
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
const calendarRef = ref(null);

const formattedDate = computed(() => {
  const date = new Date(props.modelValue);
  return `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')}`;
});

const toggleCalendar = () => {
  showCalendar.value = !showCalendar.value;
};

const handleDateSelected = (newDate) => {
  emit('update:modelValue', newDate);
  showCalendar.value = false;
};

const handleClickOutside = (event) => {
  if (calendarRef.value && !calendarRef.value.contains(event.target)) {
    showCalendar.value = false;
  }
};

onMounted(() => {
  document.addEventListener('click', handleClickOutside);
});

onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside);
});
</script>

<template>
  <div class="custom-date-picker-wrapper" ref="calendarRef">
    <div class="date-display" @click="toggleCalendar">
      <span class="date-text">{{ formattedDate }}</span>
      <CalendarIcon class="calendar-icon" />
    </div>
    <transition name="fade">
      <div v-if="showCalendar" class="calendar-dropdown">
        <CustomCalendar
          v-model="modelValue"
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
}

.date-display {
  @apply bg-white border border-slate-200 rounded-2xl px-4 py-3;
  @apply flex items-center justify-between cursor-pointer;
  @apply shadow-sm transition-all duration-200;
}

.date-text {
  @apply text-slate-900 font-medium text-base;
}

.calendar-icon {
  @apply w-5 h-5 text-slate-400;
}

.calendar-dropdown {
  @apply absolute z-50 mt-2;
  @apply bg-white border border-slate-100 rounded-3xl;
  @apply shadow-2xl;
}

/* 淡入淡出動畫 */
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}
</style>
```

### 阶段 3: 更新現有頁面 (3 小時)

#### 3.1 更新 Editor.vue (1 小時)

**修改檔案**: `src/views/Editor.vue`

**修改邏輯**:
1. 導入 CustomDatePicker 組件
2. 替換原生 `<input type="date">` 為 CustomDatePicker
3. 確保 v-model 綁定正常工作
4. 調整樣式以匹配現有設計

```vue
<!-- 替換部分 -->
<!-- 導入部分 -->
import CustomDatePicker from '../components/CustomDatePicker.vue';

// 模板部分
<CustomDatePicker v-model="selectedDate" />
```

#### 3.2 更新 History.vue (1 小時)

**修改檔案**: `src/views/History.vue`

**修改邏輯**:
1. 導入 CustomSelect 組件
2. 替換年份和月份 `<select>` 元件為 CustomSelect
3. 轉換選項格式為 {value, label} 格式
4. 確保 v-model 綁定正常工作

```vue
<!-- 替換部分 -->
<!-- 導入部分 -->
import CustomSelect from '../components/CustomSelect.vue';

// 數據部分
const yearOptions = ref([
  { value: 2024, label: '2024' },
  { value: 2025, label: '2025' },
  { value: 2026, label: '2026' }
]);

const monthOptions = ref([
  { value: 1, label: '01' },
  { value: 2, label: '02' },
  // ... 其他月份
  { value: 12, label: '12' }
]);

// 模板部分
<CustomSelect
  v-model="selectedYear"
  :options="yearOptions"
  width="w-20"
/>
<CustomSelect
  v-if="filterType === 'month'"
  v-model="selectedMonth"
  :options="monthOptions"
  width="w-16"
/>
```

#### 3.3 更新 Dashboard.vue (1 小時)

**修改檔案**: `src/views/Dashboard.vue`

**修改邏輯**:
1. 導入 CustomSelect 組件
2. 替換年份和月份 `<select>` 元件為 CustomSelect
3. 使用相同的選項格式和樣式
4. 確保與 History.vue 保持一致

```vue
<!-- 替換部分 -->
<!-- 導入部分 -->
import CustomSelect from '../components/CustomSelect.vue';

// 使用相同的 yearOptions 和 monthOptions 定義
// 模板部分與 History.vue 相同
```

### 阶段 4: 測試和調試 (2 小時)

**任務**:
1. 單元測試: 測試新組件的基本功能
2. 集成測試: 測試與現有頁面的集成
3. 手動測試: 驗證視覺效果和交互體驗
4. 跨瀏覽器測試: 確保在不同瀏覽器中一致顯示
5. 移動設備測試: 驗證觸摸交互和響應式設計

**測試重點**:
- v-model 綁定是否正常工作
- 動畫效果是否流暢
- 點擊外部區域是否正確關閉下拉菜單
- 鍵盤導航是否支持
- 觸摸設備上的交互體驗

### 阶段 5: 文檔和最終檢查 (1 小時)

**任務**:
1. 更新項目文檔
2. 添加組件使用說明
3. 代碼審查
4. 合併到主分支

**檔案修改**:
- 更新 `README.md` 添加新組件說明
- 更新 `.specify/memory/constitution.md` 添加 UI 組件規範
- 添加組件使用示例

## 實作細節

### 組件設計原則

1. **可重用性**: 所有組件設計為可重用，支持不同場景
2. **一致性**: 所有下拉選單保持統一的視覺風格和交互行為
3. **可訪問性**: 添加適當的 ARIA 屬性和鍵盤支持
4. **響應式**: 確保在所有設備上正常顯示和操作

### 代碼風格遵循

1. 使用 `<script setup>` 語法
2. 遵循 Composition API 模式
3. 使用 Tailwind CSS 類
4. 添加適當的中文註釋
5. 保持組件小而專注

### 性能考慮

1. 使用 `onMounted` 和 `onBeforeUnmount` 管理事件監聽器
2. 使用 `computed` 屬性優化性能
3. 避免不必要的重新渲染
4. 使用 `transition` 組件優化動畫性能

## 風險評估

1. **瀏覽器兼容性**: 自定義下拉選單可能在某些瀏覽器中表現不同
   - 解決方案: 使用 Autoprefixer 和適當的 polyfill

2. **觸摸設備支持**: 需要確保在移動設備上良好的觸摸體驗
   - 解決方案: 添加適當的觸摸事件處理和大小調整

3. **性能影響**: 新組件可能影響應用性能
   - 解決方案: 進行性能測試和優化

## 回滾計畫

如果新實現出現問題，可以快速回滾到原生組件:

1. 移除新組件導入
2. 恢復原生 `<select>` 和 `<input type="date">` 元件
3. 刪除新組件文件

## 交付物

1. 三個新組件: `CustomSelect.vue`, `CustomCalendar.vue`, `CustomDatePicker.vue`
2. 更新後的三個頁面: `Editor.vue`, `History.vue`, `Dashboard.vue`
3. 測試用例和文檔更新
4. 完整的實作報告

## 時間表

- **階段 1**: 1 小時 (準備工作)
- **階段 2**: 4 小時 (創建組件)
- **階段 3**: 3 小時 (更新頁面)
- **階段 4**: 2 小時 (測試和調試)
- **階段 5**: 1 小時 (文檔和最終檢查)
- **總計**: 11 小時 (比原估計多 1 小時，增加了緩衝時間)

## 依賴關係

- Vue 3 Composition API
- Tailwind CSS
- Heroicons
- @vueuse/core (可選，用於額外功能)

## 後續工作

1. 監控用戶反饋
2. 根據反饋進行微調
3. 考慮將組件發布為獨立庫
4. 添加更多自定義選項和主題支持