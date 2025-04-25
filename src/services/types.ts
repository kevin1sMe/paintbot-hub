/**
 * 服务层类型定义
 */

// 日志条目类型
export interface LogEntry {
  timestamp: string;
  type: "request" | "response" | "error" | "info";
  data: any;
}

// 历史记录条目类型
export interface HistoryEntry {
  prompt: string;
  imgUrl: string;
  model: string;
  time: string;
  size: string;
  imageCount?: number;
  allImages?: string[];
}

// 尺寸类型
export interface ImageSize {
  width: number;
  height: number;
}

// 子模型定义
export interface SubModelConfig {
  label: string;
  value: string;
  price: string;
  promptMaxLength?: number;
  promptSupportLang?: string;
  negativePromptSupport?: boolean;
  negativePromptMaxLength?: number;
}

// 模型提供商配置
export interface ModelProviderConfig {
  name: string;
  value: string;
  url: string;
  apiKeyName: string;
  promptMaxLength?: number;
  promptSupportLang?: string;
  negativePromptSupport?: boolean;
  negativePromptMaxLength?: number;
  children?: SubModelConfig[];
}

// 模型提供商接口
export interface ModelProvider {
  // 基本信息
  readonly config: ModelProviderConfig;
  
  // API密钥管理
  getApiKey(): string;
  setApiKey(key: string): void;
  
  // 生成图像
  generateImage(params: GenerateImageParams): Promise<string>;
  
  // 支持的尺寸
  getSupportedSizes(model: string): ImageSize[];
  isImageSizeSupported(model: string, width: number, height: number): boolean;
  getRecommendedSize(model: string, aspectRatio: number): ImageSize;
}

// 图像生成参数
export interface GenerateImageParams {
  prompt: string;
  model: string;
  imageSize: string;
  addLog: (entry: LogEntry) => void;
  negativePrompt?: string;
}

// 工厂创建选项
export interface ProviderOptions {
  addLog?: (entry: LogEntry) => void;
} 