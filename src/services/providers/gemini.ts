/**
 * Google Gemini 图片生成提供者实现
 */

import { BaseModelProvider } from './base';
import { GenerateImageParams, ImageSize, ModelProviderConfig } from '../types';
import { getTimestamp, maskAPIKey, parseImageSize } from '../utils';

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

    // 解析图片尺寸，转换为 aspect_ratio 格式
    const { width, height } = parseImageSize(imageSize);
    const aspectRatio = this.getAspectRatio(width, height);

    // 构建请求体
    const requestBody: any = {
      contents: [{
        parts: [{
          text: prompt
        }]
      }]
    };

    // 如果有自定义宽高比，添加到 generationConfig 中
    if (aspectRatio && aspectRatio !== '1:1') {
      requestBody.generationConfig = {
        imageConfig: {
          aspectRatio: aspectRatio
        }
      };
    }

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
   * 根据官方文档：https://ai.google.dev/gemini-api/docs/image-generation
   */
  getSupportedSizes(model: string): ImageSize[] {
    // 安全检查：确保model是有效字符串
    if (!model || typeof model !== 'string') {
      return [{ width: 1024, height: 1024 }];
    }

    // Gemini 支持的宽高比和对应的分辨率
    return [
      { width: 1024, height: 1024 }, // 1:1
      { width: 832, height: 1248 },  // 2:3
      { width: 1248, height: 832 },  // 3:2
      { width: 864, height: 1184 },  // 3:4
      { width: 1184, height: 864 },  // 4:3
      { width: 896, height: 1152 },  // 4:5
      { width: 1152, height: 896 },  // 5:4
      { width: 768, height: 1344 },  // 9:16
      { width: 1344, height: 768 },  // 16:9
      { width: 1536, height: 672 },  // 21:9
    ];
  }

  /**
   * 将宽高转换为 aspect_ratio 格式
   * 根据官方文档中支持的宽高比
   */
  private getAspectRatio(width: number, height: number): string {
    const ratio = width / height;
    const tolerance = 0.05; // 5% 容差

    // 根据比例匹配对应的宽高比字符串
    const ratioMap: { [key: string]: number } = {
      '1:1': 1,
      '2:3': 2 / 3,
      '3:2': 3 / 2,
      '3:4': 3 / 4,
      '4:3': 4 / 3,
      '4:5': 4 / 5,
      '5:4': 5 / 4,
      '9:16': 9 / 16,
      '16:9': 16 / 9,
      '21:9': 21 / 9,
    };

    // 找到最接近的宽高比
    for (const [key, value] of Object.entries(ratioMap)) {
      if (Math.abs(ratio - value) < tolerance) {
        return key;
      }
    }

    // 默认返回 1:1
    return '1:1';
  }
}
