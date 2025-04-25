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
    promptMaxLength: 9999, // 智谱AI默认提示词长度限制较大
    children: [
      { label: "CogView-4-250304", value: "cogview-4-250304", price: "0.06元/张", promptMaxLength: 9999 },
      { label: "CogView-4", value: "cogview-4", price: "0.06元/次", promptMaxLength: 9999 },
      { label: "CogView-3-Flash", value: "cogview-3-flash", price: "免费", promptMaxLength: 9999 },
      { label: "CogView-3", value: "cogview-3", price: "免费", promptMaxLength: 9999 },
    ],
  },
  {
    name: "OpenAI 文生图",
    value: "openai",
    url: "https://platform.openai.com/docs/api-reference/images",
    apiKeyName: "openai_key",
    promptMaxLength: 4000, // OpenAI DALL·E 3提示词长度限制更新为4000字符
    promptSupportLang: "中文、英文",
    negativePromptSupport: false,
    children: [
      { label: "GPT-Image-1 (高质量)", value: "gpt-image-1-high", price: "$0.167-0.25/张", promptMaxLength: 32000, promptSupportLang: "中文、英文" },
      { label: "GPT-Image-1 (中质量)", value: "gpt-image-1-medium", price: "$0.042-0.063/张", promptMaxLength: 32000, promptSupportLang: "中文、英文" },
      { label: "GPT-Image-1 (低质量)", value: "gpt-image-1-low", price: "$0.011-0.016/张", promptMaxLength: 32000, promptSupportLang: "中文、英文" },
      { label: "DALL·E 3 (高清质量)", value: "dall-e-3-hd", price: "$0.08-0.12/张", promptMaxLength: 4000, promptSupportLang: "中文、英文" },
      { label: "DALL·E 3 (标准质量)", value: "dall-e-3-standard", price: "$0.04-0.08/张", promptMaxLength: 4000, promptSupportLang: "中文、英文" },
      { label: "DALL·E 2", value: "dall-e-2", price: "$0.016-0.02/张", promptMaxLength: 1000, promptSupportLang: "中文、英文" },
    ],
  },
  {
    name: "阿里云通义万相V2",
    value: "wanx2",
    url: "https://help.aliyun.com/zh/model-studio/text-to-image-v2-api-reference",
    apiKeyName: "aliyun_wanx_key",
    promptMaxLength: 800, // 阿里云通义万相提示词长度限制为800字符
    negativePromptSupport: true, // 支持反向提示词
    negativePromptMaxLength: 500, // 反向提示词最大500字符
    promptSupportLang: "中文、英文", 
    children: [
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
    promptMaxLength: 220, // 百度千帆默认提示词长度限制
    children: [
      { label: "irag-1.0", value: "irag-1.0", price: "0.14元/张", promptMaxLength: 220, promptSupportLang: "中文、英文" },
      { label: "flux.1-schnell", value: "flux.1-schnell", price: "0.14元/张", promptMaxLength: 512, promptSupportLang: "英文" },
    ],
  },
  DOUBAO_MODEL,
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