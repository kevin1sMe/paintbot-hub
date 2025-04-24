/**
 * 服务索引文件
 */

// 定义模型列表
const MODELS = [
  {
    name: "智谱AI CogView",
    value: "cogview",
    url: "https://bigmodel.cn/dev/howuse/cogview",
    apiKeyName: "zhipuai_key",
    promptMaxLength: 9999, // 智谱AI默认提示词长度限制较大
    children: [
      { label: "CogView-4-250304", value: "cogview-4-250304", price: "0.06元/张", promptMaxLength: 9999 },
      { label: "CogView-4", value: "cogview-4", price: "0.06元/次", promptMaxLength: 9999 },
      { label: "CogView-3-Flash", value: "cogview-3-flash", price: "免费", promptMaxLength: 9999 },
      { label: "CogView-3", value: "cogview-3", price: "免费", promptMaxLength: 9999 },
    ],
  },
  {
    name: "OpenAI 文生图",
    value: "openai",
    url: "https://platform.openai.com/docs/api-reference/images",
    apiKeyName: "openai_key",
    promptMaxLength: 4000, // OpenAI DALL·E 3提示词长度限制更新为4000字符
    promptSupportLang: "中文、英文",
    negativePromptSupport: false,
    children: [
      { label: "GPT-Image-1 (高质量)", value: "gpt-image-1-high", price: "$0.167-0.25/张", promptMaxLength: 32000, promptSupportLang: "中文、英文" },
      { label: "GPT-Image-1 (中质量)", value: "gpt-image-1-medium", price: "$0.042-0.063/张", promptMaxLength: 32000, promptSupportLang: "中文、英文" },
      { label: "GPT-Image-1 (低质量)", value: "gpt-image-1-low", price: "$0.011-0.016/张", promptMaxLength: 32000, promptSupportLang: "中文、英文" },
      { label: "DALL·E 3 (高清质量)", value: "dall-e-3-hd", price: "$0.08-0.12/张", promptMaxLength: 4000, promptSupportLang: "中文、英文" },
      { label: "DALL·E 3 (标准质量)", value: "dall-e-3-standard", price: "$0.04-0.08/张", promptMaxLength: 4000, promptSupportLang: "中文、英文" },
      { label: "DALL·E 2", value: "dall-e-2", price: "$0.016-0.02/张", promptMaxLength: 1000, promptSupportLang: "中文、英文" },
    ],
  },
  {
    name: "阿里云通义万相V2",
    value: "wanx2",
    url: "https://help.aliyun.com/zh/model-studio/text-to-image-v2-api-reference",
    apiKeyName: "aliyun_wanx_key",
    promptMaxLength: 800, // 阿里云通义万相提示词长度限制为800字符
    negativePromptSupport: true, // 支持反向提示词
    negativePromptMaxLength: 500, // 反向提示词最大500字符
    promptSupportLang: "中文、英文", 
    children: [
      { label: "wanx2.1-t2i-turbo", value: "wanx2.1-t2i-turbo", price: "0.14元/张", promptMaxLength: 800, negativePromptSupport: true, promptSupportLang: "中文、英文" },
      { label: "wanx2.1-t2i-plus", value: "wanx2.1-t2i-plus", price: "0.20元/张", promptMaxLength: 800, negativePromptSupport: true, promptSupportLang: "中文、英文" },
      { label: "wanx2.0-t2i-turbo", value: "wanx2.0-t2i-turbo", price: "0.04元/张", promptMaxLength: 800, negativePromptSupport: true, promptSupportLang: "中文、英文" },
    ],
  },
  {
    name: "百度千帆",
    value: "qianfan",
    url: "https://cloud.baidu.com/doc/qianfan-api/s/8m7u6un8a",
    apiKeyName: "baidu_qianfan_key",
    promptMaxLength: 220, // 百度千帆默认提示词长度限制
    children: [
      { label: "irag-1.0", value: "irag-1.0", price: "0.14元/张", promptMaxLength: 220, promptSupportLang: "中文、英文" },
      { label: "flux.1-schnell", value: "flux.1-schnell", price: "0.14元/张", promptMaxLength: 512, promptSupportLang: "英文" },
    ],
  },
  {
    name: "火山引擎豆包",
    value: "doubaimg",
    url: "https://www.volcengine.com/docs/6791/1366783",
    apiKeyName: "volcengine_key",
    promptMaxLength: 500, // 豆包文生图提示词长度限制
    negativePromptSupport: true, // 支持反向提示词
    negativePromptMaxLength: 500, // 反向提示词最大长度
    promptSupportLang: "中文、英文",
    children: [
      { label: "通用2.1-文生图", value: "doubaimg-text2img-v2.1", price: "待定", promptMaxLength: 500, negativePromptSupport: true, promptSupportLang: "中文、英文" },
      { label: "通用2.0Pro-文生图", value: "doubaimg-text2img-v2.0pro", price: "待定", promptMaxLength: 500, negativePromptSupport: true, promptSupportLang: "中文、英文" },
      { label: "通用2.0-文生图", value: "doubaimg-text2img-v2.0", price: "待定", promptMaxLength: 500, negativePromptSupport: true, promptSupportLang: "中文、英文" }
    ],
  },
  // 未来可添加更多平台
];

// 导出模型列表以便其他组件使用
export { MODELS };

// API日志类型定义
export interface LogEntry {
  timestamp: string;
  type: "request" | "response" | "error" | "info";
  data: any;
}

// 历史记录条目类型
export interface HistoryEntry {
  prompt: string;
  imgUrl: string;
  model: string;
  time: string;
  size: string;
  imageCount?: number;
  allImages?: string[];
}

// 历史记录本地存储相关常量和方法
const HISTORY_STORAGE_KEY = 'image_generation_history';
const MAX_HISTORY_TO_STORE = 50; // 最多存储的历史记录数量

// 保存历史记录到本地存储
export function saveHistoryToLocalStorage(historyEntries: HistoryEntry[]) {
  try {
    // 只保存有限数量的历史记录以避免存储过大
    const historyToSave = historyEntries.slice(0, MAX_HISTORY_TO_STORE);
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(historyToSave));
  } catch (error) {
    console.error('保存历史记录到本地存储失败:', error);
  }
}

// 从本地存储加载历史记录
export function loadHistoryFromLocalStorage(): HistoryEntry[] {
  try {
    const storedHistory = localStorage.getItem(HISTORY_STORAGE_KEY);
    if (storedHistory) {
      return JSON.parse(storedHistory);
    }
  } catch (error) {
    console.error('从本地存储加载历史记录失败:', error);
  }
  return [];
}

// 日志本地存储相关常量和方法
const LOG_STORAGE_KEY = 'api_logs_history';
const MAX_LOGS_TO_STORE = 100; // 最多存储的日志数量

// 保存日志到本地存储
export function saveLogsToLocalStorage(logs: LogEntry[]) {
  try {
    // 只保存有限数量的日志以避免存储过大
    const logsToSave = logs.slice(-MAX_LOGS_TO_STORE);
    localStorage.setItem(LOG_STORAGE_KEY, JSON.stringify(logsToSave));
  } catch (error) {
    console.error('保存日志到本地存储失败:', error);
  }
}

// 从本地存储加载日志
export function loadLogsFromLocalStorage(): LogEntry[] {
  try {
    const storedLogs = localStorage.getItem(LOG_STORAGE_KEY);
    if (storedLogs) {
      return JSON.parse(storedLogs);
    }
  } catch (error) {
    console.error('从本地存储加载日志失败:', error);
  }
  return [];
}

// 获取时间戳
export function getTimestamp() {
  return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });
}

// API提供商接口
export interface ApiProvider {
  name: string;
  value: string;
  apiKeyName: string;
  url: string;
  promptMaxLength?: number; // 添加提示词长度限制属性
  negativePromptSupport?: boolean; // 是否支持负面提示词
  negativePromptMaxLength?: number; // 负面提示词长度限制
  getApiKey: () => string;
  setApiKey: (key: string) => void;
  fetchImage: (prompt: string, model: string, apiKey: string, imageSize: string, addLog: (entry: LogEntry) => void, negativePrompt?: string) => Promise<string>;
}

// 获取API密钥
export function getAPIKey(provider = 'zhipuai_key') {
  return localStorage.getItem(provider) || "";
}

// 设置API密钥
export function setAPIKey(key: string, provider = 'zhipuai_key') {
  localStorage.setItem(provider, key);
}

// 智谱AI CogView API调用
export async function fetchCogviewImage(prompt: string, model: string, apiKey: string, imageSize: string, addLog: (entry: LogEntry) => void): Promise<string> {
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
        Authorization: `Bearer ${apiKey ? apiKey.substring(0, 4) + "..." + apiKey.substring(apiKey.length - 4) : ""}`,
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
    // 已经在上面记录了HTTP错误，这里捕获其他错误
    if (!error.message?.includes("API调用失败")) {
      addLog({
        timestamp: getTimestamp(),
        type: "error",
        data: {
          message: error.message,
          stack: error.stack,
        },
      });
    }
    throw error;
  }
}

// 阿里云通义万相V2 API调用
export async function fetchWanx2Image(prompt: string, model: string, apiKey: string, imageSize: string, addLog: (entry: LogEntry) => void, negativePrompt?: string): Promise<string> {
  // API端点
  const url = "https://dashscope.aliyuncs.com/api/v1/services/aigc/text2image/image-synthesis";

  // 解析宽高
  const [width, height] = imageSize.split('x').map(Number);
  
  // 请求体
  const requestBody: any = {
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
        "Authorization": `Bearer ${apiKey ? apiKey.substring(0, 4) + "..." + apiKey.substring(apiKey.length - 4) : ""}`,
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
  } catch (error: any) {
    // 已经在上面记录了HTTP错误，这里捕获其他错误
    if (!error.message?.includes("API调用失败") && !error.message?.includes("查询任务失败")) {
      addLog({
        timestamp: getTimestamp(),
        type: "error",
        data: {
          message: error.message,
          stack: error.stack,
        },
      });
    }
    throw error;
  }
}

// 百度千帆 API调用
export async function fetchQianfanImage(prompt: string, model: string, apiKey: string, imageSize: string, addLog: (entry: LogEntry) => void): Promise<string> {
  // API端点
  const url = "https://qianfan.baidubce.com/v2/images/generations";
  
  // 解析宽高 (确保格式为 宽x高)
  const [width, height] = imageSize.split('x').map(Number);
  
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
        Authorization: `Bearer ${apiKey ? apiKey.substring(0, 4) + "..." + apiKey.substring(apiKey.length - 4) : ""}`,
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
  } catch (error: any) {
    // 已经在上面记录了HTTP错误，这里捕获其他错误
    if (!error.message?.includes("API调用失败")) {
      addLog({
        timestamp: getTimestamp(),
        type: "error",
        data: {
          message: error.message,
          stack: error.stack,
        },
      });
    }
    throw error;
  }
}

// 火山引擎豆包API签名函数
export async function generateVolcengineSignature(accessKeyId: string, secretAccessKey: string, host: string, path: string, params: Record<string, string>, body: string = '') {
  // 1. 准备签名所需参数
  const date = new Date();
  const timestamp = date.toISOString().replace(/\.\d{3}Z$/, 'Z');
  const shortDate = timestamp.split('T')[0].replace(/-/g, '');
  
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
  const region = 'cn-beijing';
  const service = 'visual';
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

// 辅助函数：计算SHA-256哈希
async function computeSha256(message: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  return hexEncode(hashBuffer);
}

// 辅助函数：生成HMAC签名
async function computeHmac(key: ArrayBuffer, message: string): Promise<ArrayBuffer> {
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    key,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  return crypto.subtle.sign(
    'HMAC',
    cryptoKey,
    new TextEncoder().encode(message)
  );
}

// 辅助函数：计算最终签名
async function computeSignature(stringToSign: string, secretKey: string, date: string, region: string, service: string): Promise<string> {
  const kSecret = new TextEncoder().encode(`HMAC-SHA256${secretKey}`);
  const kDate = await computeHmac(kSecret, date);
  const kRegion = await computeHmac(kDate, region);
  const kService = await computeHmac(kRegion, service);
  const kSigning = await computeHmac(kService, "request");
  const signature = await computeHmac(kSigning, stringToSign);
  return hexEncode(signature);
}

// 辅助函数：将ArrayBuffer转换为十六进制字符串
function hexEncode(arrayBuffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(arrayBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

// 测试火山引擎豆包签名和API调用（仅供开发测试使用）
export async function testVolcengineAPI(accessKeyId: string, secretAccessKey: string, prompt: string) {
  try {
    const host = 'visual.volces.com';
    const path = '/v1/image/text_to_image';
    const params = {
      Action: 'TextToImage',
      Version: '2022-08-31'
    };
    
    const requestBody = {
      req_key: new Date().getTime().toString(),
      style: 'general_2.1',  // 默认使用通用2.1版本
      prompt: prompt,
      width: 512,
      height: 512,
      n: 1,
      return_type: 'base64'
    };
    
    const bodyString = JSON.stringify(requestBody);
    
    console.log('生成签名中...');
    const headers = await generateVolcengineSignature(
      accessKeyId,
      secretAccessKey,
      host,
      path,
      params,
      bodyString
    );
    
    console.log('签名生成完成:', headers);
    
    const queryString = Object.entries(params)
      .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
      .join('&');
    const url = `https://${host}${path}?${queryString}`;
    
    console.log('发送请求到:', url);
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...headers
      },
      body: bodyString
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('API调用失败:', response.status, response.statusText, errorText);
      return { success: false, error: errorText };
    }
    
    const data = await response.json();
    console.log('API响应:', data);
    
    if (data.code !== 200) {
      console.error('API调用返回错误:', data.code, data.message || "未知错误");
      return { success: false, error: data.message || "未知错误" };
    }
    
    return { success: true, data };
  } catch (error) {
    console.error('测试失败:', error);
    return { success: false, error };
  }
}

// 火山引擎豆包文生图API调用
export async function fetchDoubaiImage(prompt: string, model: string, apiKey: string, imageSize: string, addLog: (entry: LogEntry) => void, negativePrompt?: string): Promise<string> {
  // 解析API密钥（格式：accessKeyId:secretAccessKey）
  const [accessKeyId, secretAccessKey] = apiKey.split(':');
  if (!accessKeyId || !secretAccessKey) {
    throw new Error('API密钥格式错误，请使用 AccessKeyId:SecretAccessKey 格式');
  }
  
  // API端点
  const host = 'visual.volces.com';
  const path = '/v1/image/text_to_image';
  const url = `https://${host}${path}`;
  
  // 解析宽高
  const [width, height] = imageSize.split('x').map(Number);
  
  // 根据模型ID选择合适的模型类型
  let volcModel = 'general_2.1';
  if (model === 'doubaimg-text2img-v2.0pro') {
    volcModel = 'general_2.0_pro';
  } else if (model === 'doubaimg-text2img-v2.0') {
    volcModel = 'general_2.0';
  }
  
  // 请求体
  const requestBody: any = {
    req_key: new Date().getTime().toString(),
    style: volcModel,
    prompt: prompt,
    width: width || 512,
    height: height || 512,
    n: 1,
    return_type: 'base64'
  };
  
  // 如果提供了负面提示词，则添加到请求体中
  if (negativePrompt) {
    requestBody.negative_prompt = negativePrompt;
  }
  
  const bodyString = JSON.stringify(requestBody);
  
  // 请求参数
  const params = {
    Action: 'TextToImage',
    Version: '2022-08-31'
  };
  
  try {
    // 生成签名
    const headers = await generateVolcengineSignature(
      accessKeyId,
      secretAccessKey,
      host,
      path,
      params,
      bodyString
    );
    
    // 构建完整URL
    const queryString = Object.entries(params)
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
    if (data.code !== 200) {
      throw new Error(`API调用返回错误: ${data.code} - ${data.message || "未知错误"}`);
    }
    
    // 获取图片数据
    const base64Data = data?.data?.images?.[0];
    if (!base64Data) throw new Error("未获取到图片数据");
    
    // 因为返回的是base64格式，我们创建一个Blob并生成临时URL
    const byteCharacters = atob(base64Data);
    const byteNumbers = new Array(byteCharacters.length);
    
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: 'image/jpeg' });
    
    return URL.createObjectURL(blob);
  } catch (error: any) {
    // 已经在上面记录了HTTP错误，这里捕获其他错误
    if (!error.message?.includes("API调用失败") && !error.message?.includes("API调用返回错误")) {
      addLog({
        timestamp: getTimestamp(),
        type: "error",
        data: {
          message: error.message,
          stack: error.stack,
        },
      });
    }
    throw error;
  }
}

// 获取所有的API提供商配置
export function getAllProviders() {
  return MODELS.map(provider => ({
    name: provider.name,
    value: provider.value,
    apiKeyName: provider.apiKeyName,
    url: provider.url,
    getApiKey: () => getAPIKey(provider.apiKeyName),
    setApiKey: (key: string) => setAPIKey(key, provider.apiKeyName)
  }));
}

// 根据模型获取对应的API提供商
export function getProviderByModel(modelValue: string) {
  const provider = MODELS.find(p => 
    p.value === modelValue || p.children?.some(sm => sm.value === modelValue)
  );
  
  if (!provider) {
    throw new Error(`找不到提供商: ${modelValue}`);
  }
  
  return {
    name: provider.name,
    value: provider.value,
    apiKeyName: provider.apiKeyName,
    url: provider.url,
    getApiKey: () => getAPIKey(provider.apiKeyName),
    setApiKey: (key: string) => setAPIKey(key, provider.apiKeyName)
  };
}

// OpenAI API调用
export async function fetchOpenAIImage(prompt: string, model: string, apiKey: string, imageSize: string, addLog: (entry: LogEntry) => void): Promise<string> {
  // API端点
  const url = "https://api.openai.com/v1/images/generations";

  // 解析宽高
  const [width, height] = imageSize.split('x').map(Number);
  
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
        "Authorization": `Bearer ${apiKey ? apiKey.substring(0, 4) + "..." + apiKey.substring(apiKey.length - 4) : ""}`,
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
    const imgUrl = data?.data?.[0]?.url || data?.data?.[0]?.b64_json;
    if (!imgUrl) throw new Error("未获取到图片URL");
    
    // 如果返回的是base64数据，则转换为数据URL
    if (data?.data?.[0]?.b64_json) {
      return `data:image/png;base64,${imgUrl}`;
    }
    
    return imgUrl;
  } catch (error: any) {
    // 已经在上面记录了HTTP错误，这里捕获其他错误
    if (!error.message?.includes("API调用失败")) {
      addLog({
        timestamp: getTimestamp(),
        type: "error",
        data: {
          message: error.message,
          stack: error.stack,
        },
      });
    }
    throw error;
  }
}

// 根据模型类型选择合适的API调用方法
export async function generateImage(prompt: string, model: string, apiKey: string, imageSize: string, addLog: (entry: LogEntry) => void, negativePrompt?: string): Promise<string> {
  if (model.startsWith('cogview-')) {
    // 使用智谱AI的API
    return fetchCogviewImage(prompt, model, apiKey, imageSize, addLog);
  } else if (model.startsWith('wanx2')) {
    // 阿里云通义万相V2的API正在开发中
    throw new Error("阿里云通义万相模型接口正在开发中，暂时不可用，请选择其他模型");
  } else if (model === 'irag-1.0' || model === 'flux.1-schnell') {
    // 使用百度千帆的API
    return fetchQianfanImage(prompt, model, apiKey, imageSize, addLog);
  } else if (model.startsWith('doubaimg-')) {
    // 火山引擎豆包的API正在开发中
    throw new Error("火山引擎豆包模型接口正在开发中，暂时不可用，请选择其他模型");
  } else if (model.startsWith('dall-e-') || model.startsWith('gpt-image-1')) {
    // 使用OpenAI的API (包括DALL·E和GPT-Image-1)
    return fetchOpenAIImage(prompt, model, apiKey, imageSize, addLog);
  } else {
    // 未来可添加更多平台支持
    throw new Error(`不支持的模型: ${model}`);
  }
}

// 添加一个函数，用于获取当前选择模型支持的图片尺寸列表
export function getModelSupportedSizes(model: string): {width: number, height: number}[] {
  if (model.startsWith("gpt-image-1")) {
    // GPT-Image-1支持的尺寸
    return [
      {width: 1024, height: 1024}, // 正方形
      {width: 1536, height: 1024}, // 横向
      {width: 1024, height: 1536}  // 纵向
    ];
  } else if (model.startsWith("dall-e-3")) {
    // DALL-E 3支持的尺寸
    return [
      {width: 1024, height: 1024}, // 正方形
      {width: 1792, height: 1024}, // 横向
      {width: 1024, height: 1792}  // 纵向
    ];
  } else if (model === "dall-e-2") {
    // DALL-E 2支持的尺寸
    return [
      {width: 256, height: 256},
      {width: 512, height: 512},
      {width: 1024, height: 1024}
    ];
  } else {
    // 默认支持的尺寸，通常适用于大多数模型
    return [
      {width: 1024, height: 1024}
    ];
  }
}

// 添加一个函数，用于检查指定的尺寸是否被当前模型支持
export function isImageSizeSupported(model: string, width: number, height: number): boolean {
  const supportedSizes = getModelSupportedSizes(model);
  
  // 检查是否有完全匹配的尺寸
  return supportedSizes.some(size => size.width === width && size.height === height);
}

// 添加一个函数，用于根据当前选择的模型和比例获取推荐的尺寸
export function getRecommendedSize(model: string, aspectRatio: number): {width: number, height: number} {
  const supportedSizes = getModelSupportedSizes(model);
  
  if (Math.abs(aspectRatio - 1) < 0.1) {
    // 接近正方形的比例
    const squareSize = supportedSizes.find(size => size.width === size.height);
    if (squareSize) return squareSize;
  } else if (aspectRatio > 1) {
    // 横向比例
    const landscapeSize = supportedSizes.find(size => size.width > size.height);
    if (landscapeSize) return landscapeSize;
  } else {
    // 纵向比例
    const portraitSize = supportedSizes.find(size => size.height > size.width);
    if (portraitSize) return portraitSize;
  }
  
  // 如果没有找到合适的尺寸，返回第一个支持的尺寸
  return supportedSizes[0];
}