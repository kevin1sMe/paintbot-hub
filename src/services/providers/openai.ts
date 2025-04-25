/**
 * OpenAI 文生图模型提供者实现
 */

import { BaseModelProvider } from './base';
import { GenerateImageParams, ImageSize, ModelProviderConfig } from '../types';
import { getTimestamp, maskAPIKey, parseImageSize } from '../utils';

export class OpenAIProvider extends BaseModelProvider {
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
    const url = "https://api.openai.com/v1/images/generations";

    // 解析宽高
    const { width, height } = parseImageSize(imageSize);
    
    // 根据选择的模型确定实际API调用的模型
    let apiModel = "dall-e-3";
    let quality = "standard";
    let size = "1024x1024";
    let style = "vivid";
    
    // 请求体
    const requestBody: any = {
      model: "dall-e-3",
      prompt: prompt,
      n: 1,
      size: "1024x1024"
    };
    
    if (model.startsWith("gpt-image-1")) {
      // 使用GPT-Image-1模型
      apiModel = "gpt-image-1";
      
      // GPT-Image-1只支持 1024x1024, 1536x1024, 1024x1536 或 auto 这四种尺寸
      // 根据用户选择的尺寸和比例，选择合适的GPT-Image-1支持的尺寸
      const aspectRatio = width / height;
      
      if (Math.abs(aspectRatio - 1) < 0.1) {
        // 接近正方形，使用1024x1024
        size = "1024x1024";
      } else if (aspectRatio > 1) {
        // 横向，使用1536x1024
        size = "1536x1024";
      } else {
        // 纵向，使用1024x1536
        size = "1024x1536";
      }
      
      // 根据模型后缀确定质量
      if (model === "gpt-image-1-high") {
        quality = "high";
      } else if (model === "gpt-image-1-medium") {
        quality = "medium";
      } else if (model === "gpt-image-1-low") {
        quality = "low";
      } else {
        // 默认使用medium质量
        quality = "medium";
      }
      
      // 为GPT-Image-1模型设置请求体
      requestBody.model = apiModel;
      requestBody.size = size;
      if (quality) requestBody.quality = quality;
      // 注意：GPT-Image-1模型不支持response_format参数
    } else if (model.startsWith("dall-e-3")) {
      // DALL-E 3模型处理
      apiModel = "dall-e-3";
      
      // DALL-E 3只支持 1024x1024, 1792x1024, 1024x1792 这三种尺寸
      const aspectRatio = width / height;
      
      if (Math.abs(aspectRatio - 1) < 0.1) {
        // 接近正方形
        size = "1024x1024";
      } else if (aspectRatio > 1) {
        // 横向
        size = "1792x1024";
      } else {
        // 纵向
        size = "1024x1792";
      }
      
      // 确定图片质量级别
      quality = model === "dall-e-3-hd" ? "hd" : "standard";
      
      // 设置风格（vivid风格更生动，默认值）
      style = "vivid";
      
      // 为DALL-E 3模型设置请求体
      requestBody.model = apiModel;
      requestBody.size = size;
      requestBody.quality = quality;
      requestBody.style = style;
      requestBody.response_format = "url";
    } else if (model === "dall-e-2") {
      // DALL-E 2模型
      apiModel = "dall-e-2";
      
      // DALL-E 2只支持 256x256, 512x512, 1024x1024 三种尺寸
      // 根据用户选择的尺寸，找到最接近的DALL-E 2支持的尺寸
      if (Math.max(width, height) <= 256) {
        size = "256x256";
      } else if (Math.max(width, height) <= 512) {
        size = "512x512";
      } else {
        size = "1024x1024";
      }
      
      // 为DALL-E 2模型设置请求体
      requestBody.model = apiModel;
      requestBody.size = size;
      requestBody.response_format = "url";
    }

    // 记录请求
    addLog({
      timestamp: getTimestamp(),
      type: "request",
      data: {
        url,
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${maskAPIKey(apiKey)}`,
        },
        body: requestBody,
      },
    });

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`,
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
      return this.extractImageUrl(data);
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
    
    if (model.startsWith("gpt-image-1")) {
      // GPT-Image-1支持的尺寸
      return [
        { width: 1024, height: 1024 }, // 正方形
        { width: 1536, height: 1024 }, // 横向
        { width: 1024, height: 1536 }  // 纵向
      ];
    } else if (model.startsWith("dall-e-3")) {
      // DALL-E 3支持的尺寸
      return [
        { width: 1024, height: 1024 }, // 正方形
        { width: 1792, height: 1024 }, // 横向
        { width: 1024, height: 1792 }  // 纵向
      ];
    } else if (model === "dall-e-2") {
      // DALL-E 2支持的尺寸
      return [
        { width: 256, height: 256 },
        { width: 512, height: 512 },
        { width: 1024, height: 1024 }
      ];
    } else {
      // 默认支持的尺寸
      return [
        { width: 1024, height: 1024 }
      ];
    }
  }
} 