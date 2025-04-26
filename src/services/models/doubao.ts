/**
 * 火山引擎豆包模型定义
 */

import { ModelProviderConfig } from '../types';

// 豆包模型配置
export const DOUBAO_MODEL: ModelProviderConfig = {
  name: "火山引擎豆包",
  value: "doubaoimg",
  url: "https://www.volcengine.com/docs/6791/1366783",
  apiKeyName: "volcengine_key",
  promptMaxLength: 500, // 豆包文生图提示词长度限制
  negativePromptSupport: true, // 支持反向提示词
  negativePromptMaxLength: 500, // 反向提示词最大长度
  promptSupportLang: "中文、英文",
  children: [
    { label: "通用2.1-文生图", value: "doubaoimg-text2img-v2.1", price: "0.2元/张", promptMaxLength: 500, negativePromptSupport: true, promptSupportLang: "中文、英文" },
    { label: "通用2.0Pro-文生图", value: "doubaoimg-text2img-v2.0pro", price: "0.2元/张", promptMaxLength: 500, negativePromptSupport: true, promptSupportLang: "中文、英文" },
    { label: "通用2.0-文生图", value: "doubaoimg-text2img-v2.0", price: "0.2元/张", promptMaxLength: 500, negativePromptSupport: true, promptSupportLang: "中文、英文" }
  ],
};

/**
 * 检查豆包模型是否支持负面提示词
 */
export function supportsDoubaoNegativePrompt(modelId: string): boolean {
  // 所有豆包模型都支持负面提示词
  return modelId.startsWith('doubaoimg-');
} 