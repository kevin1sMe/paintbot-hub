/**
 * 模型定义
 */

import { ModelProviderConfig } from '../types';
import { DOUBAO_MODEL } from './doubao';

// 定义模型列表
export const MODELS: ModelProviderConfig[] = [
  {
    name: "智谱AI CogView",
    value: "cogview",
    url: "https://bigmodel.cn/dev/howuse/cogview",
    apiKeyName: "zhipuai_key",
    promptMaxLength: 9999,
    children: [
      { label: "GLM-Image (旗舰)", value: "glm-image", price: "0.1元/张", promptMaxLength: 1000, promptSupportLang: "中文、英文" },
      { label: "CogView-4-250304", value: "cogview-4-250304", price: "0.06元/张", promptMaxLength: 9999 },
      { label: "CogView-4", value: "cogview-4", price: "0.06元/张", promptMaxLength: 9999 },
      { label: "CogView-3-Flash", value: "cogview-3-flash", price: "免费", promptMaxLength: 9999 },
      { label: "CogView-3", value: "cogview-3", price: "以官方账单为准", promptMaxLength: 9999 },
    ],
  },
  {
    name: "OpenAI 文生图",
    value: "openai",
    url: "https://platform.openai.com/docs/api-reference/images",
    apiKeyName: "openai_key",
    promptMaxLength: 4000,
    promptSupportLang: "中文、英文",
    negativePromptSupport: false,
    children: [
      { label: "GPT Image 2.5 Sunburst (最新)", value: "gpt-image-2.5-sunburst", price: "按尺寸和质量计费", promptMaxLength: 32000, promptSupportLang: "中文、英文" },
      { label: "GPT Image 2.5 Flare", value: "gpt-image-2.5-flare", price: "按尺寸和质量计费", promptMaxLength: 32000, promptSupportLang: "中文、英文" },
      { label: "GPT-Image-2", value: "gpt-image-2", price: "低$0.006/中$0.053/高$0.211/张", promptMaxLength: 32000, promptSupportLang: "中文、英文" },
      { label: "GPT-Image-1.5", value: "gpt-image-1.5", price: "低$0.009-0.013/中$0.034-0.05/高$0.133-0.20/张", promptMaxLength: 32000, promptSupportLang: "中文、英文" },
      { label: "GPT-Image-1 Mini", value: "gpt-image-1-mini", price: "按尺寸和质量计费", promptMaxLength: 32000, promptSupportLang: "中文、英文" },
      { label: "GPT-Image-1 (高质量)", value: "gpt-image-1-high", price: "$0.167-0.25/张", promptMaxLength: 32000, promptSupportLang: "中文、英文" },
      { label: "GPT-Image-1 (中质量)", value: "gpt-image-1-medium", price: "$0.042-0.063/张", promptMaxLength: 32000, promptSupportLang: "中文、英文" },
      { label: "GPT-Image-1 (低质量)", value: "gpt-image-1-low", price: "$0.011-0.016/张", promptMaxLength: 32000, promptSupportLang: "中文、英文" },
    ],
  },
  {
    name: "阿里云通义万相",
    value: "wanx",
    url: "https://help.aliyun.com/zh/model-studio/text-to-image",
    apiKeyName: "aliyun_wanx_key",
    promptMaxLength: 800,
    negativePromptSupport: true,
    negativePromptMaxLength: 500,
    promptSupportLang: "中文、英文",
    children: [
      { label: "Qwen Image 3.0 Pro (最新)", value: "qwen-image-3.0-pro", price: "以官方账单为准", promptMaxLength: 4500, negativePromptSupport: true, promptSupportLang: "中文、英文" },
      { label: "Qwen Image 3.0", value: "qwen-image-3.0", price: "以官方账单为准", promptMaxLength: 4500, negativePromptSupport: true, promptSupportLang: "中文、英文" },
      { label: "Qwen Image 2.1 Pro", value: "qwen-image-2.1-pro", price: "以官方账单为准", promptMaxLength: 4500, negativePromptSupport: true, promptSupportLang: "中文、英文" },
      { label: "Qwen Image 2.0 Pro (2026-06-22)", value: "qwen-image-2.0-pro-2026-06-22", price: "以官方账单为准", promptMaxLength: 1300, negativePromptSupport: true, promptSupportLang: "中文、英文" },
      { label: "Qwen Image 2.0 Pro", value: "qwen-image-2.0-pro", price: "以官方账单为准", promptMaxLength: 1300, negativePromptSupport: true, promptSupportLang: "中文、英文" },
      { label: "Qwen Image 2.0", value: "qwen-image-2.0", price: "以官方账单为准", promptMaxLength: 1300, negativePromptSupport: true, promptSupportLang: "中文、英文" },
      { label: "Qwen Image Max", value: "qwen-image-max", price: "以官方账单为准", promptMaxLength: 800, negativePromptSupport: true, promptSupportLang: "中文、英文" },
      { label: "Qwen Image Plus", value: "qwen-image-plus", price: "以官方账单为准", promptMaxLength: 800, negativePromptSupport: true, promptSupportLang: "中文、英文" },
      { label: "Wan 2.7 Image Pro (最新)", value: "wan2.7-image-pro", price: "以官方账单为准", promptMaxLength: 5000, negativePromptSupport: false, promptSupportLang: "中文、英文" },
      { label: "Wan 2.7 Image", value: "wan2.7-image", price: "以官方账单为准", promptMaxLength: 5000, negativePromptSupport: false, promptSupportLang: "中文、英文" },
      { label: "Wan 2.6 Image", value: "wan2.6-image", price: "以官方账单为准", promptMaxLength: 2000, negativePromptSupport: false, promptSupportLang: "中文、英文" },
      { label: "Z-Image Turbo", value: "z-image-turbo", price: "以官方账单为准", promptMaxLength: 800, negativePromptSupport: false, promptSupportLang: "中文、英文" },
      { label: "wan2.6-t2i", value: "wan2.6-t2i", price: "0.2元/张", promptMaxLength: 2100, negativePromptSupport: true, promptSupportLang: "中文、英文" },
      { label: "wan2.2-t2i-flash", value: "wan2.2-t2i-flash", price: "以官方账单为准", promptMaxLength: 800, negativePromptSupport: true, promptSupportLang: "中文、英文" },
      { label: "qwen-image (千问)", value: "qwen-image", price: "0.25元/张", promptMaxLength: 800, negativePromptSupport: true, promptSupportLang: "中文、英文" },
      { label: "wanx2.1-t2i-turbo", value: "wanx2.1-t2i-turbo", price: "0.14元/张", promptMaxLength: 800, negativePromptSupport: true, promptSupportLang: "中文、英文" },
      { label: "wanx2.1-t2i-plus", value: "wanx2.1-t2i-plus", price: "0.20元/张", promptMaxLength: 800, negativePromptSupport: true, promptSupportLang: "中文、英文" },
      { label: "wanx2.0-t2i-turbo", value: "wanx2.0-t2i-turbo", price: "0.04元/张", promptMaxLength: 800, negativePromptSupport: true, promptSupportLang: "中文、英文" },
    ],
  },
  {
    name: "百度千帆",
    value: "qianfan",
    url: "https://cloud.baidu.com/doc/qianfan-api/s/8m7u6un8a",
    apiKeyName: "baidu_qianfan_key",
    promptMaxLength: 220,
    children: [
      { label: "ERNIE Image Turbo (最新)", value: "ernie-image-turbo", price: "以官方账单为准", promptMaxLength: 220, promptSupportLang: "中文、英文" },
      { label: "irag-1.0", value: "irag-1.0", price: "0.14元/张", promptMaxLength: 220, promptSupportLang: "中文、英文" },
      { label: "flux.1-schnell", value: "flux.1-schnell", price: "0.002元/张", promptMaxLength: 512, promptSupportLang: "英文" },
    ],
  },
  DOUBAO_MODEL,
  {
    name: "Minimax AI",
    value: "minimax",
    url: "https://platform.minimax.cn/docs/api-reference/image-generation-t2i",
    apiKeyName: "minimax_key",
    promptMaxLength: 1500,
    promptSupportLang: "中文、英文",
    negativePromptSupport: false,
    children: [
      { label: "Image-01 Live (最新)", value: "image-01-live", price: "以官方账单为准", promptMaxLength: 1500, promptSupportLang: "中文、英文" },
      { label: "image-01", value: "image-01", price: "以官方账单为准", promptMaxLength: 1500, promptSupportLang: "中文、英文" },
    ],
  },
  {
    name: "Google Gemini",
    value: "gemini",
    url: "https://ai.google.dev/gemini-api/docs/image-generation",
    apiKeyName: "gemini_key",
    promptMaxLength: 8000,
    promptSupportLang: "英文、中文、日文、西班牙文、印地文",
    negativePromptSupport: false,
    children: [
      { label: "Nano Banana 2 Lite (最新)", value: "gemini-3.1-flash-lite-image", price: "按分辨率计费", promptMaxLength: 8000, promptSupportLang: "英文、中文、日文、西班牙文、印地文" },
      { label: "Nano Banana 2 (Gemini 3.1 Flash Image)", value: "gemini-3.1-flash-image", price: "按分辨率计费", promptMaxLength: 8000, promptSupportLang: "英文、中文、日文、西班牙文、印地文" },
      { label: "Nano Banana Pro (Gemini 3 Pro Image)", value: "gemini-3-pro-image", price: "按分辨率计费", promptMaxLength: 8000, promptSupportLang: "英文、中文、日文、西班牙文、印地文" },
      { label: "Gemini 2.5 Flash Image", value: "gemini-2.5-flash-image", price: "约$0.039/张", promptMaxLength: 8000, promptSupportLang: "英文、中文、日文、西班牙文、印地文" },
    ],
  },
  // 未来可添加更多平台
];

/**
 * 根据模型ID查找配置
 */
export function findModelConfig(modelId: string): ModelProviderConfig | null {
  return MODELS.find(p => 
    p.value === modelId || p.children?.some(sm => sm.value === modelId)
  ) || null;
}

/**
 * 根据模型ID查找子模型配置
 */
export function findSubModelConfig(modelId: string) {
  for (const provider of MODELS) {
    if (provider.children) {
      const subModel = provider.children.find(sm => sm.value === modelId);
      if (subModel) {
        return { provider, subModel };
      }
    }
  }
  return null;
}

/**
 * 检查模型是否支持负面提示词
 */
export function supportsNegativePrompt(modelId: string): boolean {
  const result = findSubModelConfig(modelId);
  if (result) {
    return result.subModel.negativePromptSupport ?? result.provider.negativePromptSupport ?? false;
  }
  return false;
}
