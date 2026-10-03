/**
 * 阿里云通义万相V2模型提供者实现
 */

import { BaseModelProvider } from './base';
import { GenerateImageParams, ImageSize, ModelProviderConfig } from '../types';
import { getTimestamp, maskAPIKey } from '../utils';
import { getEnvConfig } from '@/config/env';

export class WanxProvider extends BaseModelProvider {
  constructor(config: ModelProviderConfig) {
    super(config);
  }

  /**
   * 生成图像
   */
  async generateImage(params: GenerateImageParams): Promise<string> {
    const { prompt, model, imageSize, addLog, negativePrompt } = params;
    const apiKey = this.getApiKey();
    
    // API端点
    const baseUrl = (getEnvConfig().ALIYUN_WANX_BASE_URL || 'https://dashscope.aliyuncs.com/api/v1').replace(/\/+$/, '');
    const synchronous = model.startsWith('qwen-image') || model === 'z-image-turbo' || model.startsWith('wan2.7-image') || model === 'wan2.6-t2i';
    const interleave = model === 'wan2.6-image';
    const url = `${baseUrl}/services/aigc/${synchronous ? 'multimodal-generation/generation' : interleave ? 'image-generation/generation' : 'text2image/image-synthesis'}`;

    // 请求体
    const input: { prompt?: string; negative_prompt?: string; messages?: unknown[] } = synchronous || interleave
      ? { messages: [{ role: 'user', content: [{ text: prompt }] }] }
      : { prompt };
    const parameters: Record<string, unknown> = { size: imageSize.replace('x', '*') };
    if (model !== 'z-image-turbo') parameters.n = 1;
    if (interleave) {
      parameters.enable_interleave = true;
      parameters.max_images = 1;
    }
    const requestBody = {
      model: model,
      input,
      parameters,
    };

    // 如果提供了负面提示词，则添加到请求体中
    if (negativePrompt && (model.startsWith('qwen-image') || model === 'wan2.6-t2i')) {
      parameters.negative_prompt = negativePrompt;
    } else if (negativePrompt && !synchronous && !interleave) {
      input.negative_prompt = negativePrompt;
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    };
    if (!synchronous) headers['X-DashScope-Async'] = 'enable';

    // 记录请求
    addLog({
      timestamp: getTimestamp(),
      type: "request",
      data: {
        url,
        method: "POST",
        headers: {
          ...headers,
          "Authorization": `Bearer ${maskAPIKey(apiKey)}`,
        },
        body: requestBody,
      },
    });

    try {
      // 第一步：创建任务
      const response = await fetch(url, {
        method: "POST",
        headers,
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

      const taskData = await response.json();
      
      // 记录任务创建响应
      addLog({
        timestamp: getTimestamp(),
        type: "response",
        data: taskData,
      });
      
      if (synchronous) {
        const imgUrl = taskData.output?.choices?.[0]?.message?.content?.find((part: { image?: string }) => part.image)?.image;
        if (!imgUrl) throw new Error(taskData.message || '未获取到图片URL');
        return imgUrl;
      }

      if (!taskData.output?.task_id) {
        throw new Error("未获取到任务ID");
      }
      
      // 获取任务ID
      const taskId = taskData.output.task_id;
      
      // 轮询任务状态
      let taskResult;
      let retry = 0;
      const maxRetry = 120;
      const taskUrl = `${baseUrl}/tasks/${taskId}`;
      
      while (retry < maxRetry) {
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // 查询任务状态
        const taskResponse = await fetch(taskUrl, {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${apiKey}`,
          },
        });
        
        if (!taskResponse.ok) {
          const errorText = await taskResponse.text();
          addLog({
            timestamp: getTimestamp(),
            type: "error",
            data: {
              status: taskResponse.status,
              statusText: taskResponse.statusText,
              error: errorText,
            },
          });
          throw new Error(`查询任务失败: ${taskResponse.status} ${taskResponse.statusText} - ${errorText}`);
        }
        
        taskResult = await taskResponse.json();
        
        // 记录任务查询响应
        addLog({
          timestamp: getTimestamp(),
          type: "info",
          data: {
            taskId,
            status: taskResult.output?.task_status,
            result: taskResult,
          },
        });
        
        // 如果任务完成
        if (taskResult.output?.task_status === "SUCCEEDED") {
          break;
        }
        
        // 如果任务失败
        if (["FAILED", "CANCELED", "UNKNOWN"].includes(taskResult.output?.task_status)) {
          throw new Error(`任务处理失败: ${JSON.stringify(taskResult.output)}`);
        }
        
        retry++;
      }
      
      if (!taskResult || taskResult.output?.task_status !== "SUCCEEDED") {
        throw new Error("任务超时或未完成");
      }
      
      // 获取图片URL
      const imgUrl = taskResult.output?.results?.[0]?.url || taskResult.output?.choices?.[0]?.message?.content?.find((part: { image?: string }) => part.image)?.image;
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
    if (model.startsWith('qwen-image') && !/^qwen-image-(2\.|3\.)/.test(model)) {
      return [
        { width: 1328, height: 1328 },
        { width: 1664, height: 928 },
        { width: 928, height: 1664 },
        { width: 1472, height: 1104 },
        { width: 1104, height: 1472 },
      ];
    }
    if (model === 'wan2.6-t2i') {
      return [
        { width: 1280, height: 1280 },
        { width: 1696, height: 960 },
        { width: 960, height: 1696 },
        { width: 1472, height: 1104 },
        { width: 1104, height: 1472 },
      ];
    }
    if (model.startsWith('wan2.7-image') || /^qwen-image-(2\.|3\.)/.test(model)) {
      return [
        { width: 1024, height: 1024 },
        { width: 1536, height: 1024 },
        { width: 1024, height: 1536 },
        { width: 2048, height: 2048 },
        ...(model === 'wan2.7-image-pro' ? [{ width: 4096, height: 4096 }] : []),
      ];
    }
    if (model === 'wan2.6-image' || model === 'z-image-turbo') {
      return [
        { width: 1024, height: 1024 },
        { width: 1280, height: 720 },
        { width: 720, height: 1280 },
      ];
    }
    // 通义万相V2支持的尺寸
    return [
      { width: 512, height: 512 },
      { width: 768, height: 768 },
      { width: 1024, height: 1024 },
      { width: 720, height: 1280 },
      { width: 1280, height: 720 }
    ];
  }
}
