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

export class DoubaoImgProvider extends BaseModelProvider {
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
    if (model === 'doubaoimg-text2img-v2.1') {
      // 通用2.1模型
      requestBody.req_key = 'high_aes_general_v21_L';
      requestBody.req_schedule_conf = 'general_v20_9B_pe'; // 默认美感版
      requestBody.seed = -1;
      requestBody.scale = 3.5;
      requestBody.ddim_steps = 25;
      requestBody.use_pre_llm = true;
    } else if (model === 'doubaoimg-text2img-v2.0pro') {
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
    
    // 最大重试次数
    const maxRetries = 3;
    let retryCount = 0;
    
    while (retryCount <= maxRetries) {
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
        
        // 构建完整URL - 注意这里的格式
        const queryString = Object.entries(params2)
          .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
          .join('&');
        
        // 获取代理前缀
        const proxyPrefix = this.getApiProxy();
        // 目标API的URL (不带代理前缀)
        const targetUrl = `https://${host}?${queryString}`;
        
        // 根据不同代理类型构建完整URL
        let fullUrl;
        if (proxyPrefix.includes('allorigins.win')) {
          // AllOrigins需要完整URL作为参数
          fullUrl = `${proxyPrefix}${encodeURIComponent(targetUrl)}`;
        } else if (proxyPrefix.includes('corsproxy.io')) {
          // corsproxy.io需要编码URL作为参数
          fullUrl = `${proxyPrefix}${encodeURIComponent(targetUrl)}`;
        } else {
          // 标准代理(如cors-anywhere)直接拼接
          fullUrl = `${proxyPrefix}${targetUrl}`;
        }
        
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
            retryAttempt: retryCount > 0 ? retryCount : undefined
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
          
          // 特别处理401未授权错误
          if (response.status === 401) {
            console.error('认证失败 (401 Unauthorized):', {
              url: fullUrl,
              headers: headers,
              response: errorText
            });
            
            // 记录更详细的错误信息
            addLog({
              timestamp: getTimestamp(),
              type: "error",
              data: {
                status: response.status,
                statusText: response.statusText,
                error: errorText,
                requestDetails: {
                  headers: {
                    "Content-Type": "application/json",
                    "X-Date": headers['X-Date'],
                    "Authorization": headers['Authorization'].replace(accessKeyId, accessKeyId.substring(0, 4) + "..." + accessKeyId.substring(accessKeyId.length - 4)),
                    "X-Content-Sha256": headers['X-Content-Sha256']
                  },
                  url: fullUrl
                }
              },
            });
            
            // 如果还有重试机会，继续重试
            if (retryCount < maxRetries) {
              retryCount++;
              
              addLog({
                timestamp: getTimestamp(),
                type: "info",
                data: {
                  message: `认证失败，正在进行第${retryCount}次重试...`,
                }
              });
              
              // 等待一段时间后重试
              await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
              continue; // 继续下一次循环重试
            }
            
            throw new Error(`API认证失败 (401 Unauthorized): 请检查AccessKey和SecretKey是否正确。详细信息: ${errorText}`);
          }
          
          // 其他错误，如果是网络错误并且还有重试机会
          if (retryCount < maxRetries) {
            retryCount++;
            
            addLog({
              timestamp: getTimestamp(),
              type: "info",
              data: {
                message: `请求失败(${response.status})，正在进行第${retryCount}次重试...`,
              }
            });
            
            // 等待一段时间后重试
            await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
            continue; // 继续下一次循环重试
          }
          
          // 记录其他错误
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
        // 检查是否是网络错误，以及是否还有重试机会
        if (error.message === 'Failed to fetch' && retryCount < maxRetries) {
          retryCount++;
          
          addLog({
            timestamp: getTimestamp(),
            type: "info",
            data: {
              message: `网络请求失败，正在进行第${retryCount}次重试...`,
              originalError: error.message
            },
          });
          
          // 等待一段时间后重试，时间随重试次数增加
          await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
          continue; // 继续下一次循环重试
        }
        
        // 重试次数用完或非网络错误，直接抛出
        return this.handleApiError(error, addLog);
      }
    }
    
    // 这里实际不会执行到，因为最后的重试结果会在上面返回或抛出异常
    throw new Error("请求失败，已超过最大重试次数");
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
    
    // 根据火山引擎规范，规范头需要确保小写并按字典序排序
    const canonicalHeaders = [
      `content-type:${contentType}`,
      `host:${host}`,
      `x-content-sha256:${contentSha256}`,
      `x-date:${timestamp}`
    ].sort().join('\n') + '\n';
    
    // 确保签名头也是按字典序排序的
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
    const region = 'cn-north-1';
    const service = 'cv'; // 修正为正确的服务
    const credential = `${shortDate}/${region}/${service}/request`;
    
    const canonicalRequestHash = await computeSha256(canonicalRequest);
    const stringToSign = [
      algorithm,
      timestamp,
      credential,
      canonicalRequestHash
    ].join('\n');
    
    // 打印调试信息到控制台（正式环境可以去掉）
    console.log('Canonical Request:', canonicalRequest);
    console.log('String to Sign:', stringToSign);
    
    // 4. 计算签名
    const signature = await computeSignature(stringToSign, secretAccessKey, shortDate, region, service);
    
    // 5. 构建授权头
    const authorizationHeader = `${algorithm} Credential=${accessKeyId}/${credential}, SignedHeaders=${signedHeaders}, Signature=${signature}`;
    
    return {
      'X-Date': timestamp,
      'Authorization': authorizationHeader,
      'X-Content-Sha256': contentSha256,
      // 添加以下头部可能有助于解决CORS问题，但主要应该在服务器端处理
      'Origin': window.location.origin
    };
  }

  /**
   * 获取API代理URL
   * 用户可以通过localStorage设置自定义代理
   */
  private getApiProxy(): string {
    // 获取用户自定义代理URL，如果有的话
    const customProxy = localStorage.getItem('doubaoimg_proxy');
    if (customProxy) {
      return customProxy;
    }
    
    // 确定是否使用CORS代理（仅在开发环境中）
    const isDevEnvironment = process.env.NODE_ENV === 'development';
    if (!isDevEnvironment) {
      return '';
    }
    
    // 几个可用的CORS代理选项
    const corsProxies = [
      'https://cors-anywhere.herokuapp.com/', // 需要先访问 https://cors-anywhere.herokuapp.com/corsdemo 激活
      'https://api.allorigins.win/raw?url=',  // 备选代理1
      'https://corsproxy.io/?'                // 备选代理2
    ];
    
    // 默认使用第一个代理
    const selectedProxy = localStorage.getItem('doubaoimg_selected_proxy') || '0';
    const proxyIndex = parseInt(selectedProxy, 10);
    
    if (proxyIndex === 0) {
      // 如果使用cors-anywhere，添加控制台提示
      console.info('使用CORS Anywhere代理。如果遇到403错误，请先访问 https://cors-anywhere.herokuapp.com/corsdemo 激活临时访问权限');
    }
    
    return corsProxies[proxyIndex] || corsProxies[0];
  }

  /**
   * 设置要使用的CORS代理
   * @param proxyIndex 代理索引 (0: cors-anywhere, 1: allorigins, 2: corsproxy.io)
   */
  setCorsProxy(proxyIndex: number): void {
    localStorage.setItem('doubaoimg_selected_proxy', proxyIndex.toString());
    const proxies = [
      'CORS Anywhere (需先访问 https://cors-anywhere.herokuapp.com/corsdemo 激活)',
      'AllOrigins',
      'corsproxy.io'
    ];
    console.info(`已切换到CORS代理: ${proxies[proxyIndex] || '未知代理'}`);
  }

  /**
   * 设置自定义代理URL
   * @param proxyUrl 完整的代理URL，如 https://your-proxy.com/
   */
  setCustomCorsProxy(proxyUrl: string): void {
    localStorage.setItem('doubaoimg_proxy', proxyUrl);
    console.info(`已设置自定义代理: ${proxyUrl}`);
  }

  /**
   * 清除所有代理设置，恢复默认
   */
  clearCorsProxy(): void {
    localStorage.removeItem('doubaoimg_proxy');
    localStorage.removeItem('doubaoimg_selected_proxy');
    console.info('已清除所有代理设置，恢复默认');
  }
} 