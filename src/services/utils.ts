/**
 * 服务层工具函数
 */

import { getAPIKeyFromEnv } from '@/config/env';

// 获取时间戳
export function getTimestamp() {
  return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });
}

// 获取API密钥
export function getAPIKey(provider = 'zhipuai_key') {
  // 先从环境变量中获取
  const envKey = getAPIKeyFromEnv(provider);
  if (envKey) {
    return envKey;
  }
  // 如果环境变量中没有，则从localStorage中获取
  return localStorage.getItem(provider) || "";
}

// 设置API密钥
export function setAPIKey(key: string, provider = 'zhipuai_key') {
  // 只有当环境变量中没有对应的密钥时，才允许设置
  if (!getAPIKeyFromEnv(provider)) {
    localStorage.setItem(provider, key);
  }
}

// 安全地处理API密钥显示（掩码处理）
export function maskAPIKey(apiKey: string): string {
  if (!apiKey) return "";
  return apiKey.substring(0, 4) + "..." + apiKey.substring(apiKey.length - 4);
}

// 解析图像尺寸字符串 (如 "1024x768")
export function parseImageSize(sizeStr: string): { width: number, height: number } {
  const [width, height] = sizeStr.split('x').map(Number);
  return { width, height };
}

// SHA-256哈希计算
export async function computeSha256(message: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  return hexEncode(hashBuffer);
}

// HMAC计算
export async function computeHmac(key: ArrayBuffer, message: string): Promise<ArrayBuffer> {
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

// 签名计算
export async function computeSignature(stringToSign: string, secretKey: string, date: string, region: string, service: string): Promise<string> {
  // 修正密钥前缀，直接使用secretKey
  const kSecret = new TextEncoder().encode(secretKey);
  
  // 按照火山引擎文档要求的方式构建签名密钥
  const kDate = await computeHmac(kSecret, date);
  const kRegion = await computeHmac(kDate, region);
  const kService = await computeHmac(kRegion, service);
  const kSigning = await computeHmac(kService, "request");
  
  // 最后计算签名
  const signature = await computeHmac(kSigning, stringToSign);
  return hexEncode(signature);
}

// 将ArrayBuffer转换为十六进制字符串
export function hexEncode(arrayBuffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(arrayBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
} 