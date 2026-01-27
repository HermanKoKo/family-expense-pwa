# UI 更新規格文件 - Apple 簡約風格下拉選單

## 概述

本規格文件旨在將 Family Expense PWA 中的下拉選單元件更新為 Apple 簡約設計風格，提升用戶體驗和視覺一致性。

## 範圍

本次更新將涉及以下三個主要頁面中的下拉選單元件：

1. **Editor.vue** - 日曆日期選擇器
2. **History.vue** - 年份和月份下拉選單
3. **Dashboard.vue** - 年份和月份下拉選單

## 設計目標

1. **簡約美學**: 遵循 Apple 設計語言，採用乾淨、簡潔的界面
2. **一致性**: 所有下拉選單保持統一的視覺風格和交互行為
3. **可用性**: 提升用戶操作的直觀性和舒適性
4. **動畫效果**: 添加細膩的過渡動畫，增強交互反饋

## 詳細規格

### 1. 日曆日期選擇器 (Editor.vue)

**當前狀態**: 使用原生 HTML `<input type="date">` 元件

**目標設計**:

```html
<!-- 新設計 - 自定義日期選擇器 -->
<div class="custom-date-picker">
  <div class="date-display" @click="toggleCalendar">
    <span class="date-text">{{ formattedDate }}</span>
    <CalendarIcon class="calendar-icon" />
  </div>
  <transition name="fade">
    <div v-if="showCalendar" class="calendar-dropdown">
      <!-- 自定義日曆組件 -->
      <CustomCalendar
        v-model="selectedDate"
        @update:modelValue="onDateSelected"
      />
    </div>
  </transition>
</div>
```

**視覺規格**:

- **容器樣式**:
  - 背景: `bg-white`
  - 邊框: `border border-slate-200`
  - 圓角: `rounded-2xl`
  - 內距: `px-4 py-3`
  - 陰影: `shadow-sm`

- **日期顯示**:
  - 字體: `text-slate-900 font-medium`
  - 大小: `text-base`
  - 格式: `YYYY/MM/DD`

- **日曆圖標**:
  - 顏色: `text-slate-400`
  - 大小: `w-5 h-5`
  - 位置: 右側

- **日曆下拉面板**:
  - 背景: `bg-white`
  - 邊框: `border border-slate-100`
  - 圓角: `rounded-3xl`
  - 陰影: `shadow-2xl`
  - 寬度: `w-64`
  - 位置: 日期顯示下方，垂直對齊

**交互行為**:

1. 點擊日期顯示區域時，顯示/隱藏日曆面板
2. 添加 `fade` 過渡動畫 (300ms)
3. 點擊日曆外區域時自動關閉
4. 選擇日期後自動關閉日曆面板

### 2. 年份和月份下拉選單 (History.vue & Dashboard.vue)

**當前狀態**: 使用原生 `<select>` 元件

**目標設計**:

```html
<!-- 新設計 - 自定義下拉選單 -->
<div class="custom-select-container">
  <div class="select-display" @click="toggleDropdown">
    <span class="select-value">{{ selectedValue }}</span>
    <ChevronDownIcon
      class="chevron-icon"
      :class="{ 'rotate-180': showDropdown }"
    />
  </div>
  <transition name="slide-fade">
    <div v-if="showDropdown" class="dropdown-menu">
      <div
        v-for="option in options"
        :key="option.value"
        class="dropdown-option"
        :class="{ 'active': option.value === selectedValue }"
        @click="selectOption(option.value)"
      >
        {{ option.label }}
      </div>
    </div>
  </transition>
</div>
```

**視覺規格**:

- **容器樣式**:
  - 背景: `bg-slate-50`
  - 邊框: `border-none`
  - 圓角: `rounded-xl`
  - 內距: `px-3 py-2`
  - 寬度: `w-16` (月份), `w-20` (年份)

- **選擇顯示**:
  - 字體: `text-slate-900 font-bold`
  - 大小: `text-xs`
  - 對齊: `text-center`

- **箭頭圖標**:
  - 顏色: `text-slate-400`
  - 大小: `w-4 h-4`
  - 位置: 右側
  - 旋轉動畫: 選中時旋轉 180 度

- **下拉菜單**:
  - 背景: `bg-white`
  - 邊框: `border border-slate-100`
  - 圓角: `rounded-2xl`
  - 陰影: `shadow-lg`
  - 寬度: 與容器相同
  - 最大高度: `max-h-48`
  - 滾動條: 自定義滾動條樣式

- **選項樣式**:
  - 字體: `text-slate-700 font-medium`
  - 大小: `text-sm`
  - 內距: `px-4 py-2.5`
  - 悬停效果: `bg-slate-50`
  - 選中狀態: `bg-brand-50 text-brand-600`

**交互行為**:

1. 點擊選擇區域時，顯示/隱藏下拉菜單
2. 添加 `slide-fade` 過渡動畫 (200ms)
3. 點擊菜單外區域時自動關閉
4. 選擇選項後自動關閉菜單
5. 鍵盤導航支持 (↑, ↓, Enter, Esc)

### 3. 動畫效果

**共通動畫**:

```css
/* 淡入淡出動畫 */
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}

/* 滑動淡入動畫 */
.slide-fade-enter-active, .slide-fade-leave-active {
  transition: all 0.2s ease;
}
.slide-fade-enter-from, .slide-fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
```

### 4. 顏色調色板

**主題顏色**:

- 主色: `#0c92eb` (brand-600)
- 輔助色: `#36aff9` (brand-500)
- 背景色: `#f8fafc` (surface-50)
- 文字色: `#0f172a` (slate-900)
- 次要文字: `#64748b` (slate-500)
- 边框色: `#e2e8f0` (slate-200)

### 5. 字體規格

- 主字體: `font-sans`
- 字重: `font-medium` (正常), `font-bold` (強調)
- 大小:
  - 選單標題: `text-xs`
  - 選項文字: `text-sm`
  - 日期顯示: `text-base`

## 實現要求

### 1. 組件結構

1. 創建可重用的 `CustomSelect` 組件
2. 創建可重用的 `CustomDatePicker` 組件
3. 確保組件支持 v-model 綁定
4. 添加適當的 TypeScript 類型定義

### 2. 代碼質量

1. 遵循現有項目代碼風格
2. 添加適當的註釋和文檔
3. 確保響應式設計
4. 考慮可訪問性 (ARIA 屬性)

### 3. 測試要求

1. 單元測試: 測試組件的基本功能
2. 集成測試: 測試與現有頁面的集成
3. 手動測試: 驗證視覺效果和交互體驗

## 交付物

1. 更新後的組件代碼
2. 相應的樣式表
3. 測試用例
4. 文檔更新

## 時間估計

- 設計: 2 小時
- 開發: 6 小時
- 測試: 2 小時
- 總計: 10 小時

## 參考資源

- Apple Human Interface Guidelines
- Tailwind CSS 文檔
- Vue 3 Composition API 文檔