// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SyncService } from '../sync';
import { DBService } from '../db';
import { APIService } from '../api';

// Mock dependencies
vi.mock('../db', () => ({
    DBService: {
        getQueue: vi.fn(),
        clearQueue: vi.fn(),
    },
}));

vi.mock('../api', () => ({
    APIService: {
        syncBatch: vi.fn(),
    },
}));

describe('SyncService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should not call API if queue is empty', async () => {
        DBService.getQueue.mockResolvedValue([]);

        const result = await SyncService.processQueue();

        expect(result).toEqual({ success: true, count: 0 });
        expect(APIService.syncBatch).not.toHaveBeenCalled();
    });

    it('should call API with queue data and clear queue on success', async () => {
        const mockQueue = [{ uuid: '1', amount: 100 }, { uuid: '2', amount: 200 }];
        DBService.getQueue.mockResolvedValue(mockQueue);
        APIService.syncBatch.mockResolvedValue({ status: 'success' });

        const result = await SyncService.processQueue();

        expect(APIService.syncBatch).toHaveBeenCalledWith(mockQueue);
        expect(DBService.clearQueue).toHaveBeenCalled();
        expect(result).toEqual({ success: true, count: 2 });
    });

    it('should NOT clear queue if API fails', async () => {
        const mockQueue = [{ uuid: '1', amount: 100 }];
        DBService.getQueue.mockResolvedValue(mockQueue);
        APIService.syncBatch.mockRejectedValue(new Error('Network Error'));

        const result = await SyncService.processQueue();

        expect(APIService.syncBatch).toHaveBeenCalled();
        expect(DBService.clearQueue).not.toHaveBeenCalled();
        expect(result.success).toBe(false);
    });
});
