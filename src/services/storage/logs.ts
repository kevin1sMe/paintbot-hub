/**
 * 日志存储功能
 */

import { LogEntry } from '../types';
import { getTimestamp } from '../utils';

// 日志本地存储相关常量
const LOG_STORAGE_KEY = 'api_logs_history';
const MAX_LOGS_TO_STORE = 100; // 最多存储的日志数量

/**
 * 保存日志到本地存储
 */
export function saveLogsToLocalStorage(logs: LogEntry[]) {
  try {
    // 只保存有限数量的日志以避免存储过大
    const logsToSave = logs.slice(-MAX_LOGS_TO_STORE);
    localStorage.setItem(LOG_STORAGE_KEY, JSON.stringify(logsToSave));
  } catch (error) {
    console.error('保存日志到本地存储失败:', error);
  }
}

/**
 * 从本地存储加载日志
 */
export function loadLogsFromLocalStorage(): LogEntry[] {
  try {
    const storedLogs = localStorage.getItem(LOG_STORAGE_KEY);
    if (storedLogs) {
      return JSON.parse(storedLogs);
    }
  } catch (error) {
    console.error('从本地存储加载日志失败:', error);
  }
  return [];
}

/**
 * 创建日志处理函数
 */
export function createLogHandler() {
  let logs = loadLogsFromLocalStorage();
  
  const addLog = (entry: LogEntry) => {
    // 确保有时间戳
    if (!entry.timestamp) {
      entry.timestamp = getTimestamp();
    }
    
    logs = [...logs, entry];
    saveLogsToLocalStorage(logs);
    return entry;
  };
  
  return {
    addLog,
    getLogs: () => logs,
    clearLogs: () => {
      logs = [];
      saveLogsToLocalStorage(logs);
    }
  };
}

/**
 * 创建请求日志
 */
export function createRequestLog(url: string, method: string, headers: Record<string, string>, body: any): LogEntry {
  return {
    timestamp: getTimestamp(),
    type: "request",
    data: { url, method, headers, body }
  };
}

/**
 * 创建响应日志
 */
export function createResponseLog(data: any): LogEntry {
  return {
    timestamp: getTimestamp(),
    type: "response",
    data
  };
}

/**
 * 创建错误日志
 */
export function createErrorLog(error: any): LogEntry {
  return {
    timestamp: getTimestamp(),
    type: "error",
    data: error
  };
} 