# 风险地理信息系统 - 前端

## 项目简介

风险地理信息系统（Risk GIS）前端项目，基于 Vue3 + TypeScript + OpenLayers + 高德地图API 构建，提供 GIS 空间分析、灾害风险评估、AI 辅助分析等功能。

## 技术栈

- **框架**: Vue 3.3+
- **语言**: TypeScript 5.2+
- **构建工具**: Vite 4.4+
- **GIS地图**: OpenLayers 7.5+
- **地图服务**: 高德地图 API
- **状态管理**: Pinia 2.1+
- **UI组件库**: Element Plus 2.3+
- **HTTP客户端**: Axios 1.5+
- **样式**: SCSS

## 项目结构

```
src/
├── assets/                    # 静态资源
│   ├── styles/               # 样式文件
│   └── images/               # 图片资源
├── components/               # 通用组件
│   ├── Map/                  # 地图组件
│   ├── Charts/               # 图表组件
│   └── Common/               # 通用UI组件
├── views/                    # 页面组件
│   ├── Dashboard/            # 仪表盘
│   ├── GIS/                  # GIS分析
│   ├── Risk/                 # 风险评估
│   ├── Disaster/             # 灾害预警
│   └── Insurance/            # 承保理赔
├── services/                 # API服务
│   ├── api.ts                # API客户端
│   ├── gisService.ts         # GIS服务
│   ├── riskService.ts        # 风险服务
│   └── amapService.ts        # 高德地图服务
├── store/                    # 状态管理
│   ├── index.ts              # Pinia配置
│   ├── mapStore.ts           # 地图状态
│   └── riskStore.ts          # 风险状态
├── utils/                    # 工具函数
│   ├── mapUtils.ts           # 地图工具
│   ├── dataUtils.ts          # 数据处理工具
│   └── request.ts            # 请求工具
├── router/                   # 路由配置
│   └── index.ts              # 路由定义
├── App.vue                   # 根组件
└── main.ts                   # 入口文件
```

## 快速开始

### 环境要求

- Node.js >= 16.0.0
- npm >= 8.0.0 或 yarn >= 1.22.0

### 安装依赖

```bash
npm install
```

### 配置高德地图API

1. 访问 [高德开放平台](https://lbs.amap.com/) 注册账号
2. 创建应用，获取 API Key
3. 在 `src/services/amapService.ts` 中替换 `YOUR_AMAP_KEY`

### 启动开发服务器

```bash
npm run dev
```

访问 http://localhost:3000

### 构建生产版本

```bash
npm run build
```

## 功能模块

### 1. 仪表盘
- 承保标的数量统计
- 高风险区域统计
- 灾害预警统计
- 全国风险概览地图

### 2. GIS分析
- 地图可视化
- 图层控制
- 绘图工具
- 空间查询
- 空间分析
- 数据导出

### 3. 灾害预警
- 灾害类型筛选
- 时间范围筛选
- 预警列表展示

## 相关文档

- [Vue 3 官方文档](https://vuejs.org/)
- [OpenLayers 官方文档](https://openlayers.org/)
- [高德地图 API 文档](https://lbs.amap.com/)
- [Element Plus 官方文档](https://element-plus.org/)
- [Pinia 官方文档](https://pinia.vuejs.org/)
