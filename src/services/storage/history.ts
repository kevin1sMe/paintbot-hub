/**
 * 历史记录存储功能
 */

import { HistoryEntry } from '../types';

// 历史记录本地存储相关常量
const HISTORY_STORAGE_KEY = 'image_generation_history';
const MAX_HISTORY_TO_STORE = 50; // 最多存储的历史记录数量

/**
 * 保存历史记录到本地存储
 */
export function saveHistoryToLocalStorage(historyEntries: HistoryEntry[]) {
  try {
    // 只保存有限数量的历史记录以避免存储过大
    const historyToSave = historyEntries.slice(0, MAX_HISTORY_TO_STORE);
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(historyToSave));
  } catch (error) {
    console.error('保存历史记录到本地存储失败:', error);
  }
}

/**
 * 从本地存储加载历史记录
 */
export function loadHistoryFromLocalStorage(): HistoryEntry[] {
  try {
    const storedHistory = localStorage.getItem(HISTORY_STORAGE_KEY);
    if (storedHistory) {
      return JSON.parse(storedHistory);
    }
  } catch (error) {
    console.error('从本地存储加载历史记录失败:', error);
  }
  return [];
}

/**
 * 添加历史记录并保存
 */
export function addHistory(entry: HistoryEntry): HistoryEntry[] {
  const history = loadHistoryFromLocalStorage();
  const updatedHistory = [entry, ...history];
  saveHistoryToLocalStorage(updatedHistory);
  return updatedHistory;
}

/**
 * 清空历史记录
 */
export function clearHistory(): void {
  saveHistoryToLocalStorage([]);
} 