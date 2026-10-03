// Run with: playwright-cli run-code --filename=tests/ui-models.js
async page => {
  const cases = [
    ['openai', 'gpt-image-2.5-sunburst', '1536x1024'],
    ['cogview', 'glm-image', '1280x1280'],
    ['wanx', 'qwen-image-3.0-pro', '2048x2048'],
    ['wanx', 'wan2.7-image-pro', '4096x4096'],
    ['wanx', 'wan2.6-t2i', '1280x1280'],
    ['doubaoimg', 'doubao-seedream-5-0-flash-260915', '2048x2048'],
    ['qianfan', 'ernie-image-turbo', '1024x1024'],
    ['minimax', 'image-01-live', '832x1248'],
    ['gemini', 'gemini-3.1-flash-lite-image', '1024x1024'],
  ];
  await page.reload();
  for (const [provider, model, size] of cases) {
    await page.locator('select').nth(0).selectOption(provider);
    await page.locator('select').nth(1).selectOption(model);
    await page.getByRole('button', { name: size, exact: true }).click();
    if (await page.getByText('请选择当前模型支持的预设尺寸', { exact: true }).count()) {
      throw new Error(`${model} rejected size ${size}`);
    }
    if (['wan2.7-image-pro', 'doubao-seedream-5-0-flash-260915'].includes(model) &&
        await page.getByPlaceholder('低分辨率、错误、最差质量、低质量、残缺、多余的手指、比例不良等').count()) {
      throw new Error(`${model} incorrectly offers a negative prompt`);
    }
  }
  for (const [provider, saved, expected] of [
    ['openai', 'dall-e-2', 'gpt-image-2.5-sunburst'],
    ['gemini', 'nano-banana-2', 'gemini-3.1-flash-image'],
    ['doubaoimg', 'seedream-5.0-lite', 'doubao-seedream-5-0-lite-260128'],
  ]) {
    await page.evaluate(({ provider, saved }) => localStorage.setItem('user_preferences', JSON.stringify({ model: provider, subModel: saved })), { provider, saved });
    await page.reload();
    await page.waitForFunction(expected => JSON.parse(localStorage.getItem('user_preferences')).subModel === expected, expected);
    if (await page.locator('select').nth(1).inputValue() !== expected) throw new Error(`Failed to migrate ${saved}`);
  }
  const image = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aM1sAAAAASUVORK5CYII=';
  const imageUrl = `data:image/png;base64,${image}`;
  const fixtures = [
    ['https://api.openai.com/v1/images/generations', { data: [{ b64_json: image }] }],
    ['https://open.bigmodel.cn/api/paas/v4/images/generations', { data: [{ url: imageUrl }] }],
    ['https://dashscope.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation', { output: { choices: [{ message: { content: [{ image: imageUrl }] } }] } }],
    ['https://qianfan.baidubce.com/v2/images/generations', { data: [{ url: imageUrl }] }],
    ['https://ark.cn-beijing.volces.com/api/v3/images/generations', { data: [{ url: imageUrl }] }],
    ['https://api.minimax.io/v1/image_generation', { data: { image_urls: [imageUrl] } }],
    ['https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite-image:generateContent', { candidates: [{ content: { parts: [{ inlineData: { mimeType: 'image/png', data: image } }] } }] }],
  ];
  for (const [url, response] of fixtures) {
    await page.route(url, route => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(response) }));
  }
  await page.evaluate(() => {
    for (const key of ['openai_key', 'zhipuai_key', 'aliyun_wanx_key', 'baidu_qianfan_key', 'volcengine_key', 'minimax_key', 'gemini_key']) localStorage.setItem(key, 'test-key');
  });
  await page.reload();
  for (const [provider, model] of cases.filter(([, model]) => !['wan2.7-image-pro', 'wan2.6-t2i'].includes(model))) {
    await page.locator('select').nth(0).selectOption(provider);
    await page.locator('select').nth(1).selectOption(model);
    await page.getByPlaceholder('一只彩虹色的猫').fill('A small orange cat');
    await page.getByRole('button', { name: '生成图片', exact: true }).click();
    await page.waitForFunction(model => JSON.parse(localStorage.getItem('image_generation_history') || '[]')[0]?.model === model, model);
  }
  await page.unrouteAll();
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  return `PASS ${cases.length} model/size selections, 3 saved-model migrations and 7 mocked generation flows`;
}
