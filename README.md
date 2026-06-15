# youziyi-oss

本仓库是《游子衣》项目的开源代码子集，仅包含可公开的工程源码与规则文档：

- apps/
  - web/：Web 端大屏展示与动效（Vite + React）
  - server/：后端 API（Node.js）
  - miniapp/：微信小程序端
  - harmony/：鸿蒙端工程
- packages/
  - types/：共享 TypeScript 类型定义
- .trae/rules/：项目规则与接口规范（供协作参考）

## 快速开始

本仓库未配置根工作区（workspace）聚合依赖；各端工程按各自目录独立安装与启动。

### Web 端

```bash
cd apps/web
npm install
npm run dev
```

### 后端

```bash
cd apps/server
npm install
npm run dev
```

## 安全与敏感信息

- 任何环境变量文件（如 .env、.env.local）与密钥/证书文件禁止提交。
- 若你需要本地运行配置，请复制示例文件并在本机创建私有配置（例如 apps/server/.env.example -> apps/server/.env）。
- 若发现疑似敏感信息误入提交历史，请立即停止传播并进行清理（包括重写历史）。

## 许可

见 [LICENSE](./LICENSE)。
