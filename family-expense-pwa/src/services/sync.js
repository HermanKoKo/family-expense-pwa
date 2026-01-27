// src/services/sync.js
import { DBService } from './db';
import { APIService } from './api';

export const SyncService = {
  // 核心功能：執行一次同步
  async processQueue() {
    // 1. 從 IDB 拿出所有待辦事項
    const queue = await DBService.getQueue();
    
    if (queue.length === 0) {
      return { success: true, count: 0 }; // 沒事做
    }

    console.log(`準備同步 ${queue.length} 筆資料...`);

    try {
      // 2. 打包發送給 Google Sheet
      const response = await APIService.syncBatch(queue);
      
      console.log('Google 回傳:', response);

      // 3. 如果成功，清空本地隊列 (以免重複發送)
      if (response.status === 'success') {
        await DBService.clearQueue();
        return { success: true, count: queue.length };
      }
      
    } catch (error) {
      console.error('同步失敗 (可能是網路問題):', error);
      return { success: false, error: error };
    }
  }
};