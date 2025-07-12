/**
 * 模型提供者工厂
 * 创建和管理各种模型提供者实例
 */

import { ModelProvider, ProviderOptions } from '../types';
import { findModelConfig } from '../models';
import { BaseModelProvider, NotImplementedProvider } from './base';
import { CogviewProvider } from './cogview';
import { OpenAIProvider } from './openai';
import { WanxProvider } from './wanx';
import { QianfanProvider } from './qianfan';
import { DoubaoImgProvider } from './doubaoimg';
import { MinimaxProvider } from './minimax';

// 缓存实例，避免重复创建
const providerInstances = new Map<string, ModelProvider>();

/**
 * 获取提供者实例
 * 如果已经创建过，则返回缓存的实例
 */
export function getProvider(providerType: string, options: ProviderOptions = {}): ModelProvider {
  // 检查缓存
  if (providerInstances.has(providerType)) {
    return providerInstances.get(providerType)!;
  }

  // 查找配置
  const config = findModelConfig(providerType);
  if (!config) {
    throw new Error(`未找到提供商配置: ${providerType}`);
  }

  // 根据类型创建不同的提供者
  let provider: ModelProvider;

  switch (config.value) {
    case 'cogview':
      provider = new CogviewProvider(config);
      break;
    case 'openai':
      provider = new OpenAIProvider(config);
      break;
    case 'wanx2':
      // 假设阿里云通义万相V2正在开发中，但仍然创建实例以供UI展示
      provider = new WanxProvider(config);
      break;
    case 'qianfan':
      provider = new QianfanProvider(config);
      break;
    case 'doubaoimg':
      // 假设火山引擎豆包正在开发中，但仍然创建实例以供UI展示
      provider = new DoubaoImgProvider(config);
      break;
    case 'minimax':
      provider = new MinimaxProvider(config);
      break;
    default:
      // 对于未实现的提供者，返回通用实现
      provider = new NotImplementedProvider(config);
  }

  // 缓存实例
  providerInstances.set(providerType, provider);
  return provider;
}

/**
 * 根据模型ID获取合适的提供者
 */
export function getProviderByModel(modelId: string, options: ProviderOptions = {}): ModelProvider {
  // 根据模型ID前缀决定使用哪个提供者
  if (modelId.startsWith('cogview-')) {
    return getProvider('cogview', options);
  } else if (modelId.startsWith('gpt-image-1') || modelId.startsWith('dall-e-')) {
    return getProvider('openai', options);
  } else if (modelId.startsWith('wanx2')) {
    return getProvider('wanx2', options);
  } else if (modelId === 'irag-1.0' || modelId === 'flux.1-schnell') {
    return getProvider('qianfan', options);
  } else if (modelId.startsWith('doubaoimg-')) {
    return getProvider('doubaoimg', options);
  } else if (modelId === 'image-01') {
    return getProvider('minimax', options);
  } else {
    throw new Error(`不支持的模型: ${modelId}`);
  }
}

/**
 * 获取所有可用的提供者
 */
export function getAllProviders(options: ProviderOptions = {}): ModelProvider[] {
  return [
    getProvider('cogview', options),
    getProvider('openai', options),
    getProvider('wanx2', options),
    getProvider('qianfan', options),
    getProvider('doubaoimg', options),
    getProvider('minimax', options)
  ];
}

/**
 * 生成图像的统一入口
 */
export async function generateImage(params: {
  prompt: string;
  model: string;
  apiKey: string;
  imageSize: string;
  addLog: (entry: any) => void;
  negativePrompt?: string;
}): Promise<string> {
  const { model, addLog } = params;
  
  // 安全检查：确保model参数存在
  if (!model) {
    throw new Error("模型参数不能为空");
  }
  
  // 获取对应的提供者
  const provider = getProviderByModel(model, { addLog });
  
  // 调用提供者的生成方法
  return provider.generateImage(params);
} 