/**
 * 基础模型提供者抽象类
 * 提供通用功能实现，子类可重写特定方法
 */

import { 
  ModelProvider, 
  ModelProviderConfig, 
  GenerateImageParams, 
  ImageSize,
  LogEntry 
} from '../types';
import { getAPIKey, setAPIKey, parseImageSize } from '../utils';
import { findModelConfig } from '../models';

export abstract class BaseModelProvider implements ModelProvider {
  readonly config: ModelProviderConfig;

  constructor(config: ModelProviderConfig) {
    this.config = config;
  }

  /**
   * 获取API密钥
   */
  getApiKey(): string {
    return getAPIKey(this.config.apiKeyName);
  }

  /**
   * 设置API密钥
   */
  setApiKey(key: string): void {
    setAPIKey(key, this.config.apiKeyName);
  }

  /**
   * 生成图像
   * 子类需要实现此方法
   */
  abstract generateImage(params: GenerateImageParams): Promise<string>;

  /**
   * 获取模型支持的图片尺寸列表
   */
  getSupportedSizes(model: string): ImageSize[] {
    // 安全检查：确保model是有效字符串
    if (!model || typeof model !== 'string') {
      return [{ width: 1024, height: 1024 }];
    }
    
    // 默认实现，子类可以重写
    return [
      { width: 1024, height: 1024 }
    ];
  }

  /**
   * 检查指定的尺寸是否被当前模型支持
   */
  isImageSizeSupported(model: string, width: number, height: number): boolean {
    // 安全检查：确保model是有效字符串
    if (!model || typeof model !== 'string') {
      // 默认返回true，避免阻塞用户操作
      return true;
    }
    
    const supportedSizes = this.getSupportedSizes(model);
    return supportedSizes.some(size => size.width === width && size.height === height);
  }

  /**
   * 根据当前选择的模型和比例获取推荐的尺寸
   */
  getRecommendedSize(model: string, aspectRatio: number): ImageSize {
    // 安全检查：确保model是有效字符串
    if (!model || typeof model !== 'string') {
      return { width: 1024, height: 1024 };
    }
    
    const supportedSizes = this.getSupportedSizes(model);
    
    if (Math.abs(aspectRatio - 1) < 0.1) {
      // 接近正方形的比例
      const squareSize = supportedSizes.find(size => size.width === size.height);
      if (squareSize) return squareSize;
    } else if (aspectRatio > 1) {
      // 横向比例
      const landscapeSize = supportedSizes.find(size => size.width > size.height);
      if (landscapeSize) return landscapeSize;
    } else {
      // 纵向比例
      const portraitSize = supportedSizes.find(size => size.height > size.width);
      if (portraitSize) return portraitSize;
    }
    
    // 如果没有找到合适的尺寸，返回第一个支持的尺寸
    return supportedSizes[0];
  }

  /**
   * 处理API请求错误
   */
  protected handleApiError(error: any, addLog: (entry: LogEntry) => void): never {
    // 如果不是已记录的API错误，添加到日志
    if (!error.message?.includes("API调用失败")) {
      addLog({
        timestamp: new Date().toLocaleTimeString(),
        type: "error",
        data: {
          message: error.message,
          stack: error.stack,
        },
      });
    }
    throw error;
  }

  /**
   * 从响应中提取图像URL
   */
  protected extractImageUrl(data: any): string {
    const imgUrl = data?.data?.[0]?.url || data?.data?.[0]?.b64_json;
    if (!imgUrl) throw new Error("未获取到图片URL");
    
    // 如果返回的是base64数据，则转换为数据URL
    if (data?.data?.[0]?.b64_json) {
      return `data:image/png;base64,${imgUrl}`;
    }
    
    return imgUrl;
  }
}

/**
 * 创建未实现的提供者
 * 用于处理开发中的API
 */
export class NotImplementedProvider extends BaseModelProvider {
  constructor(config: ModelProviderConfig, private errorMessage: string = "此模型接口正在开发中，暂时不可用，请选择其他模型") {
    super(config);
  }

  async generateImage(params: GenerateImageParams): Promise<string> {
    throw new Error(this.errorMessage);
  }
} 