# PaintBot Hub

一个集成多个AI绘画平台API的统一操作界面网页，让创作变得更简单。

![PaintBot演示图](./public/paintbot-hub-ui.png)

快速试用：[https://paintbot-hub.lovable.app/](https://paintbot-hub.lovable.app/)

更多的介绍查看 [PaintBot Hub: 一站式AI绘画平台大集成](https://gameapp.club/post/2025-04-24-paintbot-hub/)

## 功能特点

### 🛠 核心功能
- 文本生成图片(Text to Image)
- 支持中文、英文等多语言提示词
- 自定义图片尺寸和比例(支持4:3等多种比例)
- 批量生成多张图片(最多6张)
- 历史记录查看和复用

### 🎨 支持的AI平台
- [x] OpenAI 文生图
  - GPT-Image-1 (高/中/低质量)
  - DALL·E 3 (HD/标准质量)
  - DALL·E 2
- [x] 智谱AI CogView
  - CogView-4-250304
  - CogView-4
  - CogView-3-Flash
  - CogView-3
- [x] 百度千帆
  - irag-1.0
  - flux.1-schnell
- [ ] 阿里云通义万相（开发中）
- [ ] 火山引擎豆包（开发中）
- [ ] 腾讯云文生图（计划中）

### 💡 便捷特性
- 本地保存API密钥，确保安全性
- 生成历史记录保存
- 简洁直观的用户界面
- 实时生成状态显示
- 移动端适配支持

## 本地部署指南

### 使用Docker快速部署
你只需要在本地安装Docker，然后执行以下命令：
```bash
docker run -d -p 8080:8080 kevinlin86/paintbot-hub:latest
```
接着打开浏览器访问 `http://localhost:8080` 即可。

### 使用docker-compose
你可以本地编辑一个这样的文件，或者直接打开Github代码仓库中的[docker-compose.yml](https://github.com/kevin1sMe/paintbot-hub/blob/main/docker-compose.yml)文件并复制过来。

参考`env.example`文件创建一个`.env`文件，修改其中的环境变量。KEY等写不写无所谓，若服务对外开放建议不写。

```yaml
services:
  paintbot:
    image: kevinlin86/paintbot-hub:latest
    container_name: paintbot
    env_file:
      - .env
    ports:
      - "${PORT:-8080}:8080"
    restart: unless-stopped
```
然后执行命令`docker-compose up -d`，接着打开浏览器访问 `http://localhost:8080` 即可。
更多的使用以及未来可能的更新，可以参考[Github项目](https://github.com/kevin1sMe/paintbot-hub)。

## 网页使用指南

1. 首次使用需要配置API密钥
   - 点击设置图标
   - 输入对应平台的API密钥
   - 密钥会安全地保存在本地

2. 生成图片
   - 选择想要使用的AI模型
   - 输入图片描述文本
   - 选择图片尺寸和比例
   - 设置生成数量
   - 点击"生成图片"按钮

3. 查看历史记录
   - 在底部历史记录区域可以查看之前生成的图片
   - 点击历史记录可以快速复用之前的设置

## 开发指南

### 技术栈
- 前端框架：React 18 + Vite
- UI组件：shadcn/ui
- 样式：Tailwind CSS
- 状态管理：React Hooks + Context
- 构建工具：Vite
- 类型系统：TypeScript

### 项目结构
```
src/
  ├── components/     # UI组件
  ├── services/      # API服务
  ├── hooks/         # 自定义Hooks
  ├── lib/           # 工具函数
  └── pages/         # 页面组件
```

### 编译&运行
1. 克隆项目
```bash
git clone https://github.com/kevin1sMe/paintbot-hub.git
cd paintbot-hub
```

2. 安装依赖
```bash
npm install
```

3. 启动开发服务器
```bash
npm run dev
```

## 贡献指南
欢迎提交 Issue 和 Pull Request 来帮助改进项目。

## 许可证
MIT License

## 致谢
- 感谢所有为项目做出贡献的开发者
- 特别感谢 Lovable 平台的支持


