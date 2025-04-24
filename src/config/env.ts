// 环境变量配置
interface EnvConfig {
  OPENAI_API_KEY?: string;
  OPENAI_API_BASE_URL?: string;
  ZHIPU_API_KEY?: string;
  BAIDU_API_KEY?: string;
  BAIDU_SECRET_KEY?: string;
  PROXY_URL?: string;
}

// 从window.__RUNTIME_CONFIG__中获取环境变量
declare global {
  interface Window {
    __RUNTIME_CONFIG__?: EnvConfig;
  }
}

// 获取环境变量
export const getEnvConfig = (): EnvConfig => {
  return window.__RUNTIME_CONFIG__ || {};
};

// 获取特定的API密钥
export const getAPIKeyFromEnv = (provider: string): string => {
  const config = getEnvConfig();
  switch (provider) {
    case 'openai_key':
      return config.OPENAI_API_KEY || '';
    case 'zhipuai_key':
      return config.ZHIPU_API_KEY || '';
    case 'baidu_key':
      return config.BAIDU_API_KEY || '';
    default:
      return '';
  }
};

// 获取OpenAI基础URL
export const getOpenAIBaseUrl = (): string => {
  const config = getEnvConfig();
  return config.OPENAI_API_BASE_URL || 'https://api.openai.com';
};

// 获取代理URL
export const getProxyUrl = (): string => {
  const config = getEnvConfig();
  return config.PROXY_URL || '';
}; 