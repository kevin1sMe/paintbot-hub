/**
 * 智谱AI CogView模型提供者实现
 */

import { BaseModelProvider } from './base';
import { GenerateImageParams, ImageSize, ModelProviderConfig } from '../types';
import { getTimestamp, maskAPIKey } from '../utils';

export class CogviewProvider extends BaseModelProvider {
  constructor(config: ModelProviderConfig) {
    super(config);
  }

  /**
   * 生成图像
   */
  async generateImage(params: GenerateImageParams): Promise<string> {
    const { prompt, model, imageSize, addLog, negativePrompt } = params;
    const apiKey = this.getApiKey();
    
    // 安全检查：确保model是有效字符串
    if (!model || typeof model !== 'string') {
      throw new Error("模型参数无效，请选择有效的模型");
    }
    
    // API端点
    const url = "https://open.bigmodel.cn/api/paas/v4/images/generations";

    // 请求体
    const requestBody = {
      model: model,
      prompt: prompt,
      n: 1,
      size: imageSize,
      response_format: "url",
      style: "vivid"
    };

    // 记录请求
    addLog({
      timestamp: getTimestamp(),
      type: "request",
      data: {
        url,
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${maskAPIKey(apiKey)}`,
        },
        body: requestBody,
      },
    });

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();

        // 记录错误
        addLog({
          timestamp: getTimestamp(),
          type: "error",
          data: {
            status: response.status,
            statusText: response.statusText,
            error: errorText,
          },
        });

        throw new Error(`API调用失败: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();

      // 记录响应
      addLog({
        timestamp: getTimestamp(),
        type: "response",
        data,
      });

      // 获取图片URL
      const imgUrl = data?.data?.[0]?.url;
      if (!imgUrl) throw new Error("未获取到图片URL");
      return imgUrl;
    } catch (error: any) {
      return this.handleApiError(error, addLog);
    }
  }

  /**
   * 获取支持的尺寸
   */
  getSupportedSizes(model: string): ImageSize[] {
    // 安全检查：确保model是有效字符串
    if (!model || typeof model !== 'string') {
      // 返回默认尺寸
      return [{ width: 1024, height: 1024 }];
    }
    
    // CogView默认支持的尺寸
    return [
      { width: 1024, height: 1024 }
    ];
  }
} 