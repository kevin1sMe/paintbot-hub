/**
 * 阿里云通义万相V2模型提供者实现
 */

import { BaseModelProvider } from './base';
import { GenerateImageParams, ImageSize, ModelProviderConfig } from '../types';
import { getTimestamp, maskAPIKey } from '../utils';

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
    const url = "https://dashscope.aliyuncs.com/api/v1/services/aigc/text2image/image-synthesis";

    // 请求体
    const requestBody: Record<string, unknown> = {
      model: model,
      input: {
        prompt: prompt,
      },
      parameters: {
        size: imageSize,
        n: 1
      }
    };

    // 如果提供了负面提示词，则添加到请求体中
    if (negativePrompt) {
      requestBody.input.negative_prompt = negativePrompt;
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
          "X-DashScope-Async": "enable",
          "Authorization": `Bearer ${maskAPIKey(apiKey)}`,
        },
        body: requestBody,
      },
    });

    try {
      // 第一步：创建任务
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-DashScope-Async": "enable",
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

      const taskData = await response.json();
      
      // 记录任务创建响应
      addLog({
        timestamp: getTimestamp(),
        type: "response",
        data: taskData,
      });
      
      if (!taskData.output?.task_id) {
        throw new Error("未获取到任务ID");
      }
      
      // 获取任务ID
      const taskId = taskData.output.task_id;
      
      // 轮询任务状态
      let taskResult;
      let retry = 0;
      const maxRetry = 30; // 最多轮询30次
      const taskUrl = `${url}/tasks/${taskId}`;
      
      while (retry < maxRetry) {
        await new Promise(resolve => setTimeout(resolve, 1000)); // 等待1秒
        
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
        if (taskResult.output?.task_status === "FAILED") {
          throw new Error(`任务处理失败: ${JSON.stringify(taskResult.output)}`);
        }
        
        retry++;
      }
      
      if (!taskResult || taskResult.output?.task_status !== "SUCCEEDED") {
        throw new Error("任务超时或未完成");
      }
      
      // 获取图片URL
      const imgUrl = taskResult.output?.results?.[0]?.url;
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