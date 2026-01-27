// src/stores/useFinanceStore.js
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { DBService } from '../services/db';
import { SyncService } from '../services/sync';
import { APIService } from '../services/api';

// 輔助函式：移除 Vue Proxy 包裝，避免 DataCloneError
const toPlain = (obj) => JSON.parse(JSON.stringify(obj));

export const useFinanceStore = defineStore('finance', () => {
  const logs = ref([]);
  const config = ref({ monthly_budget: 30000 }); // Default value
  const syncQueue = ref([]);
  const isSyncing = ref(false);
  const expenseCategories = ref([]);
  const incomeCategories = ref([]);
  const paymentMethods = ref([]);
  const tags = ref([]);
  const recurringItems = ref([]); // 新增：週期項目
  const currentUser = ref('柯'); // 默認使用者身份
  const isAuthenticated = ref(false); // 新增：是否已驗證 API Link

  let syncTimer = null; // 防抖計時器
  let recurringItemsSyncTimer = null; // 週期項目防抖計時器

  // 內部函式：同步設定到雲端
  const syncSettings = async () => {
    try {
      const settingsData = toPlain({
        custom_tags: tags.value,
        expense_categories: expenseCategories.value,
        income_categories: incomeCategories.value,
        payment_methods: paymentMethods.value,
        recurring_items: recurringItems.value
      });

      // Fire-and-forget 策略 - 不等待結果，直接發送
      APIService.updateSettings(settingsData).catch(error => {
        console.error('設定同步失敗:', error);
      });
    } catch (error) {
      console.error('準備設定同步時發生錯誤:', error);
    }
  };

  // 內部函式：同步預算到雲端
  const syncBudget = async (newBudget) => {
    try {
      const budgetData = toPlain({
        monthly_budget: newBudget
      });

      // 直接發送並等待結果
      await APIService.updateSettings(budgetData);
    } catch (error) {
      console.error('預算同步失敗:', error);
      throw error; // 拋出錯誤讓外面知道同步失敗
    }
  };

  // 0. 設置驗證 (Magic Link)
  const setAuth = (url, token) => {
    APIService.configure(url, token);
    isAuthenticated.value = true;
  };

  // 1. 初始化
  const init = async () => {
    // 檢查 API 是否已設定
    isAuthenticated.value = APIService.isConfigured();

    // 載入使用者設定
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
      currentUser.value = savedUser;
    }
    logs.value = await DBService.getAllLogs();
    const localConfig = await DBService.getConfig();
    if (localConfig) {
      config.value = { ...config.value, ...localConfig };
    }
    syncQueue.value = await DBService.getQueue();

    // 載入類別和支付方式
    const categories = await DBService.getCategories();
    expenseCategories.value = categories.expense || [];
    incomeCategories.value = categories.income || [];

    // 如果是空的，強制初始化一次（雙重保險）
    if (expenseCategories.value.length === 0) {
      const defaults = await DBService.getCategories(); // 這會觸發 DBService 的預設值
      expenseCategories.value = defaults.expense;
      incomeCategories.value = defaults.income;
    }

    paymentMethods.value = await DBService.getPaymentMethods();
    tags.value = await DBService.getTags();
    recurringItems.value = await DBService.getRecurringItems(); // 新增：載入週期項目

    // 如果沒有驗證，就不能拉取雲端
    if (!isAuthenticated.value) return;

    // 從雲端拉取最新設定 (Pull Sync)
    try {
      const configResult = await APIService.fetchUpdates({ mode: 'config' });
      if (configResult.data && configResult.data.config) {
        const cloudSettings = configResult.data.config;

        // 如果雲端有資料，覆蓋本地狀態並寫入 IndexedDB
        if (cloudSettings.custom_tags && cloudSettings.custom_tags.length > 0) {
          tags.value = cloudSettings.custom_tags;
          await DBService.saveTags(cloudSettings.custom_tags);
        }

        if (cloudSettings.expense_categories && cloudSettings.expense_categories.length > 0) {
          const categories = await DBService.getCategories();
          categories.expense = cloudSettings.expense_categories;
          expenseCategories.value = cloudSettings.expense_categories;
          await DBService.saveCategories(categories);
        }

        if (cloudSettings.income_categories && cloudSettings.income_categories.length > 0) {
          const categories = await DBService.getCategories();
          categories.income = cloudSettings.income_categories;
          incomeCategories.value = cloudSettings.income_categories;
          await DBService.saveCategories(categories);
        }

        if (cloudSettings.payment_methods && cloudSettings.payment_methods.length > 0) {
          paymentMethods.value = cloudSettings.payment_methods;
          await DBService.savePaymentMethods(cloudSettings.payment_methods);
        }

        // 同步預算設定
        if (cloudSettings.monthly_budget) {
          const cloudConfig = cloudSettings;
          config.value = {
            ...config.value,
            ...cloudConfig,
            monthly_budget: Number(cloudConfig.monthly_budget) || config.value.monthly_budget
          };
          await DBService.saveConfig(toPlain(config.value));
        }

        // 同步週期項目
        if (cloudSettings.recurring_items && cloudSettings.recurring_items.length > 0) {
          recurringItems.value = cloudSettings.recurring_items;
          // 批量儲存週期項目
          for (const item of cloudSettings.recurring_items) {
            await DBService.saveRecurringItem(item);
          }
        }
      }
    } catch (error) {
      console.error('拉取雲端設定失敗:', error);
      // 失敗不影響 App 正常運行，使用本地資料
    }

    // 如果一打開 App 發現有積壓的資料，立刻嘗試同步
    if (syncQueue.value.length > 0) {
      triggerSync();
    }
  };

  // 2. 新增記帳 (含自動同步邏輯)
  const addLog = async (newLog) => {
    // 確保新增的 log 包含 payment_method 和 user 欄位
    const logToAdd = {
      ...newLog,
      payment_method: newLog.payment_method || '現金', // 預設為現金
      user: currentUser.value // 自動填入當前使用者
    };

    // 剝除 Proxy 包裝，避免 DataCloneError
    const plainLog = toPlain(logToAdd);

    // UI 更新
    logs.value.push(logToAdd); // Pinia 狀態可以使用原始物件(Vue 會自動包裝)
    await DBService.saveLog(plainLog); // DB 必須存純物件

    // 加入隊列
    const op = { ...plainLog }; // 確保 Queue 也是純物件
    syncQueue.value.push(op);
    await DBService.addToQueue(op);

    // 重置計時器 (3秒防抖)
    console.log('已加入隊列，準備倒數同步...');
    if (syncTimer) clearTimeout(syncTimer);

    syncTimer = setTimeout(() => {
      console.log('倒數結束，觸發同步！');
      triggerSync();
    }, 3000);
  };

  // 2.1 更新記帳 (含自動同步邏輯)
  const updateLog = async (updatedLog) => {
    // 確保更新的 log 包含 payment_method 和 user 欄位
    const logToUpdate = {
      ...updatedLog,
      payment_method: updatedLog.payment_method || '現金', // 預設為現金
      user: currentUser.value, // 自動填入當前使用者
      updated_at: new Date().toISOString() // 更新時間戳
    };

    // 剝除 Proxy 包裝，避免 DataCloneError
    const plainLog = toPlain(logToUpdate);

    // UI 更新：找到並更新本地狀態
    const index = logs.value.findIndex(l => l.uuid === logToUpdate.uuid);
    if (index > -1) {
      logs.value[index] = logToUpdate;
    }

    await DBService.saveLog(plainLog); // DB 必須存純物件

    // 加入隊列 (標記為更新操作)
    const op = { ...plainLog, operation: 'update' }; // 確保 Queue 也是純物件
    syncQueue.value.push(op);
    await DBService.addToQueue(op);

    // 重置計時器 (3秒防抖)
    console.log('已更新並加入隊列，準備倒數同步...');
    if (syncTimer) clearTimeout(syncTimer);

    syncTimer = setTimeout(() => {
      console.log('倒數結束，觸發同步！');
      triggerSync();
    }, 3000);
  };

  // 3. 執行同步
  const triggerSync = async () => {
    if (isSyncing.value || syncQueue.value.length === 0) return;

    isSyncing.value = true;
    try {
      const result = await SyncService.processQueue();

      // 關鍵修正：確保只要後端回傳成功，前端就清空
      if (result.success) {
        console.log('同步成功，清空前端隊列');
        syncQueue.value = [];
      } else {
        console.warn('同步未完全成功', result);
      }
    } catch (err) {
      console.error('同步過程發生錯誤', err);
    } finally {
      isSyncing.value = false;
    }
  };

  // 3.1 執行週期項目同步 (防抖)
  const triggerRecurringItemsSync = async () => {
    if (!isAuthenticated.value) return;

    // 重置計時器 (3秒防抖)
    if (recurringItemsSyncTimer) clearTimeout(recurringItemsSyncTimer);

    recurringItemsSyncTimer = setTimeout(async () => {
      try {
        console.log('開始同步週期項目到 Google Sheets...');
        const result = await APIService.syncRecurringItems(toPlain(recurringItems.value));
        
        if (result.status === 'success') {
          console.log('週期項目同步成功');
        } else {
          console.warn('週期項目同步失敗', result);
        }
      } catch (error) {
        console.error('週期項目同步過程發生錯誤:', error);
      }
    }, 3000);
  };

  // 4. 類別管理 - 新增類別
  const addCategory = async (type, name) => {
    if (!name || !name.trim()) {
      alert('類別名稱不能為空');
      return false;
    }

    const categories = await DBService.getCategories();
    const categoryList = type === 'expense' ? categories.expense : categories.income;

    // 檢查是否已存在
    if (categoryList.includes(name)) {
      alert('此類別已存在');
      return false;
    }

    // 新增類別
    categoryList.push(name);

    // 更新資料庫
    await DBService.saveCategories(categories);

    // 更新本地狀態
    if (type === 'expense') {
      expenseCategories.value = [...categoryList];
    } else {
      incomeCategories.value = [...categoryList];
    }

    // 同步設定到雲端
    await syncSettings();

    return true;
  };

  // 5. 類別管理 - 移除類別
  const removeCategory = async (type, name) => {
    const categories = await DBService.getCategories();
    const categoryList = type === 'expense' ? categories.expense : categories.income;

    // 移除類別
    const updatedList = categoryList.filter(item => item !== name);

    if (updatedList.length === categoryList.length) {
      console.warn('未找到要移除的類別');
      return false;
    }

    // 更新資料庫
    if (type === 'expense') {
      categories.expense = updatedList;
    } else {
      categories.income = updatedList;
    }
    await DBService.saveCategories(categories);

    // 更新本地狀態
    if (type === 'expense') {
      expenseCategories.value = [...updatedList];
    } else {
      incomeCategories.value = [...updatedList];
    }

    // 同步設定到雲端
    await syncSettings();

    return true;
  };

  // 6. 支付方式管理 - 新增支付方式
  const addPaymentMethod = async (name) => {
    if (!name || !name.trim()) {
      alert('支付方式名稱不能為空');
      return false;
    }

    const methods = await DBService.getPaymentMethods();

    // 檢查是否已存在
    if (methods.includes(name)) {
      alert('此支付方式已存在');
      return false;
    }

    // 新增支付方式
    methods.push(name);

    // 更新資料庫
    await DBService.savePaymentMethods(methods);

    // 更新本地狀態
    paymentMethods.value = [...methods];

    // 同步設定到雲端
    await syncSettings();

    return true;
  };

  // 7. 支付方式管理 - 移除支付方式
  const removePaymentMethod = async (name) => {
    const methods = await DBService.getPaymentMethods();

    // 移除支付方式
    const updatedMethods = methods.filter(item => item !== name);

    if (updatedMethods.length === methods.length) {
      console.warn('未找到要移除的支付方式');
      return false;
    }

    // 更新資料庫
    await DBService.savePaymentMethods(updatedMethods);

    // 更新本地狀態
    paymentMethods.value = [...updatedMethods];

    // 同步設定到雲端
    await syncSettings();

    return true;
  };

  // 8. 標籤管理 - 新增標籤
  const addTag = async (tagName) => {
    if (!tagName || !tagName.trim()) {
      alert('標籤名稱不能為空');
      return false;
    }

    const currentTags = await DBService.getTags();

    // 檢查是否已存在
    if (currentTags.includes(tagName)) {
      alert('此標籤已存在');
      return false;
    }

    // 新增標籤
    currentTags.push(tagName);

    // 更新資料庫
    await DBService.saveTags(currentTags);

    // 更新本地狀態
    tags.value = [...currentTags];

    // 同步設定到雲端
    await syncSettings();

    return true;
  };

  // 9. 標籤管理 - 移除標籤
  const removeTag = async (tagName) => {
    const currentTags = await DBService.getTags();

    // 移除標籤
    const updatedTags = currentTags.filter(item => item !== tagName);

    if (updatedTags.length === currentTags.length) {
      console.warn('未找到要移除的標籤');
      return false;
    }

    // 更新資料庫
    await DBService.saveTags(updatedTags);

    // 更新本地狀態
    tags.value = [...updatedTags];

    // 同步設定到雲端
    await syncSettings();

    return true;
  };

  // 10. 使用者身份管理 - 設定當前使用者
  const setCurrentUser = async (userName) => {
    if (!userName || !userName.trim()) {
      console.error('使用者名稱不能為空');
      return false;
    }

    // 更新狀態
    currentUser.value = userName;

    // 保存到 localStorage
    localStorage.setItem('currentUser', userName);

    return true;
  };

  // 11. 週期項目管理 - 新增週期項目
  const addRecurringItem = async (item) => {
    const newItem = {
      ...item,
      uuid: crypto.randomUUID(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // 剝除 Proxy 包裝
    const plainItem = toPlain(newItem);

    // UI 更新
    recurringItems.value.push(newItem);
    await DBService.saveRecurringItem(plainItem);

    // 觸發同步
    if (isAuthenticated.value) {
      triggerRecurringItemsSync();
    }

    return true;
  };

  // 11.1 週期項目管理 - 編輯週期項目
  const updateRecurringItem = async (item) => {
    const updated = {
      ...item,
      updated_at: new Date().toISOString()
    };

    const plainItem = toPlain(updated);

    // UI 更新
    const index = recurringItems.value.findIndex(i => i.uuid === item.uuid);
    if (index > -1) {
      recurringItems.value[index] = updated;
    }

    await DBService.saveRecurringItem(plainItem);

    // 觸發同步
    if (isAuthenticated.value) {
      triggerRecurringItemsSync();
    }

    return true;
  };

  // 11.2 週期項目管理 - 刪除週期項目
  const deleteRecurringItem = async (uuid) => {
    recurringItems.value = recurringItems.value.filter(i => i.uuid !== uuid);
    await DBService.deleteRecurringItem(uuid);

    // 觸發同步
    if (isAuthenticated.value) {
      triggerRecurringItemsSync();
    }

    return true;
  };

  // 11.3 週期項目管理 - 從週期項目快速建立記帳
  const createLogFromRecurringItem = async (recurringItem) => {
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    const newLog = {
      date: todayStr,
      type: 'expense',
      category: recurringItem.category,
      amount: recurringItem.amount,
      note: recurringItem.note,
      payment_method: recurringItem.payment_method || '現金',
      tags: `定期,${recurringItem.name}`,
      uuid: crypto.randomUUID(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      user: currentUser.value
    };

    // 新增記帳
    await addLog(newLog);

    return newLog;
  };

  // 12. 重置資料 - 清空本地資料並從雲端重新下載
  const resetData = async () => {
    // 1. 清空本地狀態
    logs.value = [];
    config.value = { monthly_budget: 30000 }; // 重置為預設值
    syncQueue.value = [];

    // 2. 清空 IndexedDB
    await DBService.clearAll();

    // 3. 從 Google Sheets 抓取最新資料
    await init();

    alert('資料已重置，並從雲端重新下載完成！');
  };

  const totalExpense = computed(() => {
    return logs.value
      .filter(l => l.type === 'expense' && !l.is_deleted)
      .reduce((sum, l) => sum + Number(l.amount), 0);
  });

  return {
    logs,
    syncQueue,
    isSyncing,
    expenseCategories,
    incomeCategories,
    paymentMethods,
    tags,
    recurringItems, // 新增
    currentUser,
    init,
    addLog,
    updateLog,
    addCategory,
    removeCategory,
    addPaymentMethod,
    removePaymentMethod,
    addTag,
    removeTag,
    addRecurringItem, // 新增
    updateRecurringItem, // 新增
    deleteRecurringItem, // 新增
    createLogFromRecurringItem, // 新增
    setCurrentUser,
    resetData,
    totalExpense,
    isAuthenticated,
    setAuth
  };
});
