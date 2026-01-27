<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
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