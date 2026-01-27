const STORAGE_KEY_API_URL = 'fe_api_url';
const STORAGE_KEY_API_TOKEN = 'fe_api_token';

// 預設從 localStorage 讀取，沒有的話才是空字串 (或 env 作為最後備案)
let API_URL = localStorage.getItem(STORAGE_KEY_API_URL) || import.meta.env.VITE_API_URL || '';
let API_TOKEN = localStorage.getItem(STORAGE_KEY_API_TOKEN) || import.meta.env.VITE_API_TOKEN || '';

export const APIService = {
  // 設定並儲存 API 資訊 (Magic Link 登入用)
  configure(url, token) {
    if (!url || !token) return;
    
    API_URL = url;
    API_TOKEN = token;
    
    // 持久化
    localStorage.setItem(STORAGE_KEY_API_URL, url);
    localStorage.setItem(STORAGE_KEY_API_TOKEN, token);
    
    console.log('API 設定已更新');
  },

  // 檢查是否已設定
  isConfigured() {
    return !!(API_URL && API_TOKEN);
  },

  // 1. 批次寫入 (Push) - GAS v2 格式
  async syncBatch(queue) {
    return await sendRequest('POST', 'syncBatch', {
      payload: queue // GAS v2 預期的格式: { "payload": queue }
    });
  },

  // 2. 讀取更新 (Pull)
  async fetchUpdates(params) {
    return await sendRequest('GET', 'fetchUpdates', params);
  },

  // 3. 更新設定 (Push)
  async updateSettings(settings) {
    return await sendRequest('POST', 'updateSettings', {
      action: 'update_config',
      data: settings
    });
  },

  // 4. 同步週期項目 (Push)
  async syncRecurringItems(recurringItems) {
    return await sendRequest('POST', 'syncRecurringItems', {
      action: 'sync_recurring_items',
      data: recurringItems
    });
  }
};

// 專門負責發送請求的函式
async function sendRequest(method, endpoint, params = {}) {
  if (!APIService.isConfigured()) {
    console.warn('API 尚未設定，無法進行同步');
    return { status: 'skipped', message: 'No API Config' };
  }

  // Google Apps Script 有時會重新導向，所以我們要設為 follow
  const options = {
    method: method,
    headers: {
      'Content-Type': 'text/plain;charset=utf-8', // 避免 CORS 預檢請求 (Preflight)
    },
  };

  // 處理 GET 的 URL 參數
  let url = API_URL;
  if (method === 'GET') {
    const query = new URLSearchParams({ ...params, token: API_TOKEN }).toString();
    url += `?${query}`;
  } else {
    // For POST requests, include token in the body
    options.body = JSON.stringify({ ...params, token: API_TOKEN });
  }

  try {
    const response = await fetch(url, options);
    const result = await response.json();

    if (result.status === 'error') {
      throw new Error(result.message);
    }

    return result;
  } catch (error) {
    console.error('API Error:', error);
    throw error; // 拋出錯誤讓外面知道同步失敗
  }
}
