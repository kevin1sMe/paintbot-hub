/**
 * 日志存储功能
 */

import { LogEntry } from '../types';
import { getTimestamp } from '../utils';

const REDACTED_VALUE = '[redacted]';
const SENSITIVE_KEYS = ['authorization', 'api-key', 'apikey', 'token', 'secret', 'key', 'password'];

// 日志本地存储相关常量
const LOG_STORAGE_KEY = 'api_logs_history';
const MAX_LOGS_TO_STORE = 100; // 最多存储的日志数量

/**
 * 保存日志到本地存储
 */
export function saveLogsToLocalStorage(logs: LogEntry[]) {
  try {
    // 只保存有限数量的日志以避免存储过大
    const logsToSave = logs
      .slice(-MAX_LOGS_TO_STORE)
      .map(sanitizeLogEntry);
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
    
    logs = [...logs, sanitizeLogEntry(entry)];
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
export function createRequestLog(url: string, method: string, headers: Record<string, string>, body: unknown): LogEntry {
  return {
    timestamp: getTimestamp(),
    type: "request",
    data: sanitizeRequestData({ url, method, headers, body })
  };
}

/**
 * 创建响应日志
 */
export function createResponseLog(data: unknown): LogEntry {
  return {
    timestamp: getTimestamp(),
    type: "response",
    data: redactSensitiveValues(data)
  };
}

/**
 * 创建错误日志
 */
export function createErrorLog(error: unknown): LogEntry {
  return {
    timestamp: getTimestamp(),
    type: "error",
    data: redactSensitiveValues(error)
  };
}

// 对日志条目进行敏感信息清洗，防止密钥等内容被写入本地存储
function sanitizeLogEntry(entry: LogEntry): LogEntry {
  if (entry.type === 'request' && isRecord(entry.data)) {
    return { ...entry, data: sanitizeRequestData(entry.data) };
  }

  return { ...entry, data: redactSensitiveValues(entry.data) };
}

function sanitizeRequestData(data: Record<string, unknown>) {
  const { headers, body, ...rest } = data;

  return {
    ...rest,
    headers: sanitizeHeaders(headers),
    body: redactSensitiveValues(body)
  };
}

function sanitizeHeaders(headers: unknown): Record<string, string> | undefined {
  if (!isRecord(headers)) {
    return undefined;
  }

  return Object.entries(headers).reduce<Record<string, string>>((acc, [key, value]) => {
    const normalizedKey = key.toLowerCase();
    if (SENSITIVE_KEYS.includes(normalizedKey)) {
      acc[key] = REDACTED_VALUE;
      return acc;
    }

    acc[key] = typeof value === 'string' ? value : JSON.stringify(value);
    return acc;
  }, {});
}

function redactSensitiveValues(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(item => redactSensitiveValues(item));
  }

  if (isRecord(value)) {
    return Object.entries(value).reduce<Record<string, unknown>>((acc, [key, val]) => {
      const normalizedKey = key.toLowerCase();
      if (SENSITIVE_KEYS.some(sensitive => normalizedKey.includes(sensitive))) {
        acc[key] = REDACTED_VALUE;
      } else {
        acc[key] = redactSensitiveValues(val);
      }
      return acc;
    }, {});
  }

  if (typeof value === 'string') {
    const containsTokenLike = /bearer\s+[a-z0-9]/i.test(value) || value.length > 80;
    return containsTokenLike ? REDACTED_VALUE : value;
  }

  return value;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
