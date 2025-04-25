/**
 * 火山引擎豆包文生图模型提供者实现
 */

import { BaseModelProvider } from './base';
import { GenerateImageParams, ImageSize, ModelProviderConfig } from '../types';
import { 
  getTimestamp, 
  maskAPIKey, 
  parseImageSize,
  computeSha256,
  computeSignature
} from '../utils';

export class DoubaImgProvider extends BaseModelProvider {
  constructor(config: ModelProviderConfig) {
    super(config);
  }

  /**
   * 生成图像
   */
  async generateImage(params: GenerateImageParams): Promise<string> {
    const { prompt, model, imageSize, addLog, negativePrompt } = params;
    const apiKey = this.getApiKey();
    
    // 解析API密钥（格式：accessKeyId:secretAccessKey）
    const [accessKeyId, secretAccessKey] = apiKey.split(':');
    if (!accessKeyId || !secretAccessKey) {
      throw new Error('API密钥格式错误，请使用 AccessKeyId:SecretAccessKey 格式');
    }
    
    // API端点 - 使用标准volcengineapi端点
    const host = 'visual.volcengineapi.com';
    const path = '/';
    const url = `https://${host}${path}`;
    
    // 解析宽高
    const { width, height } = parseImageSize(imageSize);
    
    // 构建请求体 - 根据不同版本的API设置不同的参数
    const requestBody: any = {
      width: width || 512,
      height: height || 512,
      prompt: prompt,
      return_url: true,
      use_sr: true
    };
    
    // 如果提供了负面提示词，则添加到请求体中
    if (negativePrompt) {
      requestBody.negative_prompt = negativePrompt;
    }
    
    // 根据模型ID选择合适的参数
    if (model === 'doubaimg-text2img-v2.1') {
      // 通用2.1模型
      requestBody.req_key = 'high_aes_general_v21_L';
      requestBody.req_schedule_conf = 'general_v20_9B_pe'; // 默认美感版
      requestBody.seed = -1;
      requestBody.scale = 3.5;
      requestBody.ddim_steps = 25;
      requestBody.use_pre_llm = true;
    } else if (model === 'doubaimg-text2img-v2.0pro') {
      // 通用2.0Pro模型
      requestBody.req_key = 'high_aes_general_v20_L';
      requestBody.req_schedule_conf = 'general_v20_9B_pe'; // 默认美感版
      requestBody.seed = -1;
      requestBody.scale = 3.5;
      requestBody.ddim_steps = 16;
      requestBody.use_pre_llm = true;
    } else {
      // 通用2.0模型 (默认)
      requestBody.req_key = 'high_aes_general_v20';
      requestBody.seed = -1;
      requestBody.scale = 3.5;
      requestBody.ddim_steps = 16;
      requestBody.use_rephraser = true;
    }
    
    // 添加水印信息(默认不添加)
    requestBody.logo_info = {
      add_logo: false,
      position: 0,
      language: 0,
      opacity: 0.3
    };
    
    const bodyString = JSON.stringify(requestBody);
    
    // 请求参数
    const params2 = {
      Action: 'CVProcess',
      Version: '2022-08-31'
    };
    
    try {
      // 生成签名
      const headers = await this.generateVolcengineSignature(
        accessKeyId,
        secretAccessKey,
        host,
        path,
        params2,
        bodyString
      );
      
      // 构建完整URL
      const queryString = Object.entries(params2)
        .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
        .join('&');
      const fullUrl = `${url}?${queryString}`;
      
      // 记录请求
      addLog({
        timestamp: getTimestamp(),
        type: "request",
        data: {
          url: fullUrl,
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Date": headers['X-Date'],
            "Authorization": headers['Authorization'].replace(accessKeyId, accessKeyId.substring(0, 4) + "..." + accessKeyId.substring(accessKeyId.length - 4)),
            "X-Content-Sha256": headers['X-Content-Sha256']
          },
          body: requestBody,
        },
      });
      
      // 发送请求
      const response = await fetch(fullUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...headers
        },
        body: bodyString,
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
      
      // 检查响应状态码
      if (data.code !== 10000) {
        throw new Error(`API调用返回错误: ${data.code} - ${data.message || "未知错误"}`);
      }
      
      // 获取图片数据
      // 根据请求参数中设置的return_url，返回的是url形式
      const imageUrl = data?.data?.image_urls?.[0];
      if (imageUrl) {
        return imageUrl;
      }
      
      // 处理base64情况的返回
      const base64Data = data?.data?.binary_data_base64?.[0];
      if (!base64Data) throw new Error("未获取到图片数据");
      
      // 创建Blob并生成临时URL
      const byteCharacters = atob(base64Data);
      const byteNumbers = new Array(byteCharacters.length);
      
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'image/jpeg' });
      
      return URL.createObjectURL(blob);
    } catch (error: any) {
      return this.handleApiError(error, addLog);
    }
  }

  /**
   * 获取支持的尺寸
   */
  getSupportedSizes(model: string): ImageSize[] {
    // 豆包文生图支持的尺寸
    return [
      { width: 512, height: 512 },
      { width: 768, height: 768 },
      { width: 512, height: 768 },
      { width: 768, height: 512 }
    ];
  }

  /**
   * 生成火山引擎豆包API签名
   */
  private async generateVolcengineSignature(
    accessKeyId: string, 
    secretAccessKey: string, 
    host: string, 
    path: string, 
    params: Record<string, string>, 
    body: string = ''
  ): Promise<Record<string, string>> {
    // 1. 准备签名所需参数
    const date = new Date();
    
    // 使用Date对象的方法直接格式化时间戳为YYYYMMDD'T'HHMMSS'Z'格式
    const year = date.getUTCFullYear();
    const month = (date.getUTCMonth() + 1).toString().padStart(2, '0');
    const day = date.getUTCDate().toString().padStart(2, '0');
    const hours = date.getUTCHours().toString().padStart(2, '0');
    const minutes = date.getUTCMinutes().toString().padStart(2, '0');
    const seconds = date.getUTCSeconds().toString().padStart(2, '0');
    
    const timestamp = `${year}${month}${day}T${hours}${minutes}${seconds}Z`;
    const shortDate = `${year}${month}${day}`;
    
    // 2. 创建规范请求
    const method = 'POST';
    const queryString = Object.entries(params)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
      .join('&');
    
    const contentType = 'application/json';
    const contentSha256 = await computeSha256(body);
    
    const canonicalHeaders = [
      `content-type:${contentType}`,
      `host:${host}`,
      `x-content-sha256:${contentSha256}`,
      `x-date:${timestamp}`
    ].join('\n') + '\n';
    
    const signedHeaders = 'content-type;host;x-content-sha256;x-date';
    
    const canonicalRequest = [
      method,
      path,
      queryString,
      canonicalHeaders,
      signedHeaders,
      contentSha256
    ].join('\n');
    
    // 3. 创建待签名字符串
    const algorithm = 'HMAC-SHA256';
    const region = 'cn-north-1'; // 修正为正确的区域
    const service = 'cv'; // 修正为正确的服务
    const credential = `${accessKeyId}/${shortDate}/${region}/${service}/request`;
    
    const canonicalRequestHash = await computeSha256(canonicalRequest);
    const stringToSign = [
      algorithm,
      timestamp,
      credential,
      canonicalRequestHash
    ].join('\n');
    
    // 4. 计算签名
    const signature = await computeSignature(stringToSign, secretAccessKey, shortDate, region, service);
    
    // 5. 构建授权头
    const authorizationHeader = `${algorithm} Credential=${credential}, SignedHeaders=${signedHeaders}, Signature=${signature}`;
    
    return {
      'X-Date': timestamp,
      'Authorization': authorizationHeader,
      'X-Content-Sha256': contentSha256
    };
  }
} 