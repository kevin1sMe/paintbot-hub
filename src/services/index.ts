/**
 * 服务索引文件
 * 导出所有服务功能
 */

// 导出类型定义
export * from './types';

// 导出工具函数
export * from './utils';

// 导出模型定义
export { MODELS, supportsNegativePrompt } from './models';

// 导出存储相关功能
export {
  saveHistoryToLocalStorage,
  loadHistoryFromLocalStorage,
  addHistory,
  clearHistory
} from './storage/history';

export {
  saveLogsToLocalStorage,
  loadLogsFromLocalStorage,
  createLogHandler,
  createRequestLog,
  createResponseLog,
  createErrorLog
} from './storage/logs';

// 导出提供者工厂和函数
export {
  getProvider,
  getProviderByModel,
  getAllProviders,
  generateImage
} from './providers';

// 从提供者中导入函数
import { getProviderByModel } from './providers';

// 尺寸辅助函数
export function getModelSupportedSizes(model: string): {width: number, height: number}[] {
  try {
    const provider = getProviderByModel(model);
    return provider.getSupportedSizes(model);
  } catch (error) {
    // 如果获取提供者失败，返回默认尺寸
    return [{ width: 1024, height: 1024 }];
  }
}

// 尺寸检查函数
export function isImageSizeSupported(model: string, width: number, height: number): boolean {
  try {
    const provider = getProviderByModel(model);
    return provider.isImageSizeSupported(model, width, height);
  } catch (error) {
    return true; // 出错时默认返回true，避免阻塞用户操作
  }
}

// 推荐尺寸函数
export function getRecommendedSize(model: string, aspectRatio: number): {width: number, height: number} {
  try {
    const provider = getProviderByModel(model);
    return provider.getRecommendedSize(model, aspectRatio);
  } catch (error) {
    // 默认推荐尺寸
    return { width: 1024, height: 1024 };
  }
}