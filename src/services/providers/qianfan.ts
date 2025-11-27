/**
 * 百度千帆文生图模型提供者实现
 */

import { BaseModelProvider } from './base';
import { GenerateImageParams, ImageSize, ModelProviderConfig } from '../types';
import { getTimestamp, maskAPIKey } from '../utils';

export class QianfanProvider extends BaseModelProvider {
  constructor(config: ModelProviderConfig) {
    super(config);
  }

  /**
   * 生成图像
   */
  async generateImage(params: GenerateImageParams): Promise<string> {
    const { prompt, model, imageSize, addLog } = params;
    const apiKey = this.getApiKey();
    
    // API端点
    const url = "https://qianfan.baidubce.com/v2/images/generations";
    
    // 请求体
    const requestBody = {
      model: model,
      prompt: prompt,
      size: imageSize
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

      // 获取图片URL（根据百度千帆API返回格式）
      const imgUrl = data?.data?.[0]?.url;
      if (!imgUrl) throw new Error("未获取到图片URL");
      return imgUrl;
    } catch (error: unknown) {
      return this.handleApiError(error, addLog);
    }
  }

  /**
   * 获取支持的尺寸
   */
  getSupportedSizes(model: string): ImageSize[] {
    if (model === "irag-1.0") {
      // irag-1.0支持的尺寸
      return [
        { width: 512, height: 512 },
        { width: 768, height: 768 },
        { width: 1024, height: 1024 }
      ];
    } else if (model === "flux.1-schnell") {
      // flux.1-schnell支持的尺寸
      return [
        { width: 512, height: 512 },
        { width: 768, height: 768 },
        { width: 1024, height: 1024 },
        { width: 512, height: 768 },
        { width: 768, height: 512 }
      ];
    } else {
      // 默认支持的尺寸
      return [
        { width: 1024, height: 1024 }
      ];
    }
  }
} 