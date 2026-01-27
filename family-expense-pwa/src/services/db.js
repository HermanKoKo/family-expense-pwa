// src/services/db.js
import { get, set, del, values, update } from 'idb-keyval';

// 定義儲存區名稱 (像是資料庫裡的 Table)
const STORES = {
  LOGS: 'fe_logs',       // 存放記帳紀錄
  CONFIG: 'fe_config',   // 存放設定 (預算等)
  QUEUE: 'fe_sync_queue', // 存放還沒同步到 Google 的資料
  CATEGORIES: 'fe_categories', // 存放支出/收入類別
  PAYMENT_METHODS: 'fe_payment_methods', // 存放支付方式
  TAGS: 'fe_tags',       // 存放標籤
  RECURRING_ITEMS: 'fe_recurring_items' // 存放週期項目
};

export const DBService = {
  // --- 記帳紀錄 (Logs) 相關 ---
  
  // 取得所有記帳紀錄
  async getAllLogs() {
    // 讀取原本的陣列，如果沒有則回傳空陣列
    return (await get(STORES.LOGS)) || [];
  },

  // 新增或更新一筆紀錄
  async saveLog(log) {
    await update(STORES.LOGS, (logs = []) => {
      // 檢查是否已存在 (用 uuid 判斷)
      const index = logs.findIndex(l => l.uuid === log.uuid);
      if (index > -1) {
        logs[index] = log; // 更新
      } else {
        logs.push(log); // 新增
      }
      return logs;
    });
  },

  // 批量儲存紀錄 (通常用於從 Google 同步下來後)
  async saveLogsBatch(newLogs) {
    await update(STORES.LOGS, (currentLogs = []) => {
      newLogs.forEach(newLog => {
        const index = currentLogs.findIndex(l => l.uuid === newLog.uuid);
        if (index > -1) {
          // 如果本地比較舊，才更新 (Last-Write-Wins 簡化版)
          if (new Date(newLog.updated_at) > new Date(currentLogs[index].updated_at)) {
            currentLogs[index] = newLog;
          }
        } else {
          currentLogs.push(newLog);
        }
      });
      return currentLogs;
    });
  },

  // --- 同步隊列 (Sync Queue) 相關 ---
  
  // 加入待同步清單
  async addToQueue(operation) {
    await update(STORES.QUEUE, (queue = []) => {
      queue.push(operation);
      return queue;
    });
  },

  // 取得目前等待同步的清單
  async getQueue() {
    return (await get(STORES.QUEUE)) || [];
  },

  // 清空隊列 (同步成功後)
  async clearQueue() {
    await set(STORES.QUEUE, []);
  },

  // --- 設定 (Config) 相關 ---

  async saveConfig(config) {
    await set(STORES.CONFIG, config);
  },

  async getConfig() {
    return await get(STORES.CONFIG);
  },

  // --- 類別 (Categories) 相關 ---

  // 取得所有類別
  async getCategories() {
    return (await get(STORES.CATEGORIES)) || {
      expense: ['餐飲', '交通', '購物', '娛樂', '醫療', '住家', '教育', '旅遊', '訂閱', 'PT', '水費', '電費', '送禮', '貓', '工作', '剪頭髮', '電話費', '其他'],
      income: ['薪資', '利息', '投資', '獎金', '中獎', '租補']
    };
  },

  // 儲存類別
  async saveCategories(categories) {
    await set(STORES.CATEGORIES, categories);
  },

  // --- 支付方式 (Payment Methods) 相關 ---

  // 取得所有支付方式
  async getPaymentMethods() {
    return (await get(STORES.PAYMENT_METHODS)) || ['現金', '刷卡', '轉帳'];
  },

  // 儲存支付方式
  async savePaymentMethods(methods) {
    await set(STORES.PAYMENT_METHODS, methods);
  },

  // --- 標籤 (Tags) 相關 ---

  // 取得所有標籤
  async getTags() {
    return (await get(STORES.TAGS)) || ['公帳', '私帳', '早餐', '午餐', '晚餐'];
  },

  // 儲存標籤
  async saveTags(tags) {
    await set(STORES.TAGS, tags);
  },

  // --- 週期項目 (Recurring Items) 相關 ---

  // 取得所有週期項目
  async getRecurringItems() {
    return (await get(STORES.RECURRING_ITEMS)) || [];
  },

  // 新增或更新週期項目
  async saveRecurringItem(item) {
    await update(STORES.RECURRING_ITEMS, (items = []) => {
      const index = items.findIndex(i => i.uuid === item.uuid);
      if (index > -1) {
        items[index] = item;
      } else {
        items.push(item);
      }
      return items;
    });
  },

  // 刪除週期項目
  async deleteRecurringItem(uuid) {
    await update(STORES.RECURRING_ITEMS, (items = []) => {
      return items.filter(i => i.uuid !== uuid);
    });
  },

  // 清空所有資料
  async clearAll() {
    await del(STORES.LOGS);
    await del(STORES.CONFIG);
    await del(STORES.QUEUE);
    await del(STORES.CATEGORIES);
    await del(STORES.PAYMENT_METHODS);
    await del(STORES.TAGS);
    await del(STORES.RECURRING_ITEMS);
  }
};
