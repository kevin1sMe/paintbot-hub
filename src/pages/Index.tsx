import React, { useState, useEffect, useRef, useCallback } from "react";
import AIModelSelector from "../components/AIModelSelector";
import { Button } from "@/components/ui/button";
import GeneratedImageCard from "../components/GeneratedImageCard";
import DebugPanel from "../components/DebugPanel";
import LayoutAdjuster from "../components/LayoutAdjuster";
import { toast } from "@/hooks/use-toast";
import { Settings, ChevronDown, Eye, EyeOff, Copy, Check } from "lucide-react";
import {
  MODELS,
  getAPIKey,
  setAPIKey,
  getProviderByModel,
  generateImage,
  LogEntry,
  HistoryEntry as ImageHistoryEntry,
  getTimestamp as getFormattedTimestamp,
  isImageSizeSupported,
  getModelSupportedSizes,
  getRecommendedSize,
  saveLogsToLocalStorage,
  loadLogsFromLocalStorage,
  saveHistoryToLocalStorage,
  loadHistoryFromLocalStorage,
  saveUserPreferences,
  loadUserPreferences,
  UserPreferences
} from "../services";

// 生成的图片信息类型
type GeneratedImage = {
  imgUrl: string;
  timestamp: string;
  duration: number;
  usedModel: string;
};

// 不再需要此类型定义，直接使用服务层的 HistoryEntry
// type HistoryEntry = {
//   prompt: string;
//   imgUrl: string;
//   model: string;
//   time: string;
//   size: string;
// };

// 模型类型定义
type ModelItem = {
  name: string;
  value: string;
  apiKeyName: string;
  url: string;
  promptMaxLength?: number;
  promptSupportLang?: string;
  negativePromptSupport?: boolean;
  negativePromptMaxLength?: number;
  children?: SubModelItem[];
};

// 子模型类型定义
type SubModelItem = {
  label: string;
  value: string;
  price: string;
  promptMaxLength?: number;
  promptSupportLang?: string;
  negativePromptSupport?: boolean;
  negativePromptMaxLength?: number;
};

const DEFAULT_MODEL = "cogview";
const DEFAULT_SUB_MODEL = "cogview-3-flash";

// 预设的图片比例
const ASPECT_RATIOS = [
  { name: "21:9", ratio: 21/9, value: "21:9" },
  { name: "16:9", ratio: 16/9, value: "16:9" },
  { name: "4:3", ratio: 4/3, value: "4:3" },
  { name: "3:2", ratio: 3/2, value: "3:2" },
  { name: "1:1", ratio: 1/1, value: "1:1" },
  { name: "9:16", ratio: 9/16, value: "9:16" }
];

// 日志存储相关函数
function saveLogs(logs: LogEntry[]) {
  saveLogsToLocalStorage(logs);
}

function loadLogs(): LogEntry[] {
  return loadLogsFromLocalStorage();
}

// 基于比例计算合适的尺寸
function calculateDimensions(aspectRatio) {
  // 基准像素，保持总像素数一致
  const totalPixels = 1024 * 1024; // 基准为1024x1024
  let width, height;

  if (aspectRatio >= 1) {
    // 宽屏
    width = Math.round(Math.sqrt(totalPixels * aspectRatio));
    height = Math.round(width / aspectRatio);
  } else {
    // 竖屏
    height = Math.round(Math.sqrt(totalPixels / aspectRatio));
    width = Math.round(height * aspectRatio);
  }

  // 确保能被16整除
  width = Math.floor(width / 16) * 16;
  height = Math.floor(height / 16) * 16;

  // 确保在有效范围内
  width = Math.min(Math.max(width, 512), 2048);
  height = Math.min(Math.max(height, 512), 2048);

  return { width, height };
}

// API文档: https://bigmodel.cn/dev/api/image-model/cogview
async function fetchCogviewImage(prompt: string, model: string, apiKey: string, imageSize: string, addLog: (entry: LogEntry) => void) {
  // 更新为正确的API端点
  const url = "https://open.bigmodel.cn/api/paas/v4/images/generations";

  // 记录请求
  const requestBody = {
    model: model,
    prompt: prompt,
    n: 1,
    size: imageSize,
    response_format: "url",
    style: "vivid"
  };

  addLog({
    timestamp: getFormattedTimestamp(),
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
        timestamp: getFormattedTimestamp(),
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
      timestamp: getFormattedTimestamp(),
      type: "response",
      data,
    });

    // 获取图片URL
    const imgUrl = data?.data?.[0]?.url;
    if (!imgUrl) throw new Error("未获取到图片");
    return imgUrl;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    const stack = error instanceof Error ? error.stack : undefined;
    // 已经在上面记录了HTTP错误，这里捕获其他错误
    if (!message.includes("API调用失败")) {
      addLog({
        timestamp: getFormattedTimestamp(),
        type: "error",
        data: {
          message,
          stack,
        },
      });
    }
    throw error;
  }
}

// API文档: https://help.aliyun.com/zh/model-studio/text-to-image-v2-api-reference
async function fetchWanx2Image(prompt: string, model: string, apiKey: string, imageSize: string, addLog: (entry: LogEntry) => void) {
  // 阿里云通义万相文生图V2 API端点
  const url = "https://dashscope.aliyuncs.com/api/v1/services/aigc/text2image/image-synthesis";

  // 解析宽高
  const [width, height] = imageSize.split('x').map(Number);
  
  // 记录请求
  const requestBody = {
    model: model,
    input: {
      prompt: prompt,
    },
    parameters: {
      size: imageSize,
      n: 1
    }
  };

  addLog({
    timestamp: getFormattedTimestamp(),
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
      
      addLog({
        timestamp: getFormattedTimestamp(),
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
    
    addLog({
      timestamp: getFormattedTimestamp(),
      type: "response",
      data: taskData,
    });
    
    if (!taskData.output?.task_id) {
      throw new Error("未获取到任务ID");
    }
    
    const taskId = taskData.output.task_id;
    
    // 第二步：轮询查询任务结果
    const taskUrl = `https://dashscope.aliyuncs.com/api/v1/tasks/${taskId}`;
    
    addLog({
      timestamp: getFormattedTimestamp(),
      type: "info",
      data: {
        message: `任务已创建，ID: ${taskId}，开始查询结果`,
        taskUrl
      },
    });
    
    // 最多轮询30次，每次间隔2秒
    for (let i = 0; i < 30; i++) {
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const taskResponse = await fetch(taskUrl, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
        },
      });
      
      if (!taskResponse.ok) {
        const errorText = await taskResponse.text();
        
        addLog({
          timestamp: getFormattedTimestamp(),
          type: "error",
          data: {
            status: taskResponse.status,
            statusText: taskResponse.statusText,
            error: errorText,
          },
        });
        
        throw new Error(`查询任务失败: ${taskResponse.status} ${taskResponse.statusText} - ${errorText}`);
      }
      
      const taskResult = await taskResponse.json();
      
      addLog({
        timestamp: getFormattedTimestamp(),
        type: "info",
        data: {
          message: `第${i+1}次查询任务状态: ${taskResult.output?.task_status}`,
          taskResult
        },
      });
      
      // 如果任务完成
      if (taskResult.output?.task_status === "SUCCEEDED") {
        // 获取图片URL
        const imgUrl = taskResult.output?.results?.[0]?.url;
        if (!imgUrl) throw new Error("未获取到图片URL");
        return imgUrl;
      }
      
      // 如果任务失败
      if (taskResult.output?.task_status === "FAILED") {
        throw new Error(`任务执行失败: ${taskResult.output?.code} - ${taskResult.output?.message}`);
      }
    }
    
    throw new Error("任务查询超时，请稍后在历史记录中查看结果");
    
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    const stack = error instanceof Error ? error.stack : undefined;
    // 已经在上面记录了HTTP错误，这里捕获其他错误
    if (!message.includes("API调用失败") && !message.includes("查询任务失败") && !message.includes("任务执行失败")) {
      addLog({
        timestamp: getFormattedTimestamp(),
        type: "error",
        data: {
          message,
          stack,
        },
      });
    }
    throw error;
  }
}

const Index = () => {
  // 加载用户偏好设置
  const userPrefs = loadUserPreferences();

  // 基本状态 - 从用户偏好中恢复
  const [model, setModel] = useState(() => MODELS.find(provider => provider.value === userPrefs.model)?.value || DEFAULT_MODEL);
  const [subModel, setSubModel] = useState(() => {
    const provider = MODELS.find(provider => provider.value === model);
    const savedModel = userPrefs.subModel || DEFAULT_SUB_MODEL;
    const aliases: Record<string, string> = {
      'nano-banana-2': 'gemini-3.1-flash-image',
      'nano-banana-pro': 'gemini-3-pro-image',
      'gemini-3-pro-image-preview': 'gemini-3-pro-image',
      'seedream-5.0': 'doubao-seedream-5-0-pro-260628',
      'seedream-5.0-lite': 'doubao-seedream-5-0-lite-260128',
      'seedream-4.5': 'doubao-seedream-4-5-251128',
      'seedream-4.0': 'doubao-seedream-4-0-250828',
      'ernie-image': 'ernie-image-turbo',
    };
    return provider?.children?.find(child => child.value === (aliases[savedModel] || savedModel))?.value || provider?.children?.[0]?.value || '';
  });

  // 尺寸相关状态 - 从用户偏好中恢复
  const [selectedRatio, setSelectedRatio] = useState(userPrefs.selectedRatio || "4:3");
  const [dimensions, setDimensions] = useState(() => {
    if (userPrefs.dimensions) {
      return userPrefs.dimensions;
    }
    const aspectRatio = ASPECT_RATIOS.find(r => r.value === "4:3")?.ratio || 4/3;
    return calculateDimensions(aspectRatio);
  });
  const dimensionMax = Math.max(...getModelSupportedSizes(subModel || model).flatMap(size => [size.width, size.height]));

  // 生成相关状态 - 从用户偏好中恢复
  const [prompt, setPrompt] = useState(userPrefs.prompt || "");
  const [negativePrompt, setNegativePrompt] = useState(userPrefs.negativePrompt || "");
  const [apiKeys, setApiKeys] = useState<Record<string, string>>(() => {
    // 从localStorage加载所有模型提供商的密钥
    return MODELS.reduce((acc, provider) => {
      acc[provider.apiKeyName] = getAPIKey(provider.apiKeyName);
      return acc;
    }, {} as Record<string, string>);
  });
  const [selectedProviderKey, setSelectedProviderKey] = useState(MODELS[0].apiKeyName);
  const [imgUrl, setImgUrl] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>(() => loadLogs());
  const [imageCount, setImageCount] = useState(userPrefs.imageCount || 1);
  const [generatedImages, setGeneratedImages] = useState<Array<{
    imgUrl: string;
    timestamp: string;
    duration: number;
    usedModel: string;
  }>>([]);
  const [pendingImages, setPendingImages] = useState<number>(0);
  
  // 配置面板状态
  const [showSettings, setShowSettings] = useState(false);

  // 图片全屏预览状态
  const [showFullImage, setShowFullImage] = useState(false);
  const [fullImageUrl, setFullImageUrl] = useState("");

  // 添加状态用于记录生成时使用的模型
  const [generationInfo, setGenerationInfo] = useState({
    startTime: "",
    duration: 0,
    usedModel: ""
  });

  // 添加历史记录状态
  const [history, setHistory] = useState<ImageHistoryEntry[]>(() => loadHistoryFromLocalStorage());

  // 添加日志并保存到localStorage
  const addLog = React.useCallback((entry: LogEntry) => {
    setLogs(prevLogs => {
      const newLogs = [entry, ...prevLogs];
      saveLogs(newLogs);
      return newLogs;
    });
  }, []);

  // 清空日志
  const clearLogs = React.useCallback(() => {
    setLogs([]);
    saveLogs([]);
  }, []);

  // 生成下载文件名（包含模型名和提示词关键词）
  const generateFileName = (prompt: string, modelName: string) => {
    // 提取提示词的前几个关键词（最多5个单词，总长度不超过30个字符）
    const words = prompt
      .toLowerCase()
      .replace(/[^\w\s\u4e00-\u9fa5]/g, ' ') // 保留字母、数字、空格和中文
      .trim()
      .split(/\s+/)
      .filter(word => word.length > 0)
      .slice(0, 5); // 取前5个单词

    let keywords = words.join('-');

    // 限制关键词总长度
    if (keywords.length > 30) {
      keywords = keywords.substring(0, 30);
      // 确保不会在单词中间截断
      const lastDash = keywords.lastIndexOf('-');
      if (lastDash > 0) {
        keywords = keywords.substring(0, lastDash);
      }
    }

    const timestamp = new Date().getTime();
    return `ai-image-${modelName}-${keywords}-${timestamp}.png`;
  };

  // 检查尺寸是否有效
  const validateDimensions = () => {
    const { width, height } = dimensions;
    const currentModelValue = subModel || model;
    return isImageSizeSupported(currentModelValue, width, height);
  };

  // 根据模型和比例调整尺寸
  const adjustDimensionsToModel = useCallback(() => {
    const currentModelValue = subModel || model;
    
    // 如果当前尺寸不被支持，自动调整为推荐尺寸
    if (!isImageSizeSupported(currentModelValue, dimensions.width, dimensions.height)) {
      // 根据当前宽高比获取推荐尺寸
      const aspectRatio = dimensions.width / dimensions.height;
      const recommendedSize = getRecommendedSize(currentModelValue, aspectRatio);

      setDimensions({
        width: recommendedSize.width,
        height: recommendedSize.height
      });

      toast({
        title: "图片尺寸已调整",
        description: `已自动调整为${currentModelValue}支持的尺寸: ${recommendedSize.width}x${recommendedSize.height}`
      });
    }
  }, [dimensions.height, dimensions.width, model, subModel]);

  // 选择比例
  useEffect(() => {
    const aspectRatio = ASPECT_RATIOS.find(r => r.value === selectedRatio)?.ratio;
    if (aspectRatio) {
      setDimensions(calculateDimensions(aspectRatio));
    }
  }, [selectedRatio]);

  // 当模型或子模型变化时，检查并调整尺寸
  useEffect(() => {
    adjustDimensionsToModel();
  }, [adjustDimensionsToModel, model, subModel]);

  // 保存用户偏好设置到 localStorage
  useEffect(() => {
    const preferences: UserPreferences = {
      model,
      subModel,
      selectedRatio,
      dimensions,
      prompt,
      negativePrompt,
      imageCount
    };
    saveUserPreferences(preferences);
  }, [model, subModel, selectedRatio, dimensions, prompt, negativePrompt, imageCount]);

  // 手动调整尺寸
  const handleDimensionChange = (key, value) => {
    const numValue = parseInt(value);
    if (isNaN(numValue)) return;
    
    let newWidth = dimensions.width;
    let newHeight = dimensions.height;
    
    if (key === 'width') {
      newWidth = Math.floor(numValue / 16) * 16;
      // 自动根据当前选中的比例调整高度
      const aspectRatio = ASPECT_RATIOS.find(r => r.value === selectedRatio)?.ratio;
      if (aspectRatio) {
        newHeight = Math.floor((newWidth / aspectRatio) / 16) * 16;
      }
    } else {
      newHeight = Math.floor(numValue / 16) * 16;
      // 自动根据当前选中的比例调整宽度
      const aspectRatio = ASPECT_RATIOS.find(r => r.value === selectedRatio)?.ratio;
      if (aspectRatio) {
        newWidth = Math.floor((newHeight * aspectRatio) / 16) * 16;
      }
    }
    
    // 确保在有效范围内
    newWidth = Math.min(Math.max(newWidth, 512), dimensionMax);
    newHeight = Math.min(Math.max(newHeight, 512), dimensionMax);
    
    setDimensions({ width: newWidth, height: newHeight });
  };

  // 添加函数获取当前选择模型的提示词最大长度
  const getCurrentModelPromptMaxLength = () => {
    // 首先查找当前选择的子模型是否有特定的长度限制
    const currentModel = MODELS.find(m => m.value === model) as ModelItem | undefined;
    const currentSubModel = currentModel?.children?.find(sm => sm.value === subModel) as SubModelItem | undefined;
    
    if (currentSubModel?.promptMaxLength) {
      return currentSubModel.promptMaxLength;
    }
    
    // 如果子模型没有特定限制，则使用模型提供商的默认限制
    if (currentModel?.promptMaxLength) {
      return currentModel.promptMaxLength;
    }
    
    // 默认值，如果没有找到任何限制
    return 300;
  };

  // 添加函数获取当前选择模型的语言支持信息
  const getCurrentModelLanguageSupport = () => {
    const currentModel = MODELS.find(m => m.value === model) as ModelItem | undefined;
    const currentSubModel = currentModel?.children?.find(sm => sm.value === subModel) as SubModelItem | undefined;
    
    return currentSubModel?.promptSupportLang || "中文、英文"; // 默认值
  };

  // 判断当前模型是否支持负面提示词
  const getCurrentModelNegativePromptSupport = () => {
    const currentModel = MODELS.find(m => m.value === model) as ModelItem | undefined;
    const currentSubModel = currentModel?.children?.find(sm => sm.value === subModel) as SubModelItem | undefined;
    
    // 优先使用子模型的设置，如果没有则使用主模型的设置
    return currentSubModel?.negativePromptSupport ?? currentModel?.negativePromptSupport ?? false;
  };

  // 获取当前模型负面提示词的最大长度
  const getCurrentModelNegativePromptMaxLength = () => {
    const currentModel = MODELS.find(m => m.value === model) as ModelItem | undefined;
    const currentSubModel = currentModel?.children?.find(sm => sm.value === subModel) as SubModelItem | undefined;
    
    // 优先使用子模型的设置，如果没有则使用主模型的设置
    return currentSubModel?.negativePromptMaxLength ?? currentModel?.negativePromptMaxLength ?? 0;
  };

  // 计算当前提示词的长度和限制
  const promptMaxLength = getCurrentModelPromptMaxLength();
  const promptLength = prompt.length;
  const isPromptTooLong = promptLength > promptMaxLength;
  const languageSupport = getCurrentModelLanguageSupport();

  // 计算当前负面提示词的长度和限制
  const supportsNegativePrompt = getCurrentModelNegativePromptSupport();
  const negativePromptMaxLength = getCurrentModelNegativePromptMaxLength();
  const negativePromptLength = negativePrompt.length;
  const isNegativePromptTooLong = negativePromptLength > negativePromptMaxLength;

  // 修改生成图片函数，添加历史记录
  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast({ title: "请输入描述后再生成。" });
      return;
    }
    
    // 验证提示词长度
    if (isPromptTooLong) {
      toast({ 
        title: "提示词超出长度限制", 
        description: `当前模型最大支持${promptMaxLength}个字符` 
      });
      return;
    }
    
    // 验证负面提示词长度
    if (supportsNegativePrompt && isNegativePromptTooLong) {
      toast({ 
        title: "负面提示词超出长度限制", 
        description: `当前最大支持${negativePromptMaxLength}个字符` 
      });
      return;
    }
    
    // 获取当前模型的提供商
    const currentProvider = MODELS.find(m => 
      m.value === model || m.children?.some(sm => sm.value === subModel)
    );
    
    if (!currentProvider) {
      toast({ title: "无法识别当前模型提供商" });
      return;
    }
    
    const providerApiKey = apiKeys[currentProvider.apiKeyName];
    
    if (!providerApiKey) {
      toast({ title: `请填写${currentProvider.name}的API Key。` });
      setShowSettings(true);
      setSelectedProviderKey(currentProvider.apiKeyName);
      return;
    }
    
    // 检查尺寸是否有效
    if (!validateDimensions()) {
      toast({ title: "图片尺寸无效", description: "请调整图片尺寸" });
      return;
    }
    
    const currentSize = `${dimensions.width}x${dimensions.height}`;
    
    setIsLoading(true);
    setImgUrl("");
    setGeneratedImages([]);
    // 设置待生成的图片数量
    setPendingImages(imageCount);
    
    try {
      // 创建生成指定数量图片的Promise数组
      const imagesToGenerate = Array(imageCount).fill(null);
      
      // 开始时间
      const startTime = new Date();
      const formattedStartTime = startTime.toLocaleTimeString();
      
      // 记录使用的模型
      setGenerationInfo({
        startTime: formattedStartTime,
        duration: 0,
        usedModel: subModel || model
      });
      
      // 并行处理所有图片生成请求
      const results = await Promise.all(
        imagesToGenerate.map(async (_, index) => {
          // 使用统一的生成图片函数，传递负面提示词
          const imgUrl = await generateImage({
            prompt, 
            model: subModel || model, // 确保model不为undefined
            apiKey: providerApiKey, 
            imageSize: currentSize, 
            addLog,
            negativePrompt: supportsNegativePrompt ? negativePrompt : undefined // 只在支持负面提示词的模型中传递
          });
          
          // 减少待处理的图片数量
          setPendingImages(prev => Math.max(0, prev - 1));
          
          // 返回与原始数据结构一致的格式
          const endTime = new Date();
          const duration = Math.round((endTime.getTime() - startTime.getTime()) / 1000);
          
          return {
            imgUrl: imgUrl,
            timestamp: formattedStartTime,
            duration: duration,
            usedModel: subModel || model
          };
        })
      );
      
      // 所有图片生成完成
      setGeneratedImages(results);
      
      // 兼容单图显示
      if (results.length > 0) {
        setImgUrl(results[0].imgUrl);
      }
      
      // 计算耗时
      const endTime = new Date();
      const durationInSeconds = Math.round((endTime.getTime() - startTime.getTime()) / 1000);
      
      // 更新生成信息
      setGenerationInfo(prev => ({
        ...prev,
        duration: durationInSeconds
      }));
      
      // 在生成图片成功后，保存历史记录
      if (results.length > 0) {
        const historyEntry: ImageHistoryEntry = {
          prompt: prompt,
          imgUrl: results[0].imgUrl, // 主图片使用第一张
          model: subModel || model,
          time: formattedStartTime,
          size: currentSize,
          // 添加多图信息
          imageCount: results.length,
          allImages: results.map(img => img.imgUrl)
        };
        
        const newHistory = [historyEntry, ...history.slice(0, 19)];
        setHistory(newHistory);
        saveHistoryToLocalStorage(newHistory);
      }
      
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('图片生成失败:', error);
      toast({
        title: "图片生成失败",
        description: message,
        variant: "destructive"
      });
      // 清除待处理图片
      setPendingImages(0);
    } finally {
      setIsLoading(false);
    }
  };

  // API Key变更处理
  const handleApiKeyChange = (provider: string, value: string) => {
    const newApiKeys = { ...apiKeys, [provider]: value };
    setApiKeys(newApiKeys);
    setAPIKey(value, provider);
  };

  // 更新模型时自动选择对应的API Key提供商
  useEffect(() => {
    const currentProvider = MODELS.find(m => 
      m.value === model || m.children?.some(sm => sm.value === subModel)
    );
    if (currentProvider) {
      setSelectedProviderKey(currentProvider.apiKeyName);
    }
  }, [model, subModel]);

  // 处理历史记录点击的函数
  const handleHistoryItemClick = (item: ImageHistoryEntry) => {
    // 解析尺寸
    const [width, height] = item.size.split('x').map(Number);
    
    // 设置为当前显示的图片和信息
    setImgUrl(item.imgUrl);
    setPrompt(item.prompt);
    
    // 更新尺寸信息
    setDimensions({width, height});
    
    // 尝试找到匹配的比例并设置
    const aspectRatio = width / height;
    const closestRatio = ASPECT_RATIOS.reduce((prev, curr) => {
      return Math.abs(curr.ratio - aspectRatio) < Math.abs(prev.ratio - aspectRatio) ? curr : prev;
    }, ASPECT_RATIOS[0]);
    setSelectedRatio(closestRatio.value);
    
    // 更新生成信息
    setGenerationInfo({
      startTime: item.time,
      duration: 0,
      usedModel: item.model
    });
    
    // 设置正确的模型
    if (item.model) {
      // 查找主模型和子模型
      const modelProvider = MODELS.find(m => 
        m.value === item.model || m.children?.some(sm => sm.value === item.model)
      );
      
      if (modelProvider) {
        // 是主模型
        if (modelProvider.value === item.model) {
          setModel(item.model);
          // 选择默认子模型
          if (modelProvider.children?.length) {
            setSubModel(modelProvider.children[0].value);
          }
        } 
        // 是子模型
        else {
          setModel(modelProvider.value);
          setSubModel(item.model);
        }
      }
    }
    
    // 重要改进：支持多张图片
    if (item.allImages && item.allImages.length > 0) {
      // 创建生成的图片数组以显示所有图片
      const generatedImgs = item.allImages.map(imgUrl => ({
        imgUrl,
        timestamp: item.time,
        duration: 0,
        usedModel: item.model
      }));
      setGeneratedImages(generatedImgs);
    } else {
      // 向后兼容：处理没有 allImages 字段的旧历史记录
      setGeneratedImages([{
        imgUrl: item.imgUrl,
        timestamp: item.time,
        duration: 0,
        usedModel: item.model
      }]);
    }
    
    // 重置待处理图片数量
    setPendingImages(0);
  };

  // 打开全屏预览
  const openImageOverlay = (url: string) => {
    if (url) {
      setFullImageUrl(url);
      setShowFullImage(true);
    }
  };

  const [apiKeyVisibility, setApiKeyVisibility] = useState<Record<string, boolean>>({});
  const [apiKeyCopied, setApiKeyCopied] = useState<Record<string, boolean>>({});

  // 切换API密钥可见性
  const toggleApiKeyVisibility = (provider: string) => {
    setApiKeyVisibility(prev => ({
      ...prev,
      [provider]: !prev[provider]
    }));
  };

  // 复制API密钥到剪贴板
  const copyApiKey = (provider: string) => {
    const key = apiKeys[provider] || '';
    if (key) {
      navigator.clipboard.writeText(key).then(() => {
        // 设置复制成功标志
        setApiKeyCopied(prev => ({
          ...prev,
          [provider]: true
        }));
        
        // 2秒后重置复制成功标志
        setTimeout(() => {
          setApiKeyCopied(prev => ({
            ...prev,
            [provider]: false
          }));
        }, 2000);
      });
    }
  };

  const [currentTip, setCurrentTip] = useState(0);

  // 添加历史记录展开/折叠状态
  const [historyCollapsed, setHistoryCollapsed] = useState(false);

  const securityTips = [
    "🔒 所有数据均存储在本地，我们不会保存您的任何信息",
    "🔐 您的API密钥安全存储在本地浏览器中，不会被发送到任何其他地方",
    "🚀 为了更好的体验，建议使用自己的API密钥",
    "⚠️ 请勿在提示中包含个人敏感信息",
    "📜 生成的图片仅供参考，请遵守相关法律法规",
    "⚙️ 使用高级参数可以获得更好的生成效果",
    "💾 定期备份您的提示词和设置",
    "💡 如有问题或建议，欢迎在GitHub上提交反馈",
    "⭐ 如果喜欢的话，请在GitHub给我一个Star吧",
    "📋 通过历史记录可以查看之前的生成上下文哟"
  ];

  // Tips切换效果
  useEffect(() => {
    const tipInterval = setInterval(() => {
      setCurrentTip(prev => (prev + 1) % securityTips.length);
    }, 5000); // 5秒切换一次

    return () => clearInterval(tipInterval);
  }, [securityTips.length]);

  return (
    <div className="real-min-h-screen bg-gray-100 flex flex-col w-full">
      {/* 布局调整器组件 */}
      <LayoutAdjuster />
      
      {/* 顶部带安全提示的导航栏 */}
      <div className="bg-gradient-to-r from-blue-50 via-white to-indigo-50 border border-red-200 rounded-lg mx-4 mt-4 mb-1 py-4 px-4 shadow-sm flex-shrink-0 relative">
        <div className="max-w-7xl mx-auto w-full flex items-center">
          {/* 左侧Logo部分，占据0.618前的空间 */}
          <div className="flex items-center gap-2 w-[61.8%] md:w-[61.8%] pr-2">
            <img src="/logo.png" alt="Logo" className="h-8 w-auto rounded-lg" />
            <span className="text-xl font-bold tracking-tight text-gray-800 truncate">一站式AI绘图平台</span>
          </div>
          
          {/* 右侧Tips部分，从黄金比例(0.618)位置开始 */}
          <div className="w-[38.2%] pr-20">
            <div className="security-banner w-full">
              <div className="flex items-center">
                <span className="text-xs text-blue-600 font-medium truncate">
                  {securityTips[currentTip]}
                </span>
              </div>
            </div>
          </div>
        </div>
        
        {/* 调试面板按钮 - 固定在右上角 */}
        <button
          className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white shadow border text-gray-700 hover:bg-gray-50 px-3 py-1.5 rounded text-sm flex items-center gap-1 z-10"
          onClick={() => document.getElementById('debug-panel')?.classList.toggle('hidden')}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10zm0 0V8m0 4h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          调试
        </button>
      </div>

      {/* 设置面板 - 条件渲染 */}
      {showSettings && (
        <div className="bg-white border-b border-gray-200 shadow-sm flex-shrink-0">
          <div className="max-w-7xl mx-auto py-4 px-4">
            <h3 className="text-sm font-medium text-gray-700 mb-2">API密钥设置</h3>
            <div className="border border-gray-200 rounded-md p-4">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  平台名称
                </label>
                <select 
                  className="w-full md:w-80 border border-gray-300 rounded-md px-3 py-2 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={selectedProviderKey}
                  onChange={(e) => setSelectedProviderKey(e.target.value)}
                >
                  {MODELS.map(provider => (
                    <option key={provider.apiKeyName} value={provider.apiKeyName}>
                      {provider.name}
                    </option>
                  ))}
                </select>
              </div>
              
              {MODELS.filter(p => p.apiKeyName === selectedProviderKey).map(provider => (
                <div className="mb-4" key={provider.apiKeyName}>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {provider.name} API Key
                  </label>
                  <div className="flex gap-2 items-center">
                    <div className="flex-1 relative">
                      <input
                        type={apiKeyVisibility[provider.apiKeyName] ? "text" : "password"}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-16"
                        placeholder={`请填写${provider.name}的API Key`}
                        value={apiKeys[provider.apiKeyName] || ''}
                        onChange={(e) => handleApiKeyChange(provider.apiKeyName, e.target.value.trim())}
                      />
                      <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex">
                        <button
                          type="button"
                          onClick={() => toggleApiKeyVisibility(provider.apiKeyName)}
                          className="p-1 text-gray-500 hover:text-gray-700"
                          aria-label={apiKeyVisibility[provider.apiKeyName] ? "隐藏API密钥" : "显示API密钥"}
                        >
                          {apiKeyVisibility[provider.apiKeyName] ? (
                            <EyeOff size={16} />
                          ) : (
                            <Eye size={16} />
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => copyApiKey(provider.apiKeyName)}
                          className="p-1 text-gray-500 hover:text-gray-700 ml-1"
                          aria-label="复制API密钥"
                        >
                          {apiKeyCopied[provider.apiKeyName] ? (
                            <Check size={16} className="text-green-500" />
                          ) : (
                            <Copy size={16} />
                          )}
                        </button>
                      </div>
                    </div>
                    {!apiKeys[provider.apiKeyName] && (
                      <a
                        href={provider.url}
                        className="text-blue-500 text-sm flex items-center px-3 hover:underline whitespace-nowrap"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        获取Key
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 主体内容区域 - 左右分栏 */}
      <div className="flex flex-1 overflow-hidden flex-col md:flex-row" style={{minHeight: 0}}>
        {/* 左侧输入区域 */}
        <div className="w-full md:w-[400px] bg-white border-r border-gray-200 flex flex-col overflow-y-auto max-h-[50vh] md:max-h-none flex-shrink-0">
          <div className="p-4 flex-1 flex flex-col">
            {/* 模型选择区 - 水平排列两个下拉框 */}
            <div className="mb-6 border border-gray-200 rounded-md p-2">
              <div className="flex gap-2 items-center">
                <div className="flex-1">
                  <select
                    className="w-full appearance-none bg-white border border-gray-300 rounded-md pl-3 pr-10 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer"
                    value={model}
                    onChange={e => {
                      setModel(e.target.value);
                      // 如果切换主模型，自动选中子模型列表第一个
                      const found = MODELS.find(m => m.value === e.target.value);
                      if (found?.children?.length) {
                        setSubModel(found.children[0].value);
                      } else {
                        setSubModel("");
                      }
                    }}
                  >
                    {MODELS.map(m => (
                      <option key={m.value} value={m.value}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex-1">
                  <select
                    className="w-full appearance-none bg-white border border-gray-300 rounded-md pl-3 pr-10 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer"
                    value={subModel}
                    onChange={e => setSubModel(e.target.value)}
                  >
                    {MODELS.find(m => m.value === model)?.children?.map(sm => (
                      <option key={sm.value} value={sm.value}>
                        {sm.label}
                      </option>
                    ))}
                  </select>
                </div>
                <button 
                  className="bg-gray-100 hover:bg-gray-200 p-2 rounded-md"
                  onClick={() => setShowSettings(!showSettings)}
                >
                  <Settings size={20} className="text-gray-600" />
                </button>
              </div>
              
              {/* 价格提示信息区域 */}
              <div className="mt-3 text-xs text-gray-500 flex items-center px-1">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                价格提示: 
                <span className="font-medium ml-1">
                  {MODELS.find(m => m.value === model)?.children?.find(sm => sm.value === subModel)?.price || '未知'}
                </span>
              </div>
            </div>
            
            {/* 提示词输入 */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                提示词
              </label>
              <textarea 
                className={`w-full border ${isPromptTooLong ? 'border-red-500' : 'border-gray-300'} rounded-md px-3 py-2 h-32 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                placeholder="一只彩虹色的猫"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && e.ctrlKey) handleGenerate();
                }}
                disabled={isLoading}
              />
              <div className="flex justify-between items-center mt-1">
                <p className="text-xs text-gray-400">按Ctrl+Enter快速生成</p>
                <p className={`text-xs ${isPromptTooLong ? 'text-red-500 font-medium' : 'text-gray-400'}`}>
                  {promptLength}/{promptMaxLength} 字符
                </p>
              </div>
              <div className="flex items-center mt-1">
                <p className="text-xs text-gray-500">
                  <span className="inline-flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    支持语言: {languageSupport}
                  </span>
                </p>
              </div>
              {isPromptTooLong && (
                <p className="text-xs text-red-500 mt-1">
                  提示词超出限制，当前模型"{subModel || model}"最多支持{promptMaxLength}个字符
                </p>
              )}
            </div>

            {/* 负面提示词输入（如果模型支持的话） */}
            {supportsNegativePrompt && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  负面提示词（不希望出现的元素）
                </label>
                <textarea 
                  className={`w-full border ${isNegativePromptTooLong ? 'border-red-500' : 'border-gray-300'} rounded-md px-3 py-2 h-20 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                  placeholder="低分辨率、错误、最差质量、低质量、残缺、多余的手指、比例不良等"
                  value={negativePrompt}
                  onChange={(e) => setNegativePrompt(e.target.value)}
                  disabled={isLoading}
                />
                <div className="flex justify-between items-center mt-1">
                  <p className="text-xs text-gray-500">
                    <span className="inline-flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      描述不希望在画面中出现的内容
                    </span>
                  </p>
                  <p className={`text-xs ${isNegativePromptTooLong ? 'text-red-500 font-medium' : 'text-gray-400'}`}>
                    {negativePromptLength}/{negativePromptMaxLength} 字符
                  </p>
                </div>
                {isNegativePromptTooLong && (
                  <p className="text-xs text-red-500 mt-1">
                    负面提示词超出限制，当前最多支持{negativePromptMaxLength}个字符
                  </p>
                )}
              </div>
            )}
            
            {/* 生成按钮 - 移到提示词下方 */}
            <div className="mb-4">
              <Button
                className="bg-blue-600 hover:bg-blue-700 text-white w-full py-3 rounded-md text-base font-medium flex items-center justify-center gap-2 h-auto"
                onClick={handleGenerate}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="none"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                      />
                    </svg>
                    <span>生成中...</span>
                  </>
                ) : (
                  <span>生成图片</span>
                )}
              </Button>
            </div>
            
            {/* 图片设置 - 合并版本 */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                图片设置
              </label>
              <div className="border border-gray-200 rounded-md p-3">
                {/* 合并：比例+尺寸+数量 */}
                <div className="grid grid-cols-3 gap-2 mb-2">
                  {/* 第一列：比例选择 */}
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">比例</label>
                    <div className="relative">
                      <select
                        className="w-full appearance-none bg-white border border-gray-300 rounded-md pl-2 pr-7 py-1.5 text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent cursor-pointer"
                        value={selectedRatio}
                        onChange={(e) => setSelectedRatio(e.target.value)}
                      >
                        {ASPECT_RATIOS.map(ratio => (
                          <option key={ratio.value} value={ratio.value}>
                            {ratio.name}
                          </option>
                        ))}
                      </select>
                      <div className="absolute inset-y-0 right-0 flex items-center px-1.5 pointer-events-none text-gray-500">
                        <ChevronDown size={12} />
                      </div>
                    </div>
                  </div>
                  
                  {/* 第二列：生成数量 */}
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">数量</label>
                    <div className="relative">
                      <select
                        className="w-full appearance-none bg-white border border-gray-300 rounded-md pl-2 pr-7 py-1.5 text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent cursor-pointer"
                        value={imageCount}
                        onChange={(e) => setImageCount(Number(e.target.value))}
                      >
                        {[1, 2, 3, 4, 5, 6].map(num => (
                          <option key={num} value={num}>{num}张</option>
                        ))}
                      </select>
                      <div className="absolute inset-y-0 right-0 flex items-center px-1.5 pointer-events-none text-gray-500">
                        <ChevronDown size={12} />
                      </div>
                    </div>
                  </div>
                  
                  {/* 第三列：尺寸预览 */}
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">尺寸</label>
                    <div className="h-[30px] bg-gray-50 border border-gray-300 rounded-md flex items-center justify-center px-2 text-xs text-gray-700">
                      {dimensions.width} × {dimensions.height}
                    </div>
                  </div>
                </div>
                
                {/* 尺寸调整部分 */}
                <div className="flex gap-2 items-center mb-2">
                  <div className="w-1/2">
                    <input 
                      type="range"
                      min="512"
                      max={dimensionMax}
                      step="16"
                      value={dimensions.width}
                      onChange={(e) => handleDimensionChange('width', e.target.value)}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>
                  <div className="w-1/2">
                    <input 
                      type="range"
                      min="512"
                      max={dimensionMax}
                      step="16"
                      value={dimensions.height}
                      onChange={(e) => handleDimensionChange('height', e.target.value)}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>
                </div>
                
                {/* 错误提示 */}
                {!validateDimensions() && (
                  <p className="text-xs text-red-500 mb-1">
                    请选择当前模型支持的预设尺寸
                  </p>
                )}
                
                {/* 支持的预设尺寸 */}
                {(
                  <div className="flex flex-wrap gap-1 mb-1">
                    {getModelSupportedSizes(subModel || model).map((size, index) => (
                      <button 
                        key={index} 
                        className={`text-xs px-2 py-0.5 rounded ${
                          dimensions.width === size.width && dimensions.height === size.height 
                            ? 'bg-blue-100 text-blue-700' 
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                        onClick={() => setDimensions({width: size.width, height: size.height})}
                      >
                        {size.width}x{size.height}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 右侧图片预览区域 - 调整为弹性布局确保历史记录始终可见 */}
        <div className="flex-1 bg-gray-50 flex flex-col overflow-hidden flex-adaptive">
          {/* 滚动区域只应用于主内容，不包括历史记录 */}
          <div className="p-4 flex-1 overflow-y-auto min-h-0 content-height">
            {generatedImages.length > 0 || pendingImages > 0 ? (
                      <div>
                {/* 顶部信息区 - 模型和尺寸 */}
                <div className="flex items-center mb-3 text-gray-800">
                  <div className="bg-blue-500 text-white p-1.5 rounded-full mr-2">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <span className="text-sm font-medium">{generationInfo.usedModel || subModel}</span>
                  <span className="text-xs text-gray-500 ml-2">{dimensions.width}x{dimensions.height}</span>
                </div>
                
                {/* 提示词显示 */}
                <div className="text-gray-700 text-sm mb-3">
                  {prompt}
                </div>

                {/* 多图展示区域 */}
                <div className="flex flex-wrap gap-4">
                  {/* 已生成的图片 */}
                  {generatedImages.map((image, index) => (
                    <div key={`generated-${index}`} className="relative mb-4 group">
                      <div className="relative cursor-pointer">
                        <img 
                          src={image.imgUrl} 
                          alt={`生成图片 ${index+1}`} 
                          className="w-[256px] object-contain rounded-md border border-gray-200" 
                          style={{ height: 'auto' }}
                          onDoubleClick={() => openImageOverlay(image.imgUrl)}
                        />
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                          <div className="bg-black bg-opacity-50 text-white px-3 py-1.5 rounded text-sm backdrop-blur-sm">
                            双击查看原图
                          </div>
                        </div>
                      </div>
                      
                      {/* 生成时间和耗时 - 移到图片下方 */}
                      <div className="mt-2 text-xs text-gray-500 flex justify-between items-center">
                        <span>{image.timestamp}</span>
                        <span>耗时 {image.duration}秒</span>
                      </div>
                      
                      {/* 图片操作按钮组 - 放在图片上并默认隐藏，hover时显示 */}
                      <div className="absolute right-2 top-10 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button 
                          className="bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-full"
                          onClick={() => {
                            navigator.clipboard.writeText(image.imgUrl);
                            toast({ title: "图片链接已复制" });
                          }}
                          title="复制链接"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            <rect x="8" y="2" width="8" height="4" rx="1" ry="1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </button>
                        <button
                          className="bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-full"
                          onClick={async () => {
                            try {
                              // 先尝试使用 fetch + blob 方式（可以自定义文件名）
                              const response = await fetch(image.imgUrl);
                              const blob = await response.blob();
                              const downloadUrl = window.URL.createObjectURL(blob);
                              const a = document.createElement('a');
                              a.href = downloadUrl;
                              a.download = generateFileName(prompt, image.usedModel);
                              document.body.appendChild(a);
                              a.click();
                              window.URL.revokeObjectURL(downloadUrl);
                              document.body.removeChild(a);
                              toast({ title: "图片已下载" });
                            } catch (e) {
                              // 如果 fetch 失败（可能是 CORS 问题），回退到直接下载
                              console.warn('Fetch 下载失败，尝试直接下载', e);
                              try {
                                const a = document.createElement('a');
                                a.href = image.imgUrl;
                                a.download = generateFileName(prompt, image.usedModel);
                                a.target = '_blank';
                                document.body.appendChild(a);
                                a.click();
                                document.body.removeChild(a);
                                toast({ title: "图片已下载（文件名可能不同）" });
                              } catch (err) {
                                console.error('下载失败', err);
                                toast({ title: "下载失败", description: "请直接右键图片另存为" });
                              }
                            }
                          }}
                          title="下载图片"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                  
                  {/* 待生成的图片占位符 */}
                  {Array.from({ length: pendingImages }).map((_, index) => (
                    <div key={`pending-${index}`} className="relative mb-4">
                      <div 
                        className="w-[256px] h-[200px] bg-gray-100 rounded-md border border-gray-200 flex items-center justify-center"
                      >
                        <div className="flex flex-col items-center gap-3">
                          <div className="animate-spin rounded-full h-8 w-8 border-2 border-t-blue-500 border-r-transparent border-b-blue-500 border-l-transparent" />
                          <span className="text-sm text-gray-400">生成中...</span>
                        </div>
                      </div>
                      
                      {/* 占位符的时间和耗时区域 */}
                      <div className="mt-2 text-xs text-gray-300 flex justify-between items-center">
                        <span>--:--:--</span>
                        <span>耗时 --秒</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : imgUrl ? (
              <div className="relative">
                {/* 单图预览（保留原有逻辑，向后兼容） */}
                {/* 顶部信息区 - 模型和尺寸 */}
                <div className="flex items-center mb-3 text-gray-800">
                  <div className="bg-blue-500 text-white p-1.5 rounded-full mr-2">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <span className="text-sm font-medium">{generationInfo.usedModel}</span>
                  <span className="text-xs text-gray-500 ml-2">{dimensions.width}x{dimensions.height}</span>
                </div>
                
                {/* 提示词显示 */}
                <div className="text-gray-700 text-sm mb-3">
                  {prompt}
                </div>

                {/* 生成的图片 - 调整缩略图尺寸 */}
                <div className="mb-3 relative inline-block group">
                  <div className="relative cursor-pointer">
                    <img 
                      src={imgUrl} 
                      alt={prompt || "AI生成图片"} 
                      className="w-[256px] object-contain rounded-md border border-gray-200" 
                      style={{ height: 'auto' }}
                      onDoubleClick={() => openImageOverlay(imgUrl)}
                    />
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                      <div className="bg-black bg-opacity-50 text-white px-3 py-1.5 rounded text-sm backdrop-blur-sm">
                        双击查看原图
                      </div>
                    </div>
                  </div>
                  
                  {/* 生成时间和耗时 - 移到图片下方 */}
                  <div className="mt-2 text-xs text-gray-500 flex justify-between items-center w-full">
                    <span>{generationInfo.startTime}</span>
                    <span>耗时 {generationInfo.duration}秒</span>
                  </div>
                  
                  {/* 图片操作按钮组 - 放在图片右侧 */}
                  <div className="absolute right-[-60px] top-0 flex flex-col gap-2">
                    <button 
                      className="bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-full"
                      onClick={handleGenerate}
                      title="重新生成"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M1 4v6h6M23 20v-6h-6M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>
                    <button 
                      className="bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-full"
                      onClick={() => {
                        if (imgUrl) navigator.clipboard.writeText(imgUrl);
                        toast({ title: "图片链接已复制" });
                      }}
                      title="复制链接"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <rect x="8" y="2" width="8" height="4" rx="1" ry="1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>
                    <button
                      className="bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-full"
                      onClick={async () => {
                        if (!imgUrl) return;
                        try {
                          // 先尝试使用 fetch + blob 方式（可以自定义文件名）
                          const response = await fetch(imgUrl);
                          const blob = await response.blob();
                          const downloadUrl = window.URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = downloadUrl;
                          a.download = generateFileName(prompt, generationInfo.usedModel);
                          document.body.appendChild(a);
                          a.click();
                          window.URL.revokeObjectURL(downloadUrl);
                          document.body.removeChild(a);
                          toast({ title: "图片已下载" });
                        } catch (e) {
                          // 如果 fetch 失败（可能是 CORS 问题），回退到直接下载
                          console.warn('Fetch 下载失败，尝试直接下载', e);
                          try {
                            const a = document.createElement('a');
                            a.href = imgUrl;
                            a.download = generateFileName(prompt, generationInfo.usedModel);
                            a.target = '_blank';
                            document.body.appendChild(a);
                            a.click();
                            document.body.removeChild(a);
                            toast({ title: "图片已下载（文件名可能不同）" });
                          } catch (err) {
                            console.error('下载失败', err);
                            toast({ title: "下载失败", description: "请直接右键图片另存为" });
                          }
                        }
                      }}
                      title="下载图片"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>
                  </div>
                </div>
                
                {/* 展开/折叠按钮 */}
                <button className="text-gray-500 hover:text-gray-700 mt-2">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M13 9l3 3-3 3M8 9l-3 3 3 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center py-20">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M4 16L8.586 11.414C8.96106 11.0391 9.46967 10.8284 10 10.8284C10.5303 10.8284 11.0389 11.0391 11.414 11.414L16 16M14 14L15.586 12.414C15.9611 12.0391 16.4697 11.8284 17 11.8284C17.5303 11.8284 18.0389 12.0391 18.414 12.414L20 14M14 8H14.01M6 20H18C18.5304 20 19.0391 19.7893 19.4142 19.4142C19.7893 19.0391 20 18.5304 20 18V6C20 5.46957 19.7893 4.96086 19.4142 4.58579C19.0391 4.21071 18.5304 4 18 4H6C5.46957 4 4.96086 4.21071 4.58579 4.58579C4.21071 4.96086 4 5.46957 4 6V18C4 18.5304 4.21071 19.0391 4.58579 19.4142C4.96086 19.7893 5.46957 20 6 20Z" stroke="#888" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <p className="text-gray-600 text-lg font-medium mt-4">这里将显示生成的图片</p>
                <p className="text-gray-500 text-sm max-w-md mt-2">
                  在左侧输入提示词并调整参数，然后点击"生成图片"按钮开始创建
                </p>
              </div>
            )}
          </div>
          
          {/* 历史记录区域 - 现在使用固定底部设计 */}
          <div className={`border-t border-gray-200 bg-white flex-shrink-0 history-container md:max-h-[160px] overflow-hidden mobile-history ${
            historyCollapsed 
              ? 'max-h-[40px] min-h-[40px]' 
              : 'max-h-[160px] min-h-[110px] md:min-h-[130px]'
          }`}>
            <div className="flex justify-between items-center p-3 cursor-pointer" 
                 onClick={() => setHistoryCollapsed(!historyCollapsed)}>
              <h3 className="text-sm font-medium text-gray-700 flex items-center">
                <span>历史记录</span>
                {history.length > 0 && (
                  <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded-full">
                    {history.length}
                  </span>
                )}
              </h3>
              <div className="flex gap-2 items-center">
                {!historyCollapsed && history.length > 0 && (
                  <button 
                    className="text-xs text-gray-500 hover:text-gray-700"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm("确定要清空所有历史记录吗？此操作不可恢复。")) {
                        setHistory([]);
                        saveHistoryToLocalStorage([]);
                        toast({ title: "历史记录已清空" });
                      }
                    }}
                  >
                    清空
                  </button>
                )}
                <svg 
                  width="20" 
                  height="20" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                  className="text-gray-400"
                >
                  {/* 根据折叠状态显示不同的箭头方向 */}
                  {historyCollapsed ? (
                    <polyline points="6 15 12 9 18 15"></polyline> // 收起状态时显示向下的箭头，表示可展开
                  ) : (
                    <polyline points="6 9 12 15 18 9"></polyline> // 展开状态时显示向上的箭头，表示可收起
                  )}
                </svg>
              </div>
            </div>
            
            {!historyCollapsed && (
              <div className="px-4 pb-3 overflow-y-auto overflow-scroll-fix" style={{maxHeight: "110px"}}>
                {history.length > 0 ? (
                  <div className="flex gap-3 overflow-x-auto pb-2">
                    {history.map((item, index) => (
                      <div key={index} className="relative min-w-[100px] flex-shrink-0 cursor-pointer hover:opacity-90 transform hover:scale-105 transition-all group">
                        <img 
                          src={item.imgUrl} 
                          alt={item.prompt} 
                          className="w-[100px] h-[100px] object-cover rounded-md border border-gray-200"
                          onClick={(e) => {
                            e.stopPropagation(); // 阻止事件冒泡到外层div，避免触发收起操作
                            handleHistoryItemClick(item);
                          }} 
                        />
                        {/* 多图标记 */}
                        {item.imageCount && item.imageCount > 1 && (
                          <div className="absolute top-1 right-1 bg-black bg-opacity-60 text-white rounded-md px-1 text-xs">
                            {item.imageCount}张
                          </div>
                        )}
                        <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-60 text-white text-xs p-1 truncate rounded-b-md">
                          {item.prompt.substring(0, 10)}{item.prompt.length > 10 ? '...' : ''}
                        </div>
                        
                        {/* 悬停显示更多信息 - 添加点击事件以支持点击功能 */}
                        <div 
                          className="absolute inset-0 bg-black bg-opacity-75 rounded-md opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-2 text-white text-xs"
                          onClick={(e) => {
                            e.stopPropagation(); // 阻止事件冒泡到外层div，避免触发收起操作
                            handleHistoryItemClick(item);
                          }}
                        >
                          <div className="flex justify-between">
                            <span>{item.model.split('-').pop()}</span>
                            <span>{item.size}</span>
                          </div>
                          <div className="overflow-hidden">
                            <p className="line-clamp-3 text-xs leading-tight">{item.prompt}</p>
                          </div>
                          <div className="flex justify-between mt-1">
                            <span>{item.time.split(' ')[1]}</span>
                            <button
                              className="text-xs text-red-300 hover:text-red-100"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (confirm("确定要删除这条记录吗？")) {
                                  const newHistory = history.filter((_, i) => i !== index);
                                  setHistory(newHistory);
                                  saveHistoryToLocalStorage(newHistory);
                                  toast({ title: "已删除该记录" });
                                }
                              }}
                            >
                              删除
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center justify-center py-4 text-gray-500">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="mr-2">
                      <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <span className="text-sm">暂无历史记录，生成的图片将自动保存在这里</span>
                  </div>
                )}
              </div>
            )}
          </div>
          
          {/* 调试按钮已移至顶部导航栏 */}
        </div>
      </div>
      
      {/* 版权信息 - 移至页面最底部 */}
      <div className="bg-white border-t border-gray-200 py-4 px-4 text-center text-xs text-gray-400 flex items-center justify-center gap-2 w-full flex-shrink-0 footer-copyright">
        <span>© {new Date().getFullYear()} Powered by Lovable</span>
        <span>|</span>
        <a 
          href="https://github.com/kevin1sMe/paintbot-hub" 
          target="_blank" 
          rel="noopener noreferrer" 
          className="text-gray-500 hover:text-gray-700 flex items-center gap-1"
        >
          <svg height="16" width="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/>
          </svg>
          <span>GitHub</span>
        </a>
      </div>
      
      {/* 调试面板内容 - 保持隐藏状态 */}
      <div id="debug-panel" className="hidden">
        <DebugPanel logs={logs} clearLogs={clearLogs} />
      </div>
      {/* 全屏图片预览浮层 */}
      {showFullImage && fullImageUrl && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 cursor-pointer"
          onClick={() => setShowFullImage(false)}
          style={{ 
            position: 'fixed', 
            top: 0, 
            left: 0, 
            right: 0, 
            bottom: 0,
            animation: 'fadeIn 0.3s ease-in-out',
            zIndex: 9999
          }}
        >
          <div className="relative max-w-[95vw] max-h-[95vh] flex items-center justify-center">
            <img 
              src={fullImageUrl} 
              alt="全屏预览" 
              className="max-w-full max-h-full object-contain"
            />
            <button
              className="absolute top-4 right-4 bg-black bg-opacity-50 text-white rounded-full p-2 hover:bg-opacity-70 transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                setShowFullImage(false);
              }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
          <style dangerouslySetInnerHTML={{__html: `
            @keyframes fadeIn {
              from { opacity: 0; }
              to { opacity: 1; }
            }
          `}} />
        </div>
      )}
    </div>
  );
};

export default Index;
