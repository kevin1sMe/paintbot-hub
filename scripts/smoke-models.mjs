// Calls the actual providers once per selected model. Credentials stay in memory.
import { spawn } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { MODELS } from '../src/services/models/index.ts';
import { getProviderByModel } from '../src/services/providers/index.ts';

const runtimeConfig = {
  OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  OPENAI_API_BASE_URL: process.env.OPENAI_API_BASE_URL,
  ZHIPU_API_KEY: process.env.ZHIPU_API_KEY,
  BAIDU_API_KEY: process.env.BAIDU_API_KEY,
  ALIYUN_WANX_KEY: process.env.ALIYUN_WANX_KEY || process.env.DASHSCOPE_API_KEY,
  ALIYUN_WANX_BASE_URL: process.env.ALIYUN_WANX_BASE_URL,
  ARK_API_KEY: process.env.ARK_API_KEY,
  GEMINI_API_KEY: process.env.GEMINI_API_KEY,
  MINIMAX_API_KEY: process.env.MINIMAX_API_KEY,
};
globalThis.window = { __RUNTIME_CONFIG__: runtimeConfig };
globalThis.localStorage = { getItem: () => null, setItem() {} };

// curl honors the local HTTPS proxy. Send keys and payload via stdin, never argv.
globalThis.fetch = async (url, options = {}) => {
  const config = [
    `url = ${JSON.stringify(String(url))}`,
    ...Object.entries(options.headers || {}).map(([key, value]) => `header = ${JSON.stringify(`${key}: ${value}`)}`),
    ...(options.body ? [`data = ${JSON.stringify(options.body)}`] : []),
  ].join('\n');
  const child = spawn('curl', ['-q', '--config', '-', '--silent', '--show-error', '--location', '--max-time', '240', '--write-out', '\n%{http_code}'], { stdio: ['pipe', 'pipe', 'pipe'] });
  const chunks = [];
  child.stdout.on('data', chunk => chunks.push(chunk));
  // Do not echo stderr, which can include URLs or third-party responses.
  child.stderr.resume();
  child.stdin.end(config);
  const code = await new Promise((resolve, reject) => {
    child.on('error', reject);
    child.on('close', resolve);
  });
  if (code) throw new Error(`Network transport failed (curl exit ${code})`);
  const output = Buffer.concat(chunks);
  return new Response(output.subarray(0, -4), { status: Number(output.subarray(-3).toString()) });
};

const defaults = [
  'glm-image',
  'gpt-image-2.5-sunburst', 'gpt-image-2.5-flare', 'gpt-image-2', 'gpt-image-1.5', 'gpt-image-1-mini',
  'qwen-image-3.0-pro', 'qwen-image-3.0', 'qwen-image-2.1-pro',
  'qwen-image-2.0-pro-2026-06-22', 'qwen-image-2.0-pro', 'qwen-image-2.0',
  'wan2.7-image-pro', 'wan2.7-image', 'wan2.6-image', 'wan2.6-t2i', 'z-image-turbo',
  'ernie-image-turbo',
  'doubao-seedream-5-0-flash-260915', 'doubao-seedream-5-0-pro-260628', 'doubao-seedream-5-0-lite-260128',
  'image-01', 'image-01-live',
  'gemini-3.1-flash-lite-image', 'gemini-3.1-flash-image', 'gemini-3-pro-image',
];
const selected = process.env.LIVE_MODELS === 'all'
  ? MODELS.flatMap(provider => provider.children.map(model => model.value))
  : process.env.LIVE_MODELS?.split(',') || defaults;
const outputDir = resolve(process.env.LIVE_OUTPUT_DIR || `.local/model-smoke-${new Date().toISOString().replace(/[:.]/g, '-')}`);
await mkdir(outputDir, { recursive: true });
const secrets = Object.entries(runtimeConfig).filter(([name, value]) => name.endsWith('KEY') && value).map(([, value]) => value);
function redact(message) {
  for (const secret of secrets) message = message.replaceAll(secret, '[redacted]');
  return message.replace(/sk-[\w*.-]+/g, '[redacted]').replace(/https?:\/\/[^\s"']+/g, '[url]').slice(0, 600);
}

const results = [];
for (const model of selected) {
  const provider = getProviderByModel(model);
  if (!provider.getApiKey()) {
    results.push({ provider: provider.config.value, model, status: 'SKIP', reason: 'No credential' });
    console.log(`SKIP ${model}: no credential`);
    continue;
  }
  const size = provider.getSupportedSizes(model)[0];
  const started = Date.now();
  let httpStatus;
  let apiCode;
  console.log(`START ${model}`);
  try {
    const image = await provider.generateImage({
      model,
      prompt: 'A small orange cat sitting next to a blue ceramic cup, simple watercolor illustration on a white background, no text.',
      imageSize: `${size.width}x${size.height}`,
      addLog(entry) {
        if (entry.type === 'error') httpStatus = entry.data?.status;
        if (entry.type === 'response') apiCode = entry.data?.error?.code || entry.data?.code;
      },
    });
    let bytes;
    if (image.startsWith('data:')) {
      bytes = Buffer.from(image.split(',')[1], 'base64');
    } else {
      const response = await fetch(image);
      if (!response.ok) throw new Error(`Image download failed: HTTP ${response.status}`);
      bytes = Buffer.from(await response.arrayBuffer());
    }
    const format = bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])) ? 'png'
      : bytes[0] === 255 && bytes[1] === 216 ? 'jpg'
        : bytes.subarray(8, 12).toString() === 'WEBP' ? 'webp' : null;
    if (!format || bytes.length < 100) throw new Error('Response did not contain a valid image signature');
    const artifact = `${model}.${format}`;
    await writeFile(resolve(outputDir, artifact), bytes);
    results.push({ provider: provider.config.value, model, status: 'PASS', seconds: Math.round((Date.now() - started) / 1000), bytes: bytes.length, artifact });
    console.log(`PASS ${model}: ${bytes.length} bytes`);
  } catch (error) {
    results.push({ provider: provider.config.value, model, status: 'FAIL', httpStatus, apiCode, seconds: Math.round((Date.now() - started) / 1000), reason: redact(error.message) });
    console.log(`FAIL ${model}: ${redact(error.message)}`);
  }
  await writeFile(resolve(outputDir, 'results.json'), JSON.stringify(results, null, 2) + '\n');
}
await writeFile(resolve(outputDir, 'results.json'), JSON.stringify(results, null, 2) + '\n');
console.log(`Results: ${outputDir}/results.json`);
console.log(`PASS ${results.filter(result => result.status === 'PASS').length}, FAIL ${results.filter(result => result.status === 'FAIL').length}, SKIP ${results.filter(result => result.status === 'SKIP').length}`);
if (results.some(result => result.status === 'FAIL')) process.exitCode = 1;
