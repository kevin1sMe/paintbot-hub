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
      { label: "GLM-Image (旗舰)", value: "glm-image", price: "0.1元/张", promptMaxLength: 9999, promptSupportLang: "中文、英文" },
      { label: "CogView-4-250304", value: "cogview-4-250304", price: "0.06元/张", promptMaxLength: 9999 },
      { label: "CogView-4", value: "cogview-4", price: "0.06元/张", promptMaxLength: 9999 },
      { label: "CogView-3-Flash", value: "cogview-3-flash", price: "免费", promptMaxLength: 9999 },
      { label: "CogView-3", value: "cogview-3", price: "免费", promptMaxLength: 9999 },
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
      { label: "GPT-Image-2 (最新)", value: "gpt-image-2", price: "低$0.006/中$0.053/高$0.211/张", promptMaxLength: 32000, promptSupportLang: "中文、英文" },
      { label: "GPT-Image-1.5", value: "gpt-image-1.5", price: "低$0.009-0.013/中$0.034-0.05/高$0.133-0.20/张", promptMaxLength: 32000, promptSupportLang: "中文、英文" },
      { label: "GPT-Image-1 (高质量)", value: "gpt-image-1-high", price: "$0.167-0.25/张", promptMaxLength: 32000, promptSupportLang: "中文、英文" },
      { label: "GPT-Image-1 (中质量)", value: "gpt-image-1-medium", price: "$0.042-0.063/张", promptMaxLength: 32000, promptSupportLang: "中文、英文" },
      { label: "GPT-Image-1 (低质量)", value: "gpt-image-1-low", price: "$0.011-0.016/张", promptMaxLength: 32000, promptSupportLang: "中文、英文" },
      { label: "DALL·E 3 (高清质量)", value: "dall-e-3-hd", price: "$0.08-0.12/张", promptMaxLength: 4000, promptSupportLang: "中文、英文" },
      { label: "DALL·E 3 (标准质量)", value: "dall-e-3-standard", price: "$0.04-0.08/张", promptMaxLength: 4000, promptSupportLang: "中文、英文" },
      { label: "DALL·E 2", value: "dall-e-2", price: "$0.016/$0.018/$0.02/张", promptMaxLength: 1000, promptSupportLang: "中文、英文" },
    ],
  },
  {
    name: "阿里云通义万相",
    value: "wanx",
    url: "https://help.aliyun.com/zh/model-studio/text-to-image-v2-api-reference",
    apiKeyName: "aliyun_wanx_key",
    promptMaxLength: 800,
    negativePromptSupport: true,
    negativePromptMaxLength: 500,
    promptSupportLang: "中文、英文",
    children: [
      { label: "wan2.6-t2i (推荐)", value: "wan2.6-t2i", price: "0.2元/张", promptMaxLength: 800, negativePromptSupport: true, promptSupportLang: "中文、英文" },
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
      { label: "ernie-image (推荐)", value: "ernie-image", price: "待定", promptMaxLength: 220, promptSupportLang: "中文、英文" },
      { label: "irag-1.0", value: "irag-1.0", price: "0.14元/张", promptMaxLength: 220, promptSupportLang: "中文、英文" },
      { label: "flux.1-schnell", value: "flux.1-schnell", price: "0.002元/张", promptMaxLength: 512, promptSupportLang: "英文" },
    ],
  },
  DOUBAO_MODEL,
  {
    name: "Minimax AI",
    value: "minimax",
    url: "https://www.minimax.io/platform/document",
    apiKeyName: "minimax_key",
    promptMaxLength: 2000, // Minimax提示词长度限制
    promptSupportLang: "中文、英文",
    negativePromptSupport: false,
    children: [
      { label: "image-01", value: "image-01", price: "$0.0035/张 (约¥0.025)", promptMaxLength: 2000, promptSupportLang: "中文、英文" },
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
      { label: "Nano Banana 2 (推荐)", value: "nano-banana-2", price: "$0.045-0.151/张（按分辨率）", promptMaxLength: 8000, promptSupportLang: "英文、中文、日文、西班牙文、印地文" },
      { label: "Nano Banana Pro", value: "nano-banana-pro", price: "$0.134/张(1K/2K)，$0.24/张(4K)", promptMaxLength: 8000, promptSupportLang: "英文、中文、日文、西班牙文、印地文" },
      { label: "Gemini 2.5 Flash Image", value: "gemini-2.5-flash-image", price: "约$0.039/张", promptMaxLength: 8000, promptSupportLang: "英文、中文、日文、西班牙文、印地文" },
      { label: "Gemini 3 Pro Image (Preview)", value: "gemini-3-pro-image-preview", price: "$0.134/张(1K/2K)，$0.24/张(4K)", promptMaxLength: 8000, promptSupportLang: "英文、中文、日文、西班牙文、印地文" },
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
    return result.subModel.negativePromptSupport || result.provider.negativePromptSupport || false;
  }
  return false;
} 
