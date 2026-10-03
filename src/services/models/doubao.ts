/**
 * 火山引擎豆包模型定义
 */

import { ModelProviderConfig } from '../types';

// 豆包模型配置
export const DOUBAO_MODEL: ModelProviderConfig = {
  name: "火山引擎豆包",
  value: "doubaoimg",
  url: "https://docs.volcengine.com/docs/ark/seedream-4-0-5-0",
  apiKeyName: "volcengine_key",
  promptMaxLength: 500,
  negativePromptSupport: false,
  negativePromptMaxLength: 500,
  promptSupportLang: "中文、英文",
  children: [
    { label: "Seedream 5.0 Flash (最新)", value: "doubao-seedream-5-0-flash-260915", price: "以官方账单为准", promptMaxLength: 500, negativePromptSupport: false, promptSupportLang: "中文、英文" },
    { label: "Seedream 5.0 Pro", value: "doubao-seedream-5-0-pro-260628", price: "以官方账单为准", promptMaxLength: 500, negativePromptSupport: false, promptSupportLang: "中文、英文" },
    { label: "Seedream 5.0 Lite", value: "doubao-seedream-5-0-lite-260128", price: "以官方账单为准", promptMaxLength: 500, negativePromptSupport: false, promptSupportLang: "中文、英文" },
    { label: "Seedream 4.5", value: "doubao-seedream-4-5-251128", price: "0.25元/张", promptMaxLength: 500, negativePromptSupport: false, promptSupportLang: "中文、英文" },
    { label: "Seedream 4.0", value: "doubao-seedream-4-0-250828", price: "0.2元/张", promptMaxLength: 500, negativePromptSupport: false, promptSupportLang: "中文、英文" },
    { label: "通用2.1-文生图", value: "doubaoimg-text2img-v2.1", price: "0.2元/张", promptMaxLength: 500, negativePromptSupport: true, promptSupportLang: "中文、英文" },
    { label: "通用2.0Pro-文生图", value: "doubaoimg-text2img-v2.0pro", price: "0.2元/张", promptMaxLength: 500, negativePromptSupport: true, promptSupportLang: "中文、英文" },
    { label: "通用2.0-文生图", value: "doubaoimg-text2img-v2.0", price: "0.2元/张", promptMaxLength: 500, negativePromptSupport: true, promptSupportLang: "中文、英文" }
  ],
};

/**
 * 检查豆包模型是否支持负面提示词
 */
export function supportsDoubaoNegativePrompt(modelId: string): boolean {
  // 仅旧版通用模型支持负面提示词。
  return modelId.startsWith('doubaoimg-');
}
