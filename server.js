// 知意 API —— 服务入口：读注册表挂路由，托管文档站静态文件
const path = require('path');
const express = require('express');
const registry = require('./lib/registry');
const { ApiError } = require('./lib/utils');

const app = express();
const PORT = process.env.PORT || 3000;

// CORS：全部接口开放跨域
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const ok = (res, data) => res.json({ code: 200, msg: 'success', data });
const fail = (res, code, msg) => res.status(code >= 400 && code < 600 ? code : 500).json({ code, msg, data: null });

// /api/list：返回全部注册表（不含处理函数）
app.get('/api/list', (req, res) => {
  const list = registry.map(({ handler, ...meta }) => meta);
  ok(res, { total: list.length, list });
});

// 按注册表挂载每个接口
for (const api of registry) {
  app[api.method.toLowerCase()](api.path, async (req, res) => {
    try {
      const params = { ...req.query, ...req.body };
      const data = await api.handler(params, req);
      if (data && data.__png) {
        res.setHeader('Content-Type', 'image/png');
        return res.send(data.__png);
      }
      if (data && data.__redirect) return res.redirect(302, data.__redirect);
      ok(res, data);
    } catch (e) {
      if (e instanceof ApiError) return fail(res, e.code, e.message);
      console.error(`[${api.path}]`, e);
      fail(res, 500, '服务器内部错误：' + e.message);
    }
  });
}

// 文档站静态文件
app.use(express.static(path.join(__dirname, 'public')));

// 未匹配的 /api/* 返回统一 404
app.use('/api', (req, res) => fail(res, 404, '接口不存在，请查看 /api/list'));

app.listen(PORT, () => {
  console.log(`知意 API 已启动：http://localhost:${PORT}（共 ${registry.length} 个接口，列表见 /api/list）`);
});
