/**
 * Google Gemini 图片生成提供者实现
 */

import { BaseModelProvider } from './base';
import { GenerateImageParams, ImageSize, ModelProviderConfig } from '../types';
import { getTimestamp, maskAPIKey } from '../utils';

export class GeminiProvider extends BaseModelProvider {
  constructor(config: ModelProviderConfig) {
    super(config);
  }

  /**
   * 生成图像
   */
  async generateImage(params: GenerateImageParams): Promise<string> {
    const { prompt, model, imageSize, addLog } = params;
    const apiKey = this.getApiKey();

    // 安全检查：确保model是有效字符串
    if (!model || typeof model !== 'string') {
      throw new Error("模型参数无效，请选择有效的模型");
    }

    // API端点
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    // 构建请求体（Gemini 图片生成 API 暂不支持自定义尺寸参数）
    const requestBody = {
      contents: [{
        parts: [{
          text: prompt
        }]
      }]
    };

    // 记录请求（隐藏API key）
    addLog({
      timestamp: getTimestamp(),
      type: "request",
      data: {
        url: url.replace(apiKey, maskAPIKey(apiKey)),
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: requestBody,
      },
    });

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
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

      // 提取图片数据
      const imgData = data?.candidates?.[0]?.content?.parts?.[0]?.inlineData;
      if (!imgData || !imgData.data) {
        throw new Error("未获取到图片数据");
      }

      // 转换为 base64 data URL
      const mimeType = imgData.mimeType || 'image/png';
      return `data:${mimeType};base64,${imgData.data}`;
    } catch (error) {
      return this.handleApiError(error, addLog);
    }
  }

  /**
   * 获取支持的尺寸
   * 注意：Gemini 图片生成 API 目前不支持自定义尺寸，生成的图片为默认尺寸
   */
  getSupportedSizes(model: string): ImageSize[] {
    // 安全检查：确保model是有效字符串
    if (!model || typeof model !== 'string') {
      return [{ width: 1024, height: 1024 }];
    }

    // Gemini 生成固定尺寸的图片，这里仅返回一个默认选项
    return [
      { width: 1024, height: 1024 }, // 默认尺寸
    ];
  }
}
