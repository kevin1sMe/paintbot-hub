import { afterEach, test } from 'node:test';
import assert from 'node:assert/strict';
import { MODELS, supportsNegativePrompt } from '../src/services/models/index.ts';
import { getProvider, getProviderByModel } from '../src/services/providers/index.ts';
import { getAPIKeyFromEnv } from '../src/config/env.ts';

globalThis.window = { __RUNTIME_CONFIG__: {} };
globalThis.localStorage = { getItem: () => 'test-key', setItem() {} };
const originalFetch = globalThis.fetch;
afterEach(() => {
  globalThis.fetch = originalFetch;
  window.__RUNTIME_CONFIG__ = {};
});

function intercept(responses = [{ data: [{ url: 'https://example.com/image.png' }] }]) {
  const requests = [];
  globalThis.fetch = async (url, options = {}) => {
    requests.push({ url, ...options, body: options.body ? JSON.parse(options.body) : undefined });
    return new Response(JSON.stringify(responses.shift()), { status: 200 });
  };
  return requests;
}

function generate(model, imageSize = '1024x1024', negativePrompt) {
  return getProviderByModel(model).generateImage({ model, imageSize, prompt: '一只猫', negativePrompt, addLog() {} });
}

test('every selectable model resolves to its configured provider', () => {
  for (const provider of MODELS) {
    for (const model of provider.children) {
      assert.equal(getProviderByModel(model.value).config.value, provider.value, model.value);
    }
  }
});

for (const model of ['gpt-image-2.5-sunburst', 'gpt-image-2.5-flare', 'gpt-image-2', 'gpt-image-1.5', 'gpt-image-1-mini']) {
  test(`OpenAI preserves the API model ID for ${model}`, async () => {
    const requests = intercept([{ data: [{ b64_json: 'aW1hZ2U=' }] }]);
    assert.equal(await generate(model, '1536x1024'), 'data:image/png;base64,aW1hZ2U=');
    assert.equal(requests[0].body.model, model);
    assert.equal(requests[0].body.size, '1536x1024');
    assert.equal(requests[0].body.quality, 'medium');
    assert.equal(requests[0].body.response_format, undefined);
    assert.ok(getProviderByModel(model).getSupportedSizes(model).some(size => size.width === 1536));
  });
}

test('OpenAI still translates saved quality variants and honors its configured endpoint', async () => {
  window.__RUNTIME_CONFIG__ = { OPENAI_API_BASE_URL: 'https://example.com/v1/' };
  const requests = intercept();
  await generate('gpt-image-1-low');
  assert.equal(requests[0].url, 'https://example.com/v1/images/generations');
  assert.equal(requests[0].body.model, 'gpt-image-1');
  assert.equal(requests[0].body.quality, 'low');
});

test('retired DALL-E models are no longer selectable', () => {
  assert.ok(MODELS.find(provider => provider.value === 'openai').children.every(model => !model.value.startsWith('dall-e-')));
});

for (const [model, apiModel] of [
  ['nano-banana-2', 'gemini-3.1-flash-image'],
  ['nano-banana-pro', 'gemini-3-pro-image'],
  ['gemini-3.1-flash-lite-image', 'gemini-3.1-flash-lite-image'],
]) {
  test(`Gemini uses its API ID and requests images for ${model}`, async () => {
    const requests = intercept([{ candidates: [{ content: { parts: [
      { text: 'Here is the image' },
      { inlineData: { mimeType: 'image/jpeg', data: 'aW1hZ2U=' } },
    ] } }] }]);
    assert.equal(await generate(model), 'data:image/jpeg;base64,aW1hZ2U=');
    assert.equal(requests[0].url, `https://generativelanguage.googleapis.com/v1beta/models/${apiModel}:generateContent`);
    assert.equal(requests[0].headers['x-goog-api-key'], 'test-key');
    assert.deepEqual(requests[0].body.generationConfig.responseModalities, ['TEXT', 'IMAGE']);
    assert.equal(requests[0].body.generationConfig.imageConfig.aspectRatio, '1:1');
  });
}

for (const model of ['qwen-image-3.0-pro', 'qwen-image-2.0-pro', 'wan2.7-image-pro', 'wan2.6-t2i']) {
  test(`DashScope uses synchronous multimodal generation for ${model}`, async () => {
    const requests = intercept([{ output: { choices: [{ message: { content: [{ image: 'https://example.com/image.png' }] } }] } }]);
    assert.equal(await generate(model, '1024x1024', '模糊'), 'https://example.com/image.png');
    assert.equal(requests[0].url, 'https://dashscope.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation');
    assert.equal(requests[0].headers['X-DashScope-Async'], undefined);
    assert.equal(requests[0].body.parameters.size, '1024*1024');
    assert.equal(requests[0].body.parameters.negative_prompt, model.startsWith('qwen-') || model === 'wan2.6-t2i' ? '模糊' : undefined);
    assert.deepEqual(requests[0].body.input.messages, [{ role: 'user', content: [{ text: '一只猫' }] }]);
  });
}

test('Wan 2.6 Image text-only input uses one-image interleave tasks', async () => {
  const requests = intercept([
    { output: { task_id: 'task-2' } },
    { output: { task_status: 'SUCCEEDED', choices: [{ message: { content: [
      { text: 'A cat' }, { image: 'https://example.com/image.png' },
    ] } }] } },
  ]);
  assert.equal(await generate('wan2.6-image'), 'https://example.com/image.png');
  assert.equal(requests[0].url, 'https://dashscope.aliyuncs.com/api/v1/services/aigc/image-generation/generation');
  assert.equal(requests[0].body.parameters.enable_interleave, true);
  assert.equal(requests[0].body.parameters.max_images, 1);
  assert.equal(requests[0].headers['X-DashScope-Async'], 'enable');
  assert.deepEqual(requests[0].body.input.messages, [{ role: 'user', content: [{ text: '一只猫' }] }]);
});

test('legacy Wan tasks use the task API and star separated dimensions', async () => {
  const requests = intercept([
    { output: { task_id: 'task-1' } },
    { output: { task_status: 'SUCCEEDED', results: [{ url: 'https://example.com/image.png' }] } },
  ]);
  assert.equal(await generate('wanx2.1-t2i-turbo'), 'https://example.com/image.png');
  assert.equal(requests[0].body.parameters.size, '1024*1024');
  assert.equal(requests[1].url, 'https://dashscope.aliyuncs.com/api/v1/tasks/task-1');
});

test('DashScope honors workspace endpoints', async () => {
  window.__RUNTIME_CONFIG__ = { ALIYUN_WANX_BASE_URL: 'https://workspace.cn-beijing.maas.aliyuncs.com/api/v1/' };
  const requests = intercept([{ output: { choices: [{ message: { content: [{ image: 'https://example.com/image.png' }] } }] } }]);
  await generate('qwen-image-3.0-pro');
  assert.equal(requests[0].url, 'https://workspace.cn-beijing.maas.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation');
});

for (const model of ['doubao-seedream-5-0-flash-260915', 'doubao-seedream-5-0-pro-260628', 'doubao-seedream-5-0-lite-260128']) {
  test(`Seedream uses Ark bearer authentication for ${model}`, async () => {
    const requests = intercept();
    await generate(model, '2048x2048', '模糊');
    assert.equal(requests[0].url, 'https://ark.cn-beijing.volces.com/api/v3/images/generations');
    assert.equal(requests[0].headers.Authorization, 'Bearer test-key');
    assert.equal(requests[0].body.model, model);
    assert.equal(requests[0].body.size, '2048x2048');
    assert.equal(requests[0].body.negative_prompt, undefined);
    assert.equal(supportsNegativePrompt(model), false);
    assert.ok(getProviderByModel(model).getSupportedSizes(model).every(size => size.width * size.height >= 3686400));
  });
}

test('saved Seedream aliases resolve to the correct Ark model', async () => {
  const requests = intercept();
  await generate('seedream-5.0-lite', '2048x2048');
  assert.equal(requests[0].body.model, 'doubao-seedream-5-0-lite-260128');
});

test('GLM-Image offers its documented recommended sizes', () => {
  assert.ok(getProvider('cogview').getSupportedSizes('glm-image').some(size => size.width === 1280 && size.height === 1280));
});

test('the selected aspect ratio recommends the closest supported size', () => {
  assert.deepEqual(getProvider('doubaoimg').getRecommendedSize('doubao-seedream-5-0-flash-260915', 4 / 3), { width: 2304, height: 1728 });
  assert.deepEqual(getProvider('gemini').getRecommendedSize('gemini-3.1-flash-image', 16 / 9), { width: 1344, height: 768 });
});

test('negative prompt overrides disable unsupported Wan and Z-Image parameters', () => {
  assert.equal(supportsNegativePrompt('wan2.7-image-pro'), false);
  assert.equal(supportsNegativePrompt('z-image-turbo'), false);
  assert.equal(supportsNegativePrompt('qwen-image-3.0-pro'), true);
});

test('ERNIE Image Turbo resolves to Qianfan and is sent without renaming', async () => {
  const requests = intercept();
  await generate('ernie-image-turbo');
  assert.equal(requests[0].body.model, 'ernie-image-turbo');
});

test('MiniMax Image Live uses documented aspect ratios', async () => {
  const requests = intercept([{ data: { image_urls: ['https://example.com/image.png'] } }]);
  await generate('image-01-live', '832x1248');
  assert.equal(requests[0].body.model, 'image-01-live');
  assert.equal(requests[0].body.aspect_ratio, '2:3');
  assert.ok(!getProvider('minimax').getSupportedSizes('image-01-live').some(size => size.width === 1344 && size.height === 576));
});

test('Gemini, MiniMax and Ark accept runtime environment credentials', () => {
  window.__RUNTIME_CONFIG__ = { GEMINI_API_KEY: 'gemini', MINIMAX_API_KEY: 'minimax', ARK_API_KEY: 'ark' };
  assert.equal(getAPIKeyFromEnv('gemini_key'), 'gemini');
  assert.equal(getAPIKeyFromEnv('minimax_key'), 'minimax');
  assert.equal(getAPIKeyFromEnv('volcengine_key'), 'ark');
});
