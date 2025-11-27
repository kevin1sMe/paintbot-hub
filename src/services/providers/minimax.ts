/**
 * Minimax AI模型提供者实现
 */

import { BaseModelProvider } from './base';
import { GenerateImageParams, ImageSize, ModelProviderConfig } from '../types';
import { getTimestamp, maskAPIKey, parseImageSize } from '../utils';

export class MinimaxProvider extends BaseModelProvider {
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
    const url = "https://api.minimax.io/v1/image_generation";

    // 解析图片尺寸，转换为aspect_ratio格式
    const { width, height } = parseImageSize(imageSize);
    const aspectRatio = this.getAspectRatio(width, height);

    // 请求体
    const requestBody = {
      model: model,
      prompt: prompt,
      aspect_ratio: aspectRatio,
      response_format: "url",
      n: 1,
      prompt_optimizer: true
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
      const imgUrl = data?.data?.image_urls?.[0];
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
    // 安全检查：确保model是有效字符串
    if (!model || typeof model !== 'string') {
      // 返回默认尺寸
      return [{ width: 1024, height: 1024 }];
    }
    
    // Minimax支持的尺寸
    return [
      { width: 1024, height: 1024 }, // 1:1
      { width: 1024, height: 768 },  // 4:3
      { width: 768, height: 1024 },  // 3:4
      { width: 1280, height: 720 },  // 16:9
      { width: 720, height: 1280 },  // 9:16
      { width: 1152, height: 896 },  // 9:7
      { width: 896, height: 1152 },  // 7:9
    ];
  }

  /**
   * 将宽高转换为aspect_ratio格式
   */
  private getAspectRatio(width: number, height: number): string {
    const ratio = width / height;
    
    if (Math.abs(ratio - 1) < 0.1) {
      return "1:1";
    } else if (Math.abs(ratio - 4/3) < 0.1) {
      return "4:3";
    } else if (Math.abs(ratio - 3/4) < 0.1) {
      return "3:4";
    } else if (Math.abs(ratio - 16/9) < 0.1) {
      return "16:9";
    } else if (Math.abs(ratio - 9/16) < 0.1) {
      return "9:16";
    } else if (Math.abs(ratio - 9/7) < 0.1) {
      return "9:7";
    } else if (Math.abs(ratio - 7/9) < 0.1) {
      return "7:9";
    } else {
      // 默认返回1:1
      return "1:1";
    }
  }
} 