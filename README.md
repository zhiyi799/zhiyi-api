# 知意 API · 免费接口平台

一个免费、免 Key、开箱即用的 API 接口平台，参考 api.aa1.cn 等站点的形态构建：**接口注册表驱动**，文档站 UI 与接口服务同仓部署，新增接口只需在注册表加一条记录，首页、文档页、接口列表自动生成。

- **31 个接口**：文案类 8 · 工具类 14 · 资讯生活类 9，外加接口列表 `/api/list`
- **统一返回格式**：`{ "code": 200, "msg": "success", "data": ... }`，错误时 `code` 为对应错误码、`msg` 说明原因
- **全部接口支持 CORS**，可直接在浏览器前端调用
- 文档站内置「在线测试」，可直接在页面上发请求看返回

## 快速开始

```bash
npm install   # 安装依赖（express、qrcode）
npm start     # 启动服务，默认端口 3000
```

启动后：

- 文档站首页：http://localhost:3000/
- 接口文档页：http://localhost:3000/doc.html?id=weather
- 接口列表 JSON：http://localhost:3000/api/list

### 环境变量

| 变量 | 说明 | 默认值 |
| --- | --- | --- |
| `PORT` | 服务监听端口 | `3000` |

```bash
PORT=8080 npm start
```

## 接口一览

### 文案类（本地语料）

| 接口 | 地址 | 说明 |
| --- | --- | --- |
| 一言 | `GET /api/yiyan` | 随机一句一言文案 |
| 毒鸡汤 | `GET /api/dujitang` | 随机一句毒鸡汤 |
| 土味情话 | `GET /api/qinghua` | 随机一句土味情话 |
| 舔狗日记 | `GET /api/tiangou` | 随机一篇舔狗日记 |
| 随机笑话 | `GET /api/joke` | 随机一个笑话 |
| 谜语 | `GET /api/miyu` | 随机谜语，`answer=1` 时返回谜底 |
| 名人名言 | `GET /api/mingyan` | 名言 + 作者 |
| 随机诗句 | `GET /api/shici` | 随机古典诗词 |

### 工具类

| 接口 | 地址 | 说明 |
| --- | --- | --- |
| Base64 编解码 | `GET /api/base64?text=hello&type=encode` | type=encode/decode |
| 哈希计算 | `GET /api/hash?text=hello&type=sha256` | md5/sha1/sha256/sha512 |
| UUID 生成 | `GET /api/uuid?count=3` | 批量生成 UUID v4 |
| 随机密码 | `GET /api/password?length=16&symbols=true` | 随机强密码 |
| 时间戳转换 | `GET /api/timestamp` / `?ts=1763539200` | 当前时间戳 / 时间戳转北京时间 |
| 颜色转换 | `GET /api/color?hex=FF5733` | HEX ↔ RGB，附 HSL |
| URL 编解码 | `GET /api/url?text=你好&type=encode` | URL 编码/解码 |
| 二维码生成 | `GET /api/qrcode?text=https://example.com` | 直接返回 PNG 图片 |
| IP 归属地 | `GET /api/ip?ip=223.5.5.5` | 不传 ip 查调用方 |
| 域名 Whois | `GET /api/whois?domain=example.com` | 注册商、创建/到期时间 |
| 网站状态检测 | `GET /api/site/status?url=https://example.com` | 状态码 + 耗时 |
| 网站标题获取 | `GET /api/site/title?url=https://example.com` | 抓取 `<title>` |
| TCPing 测速 | `GET /api/tcping?host=1.1.1.1&port=443` | 3 次 TCP 连接测速 |
| 常用端口扫描 | `GET /api/portscan?host=127.0.0.1` | 扫 21/22/80/443/3306/6379/8080/8888 |

### 资讯生活类（免 key 公共数据源）

| 接口 | 地址 | 说明 |
| --- | --- | --- |
| 天气预报 | `GET /api/weather?city=北京` | 未来 7 天预报（Open-Meteo） |
| 历史上的今天 | `GET /api/history` | 维基百科 on this day |
| 百度热搜 | `GET /api/hot/baidu` | 百度实时热搜榜 |
| B站热门 | `GET /api/hot/bilibili` | B 站热门视频前 20 |
| 微博热搜 | `GET /api/hot/weibo` | 微博热搜（数据源常需登录，失败优雅报错） |
| 网易云热歌榜 | `GET /api/music/netease` | 热歌榜前 20 首 |
| 手机号归属地 | `GET /api/phone?num=13800138000` | 归属地 + 运营商 |
| 汇率换算 | `GET /api/exchange?from=USD&to=CNY&amount=100` | 实时汇率 |
| 随机图片 | `GET /api/image/random?type=anime` | 302 跳转：anime/scenery/avatar |

### 其他

| 接口 | 地址 | 说明 |
| --- | --- | --- |
| 接口列表 | `GET /api/list` | 返回全部接口注册表 JSON |

调用示例：

```bash
curl "http://localhost:3000/api/weather?city=北京"
curl "http://localhost:3000/api/hash?text=hello&type=sha256"
```

## 目录结构

```
zhiyi-api/
├── server.js            # 入口：读注册表挂路由、CORS、统一返回、静态托管
├── lib/
│   ├── registry.js      # 接口注册表（id/名称/路径/分类/参数/示例/处理函数）
│   ├── data.js          # 文案类本地语料
│   ├── utils.js         # 带超时的 fetch、ApiError 等工具
│   └── handlers/
│       ├── text.js      # 文案类处理函数
│       ├── tools.js     # 工具类处理函数
│       └── life.js      # 资讯生活类处理函数
├── public/              # 文档站（原生 HTML/CSS/JS，无框架）
│   ├── index.html       # 首页：Hero、统计、搜索、分类卡片网格
│   ├── doc.html         # 文档页：参数表、返回示例、在线测试
│   ├── app.js           # 首页逻辑（数据来自 /api/list）
│   └── style.css
├── package.json
└── LICENSE
```

## 如何新增接口

1. 在 `lib/handlers/` 对应分类文件里写处理函数（返回数据对象即可，抛 `ApiError` 表示错误）；
2. 在 `lib/registry.js` 加一条记录（参数、示例都写全）；
3. 重启服务 —— 首页卡片、文档页、`/api/list` 全部自动出现，无需改前端。

## 许可

MIT © 知意
