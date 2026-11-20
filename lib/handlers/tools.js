// 工具类接口
const crypto = require('crypto');
const net = require('net');
const { ApiError, fetchJson, fetchText } = require('../utils');

let QRCode = null;
try { QRCode = require('qrcode'); } catch { QRCode = null; }

function tcpConnect(host, port, timeout = 3000) {
  return new Promise((resolve) => {
    const start = Date.now();
    const socket = new net.Socket();
    let done = false;
    const finish = (ok) => {
      if (done) return;
      done = true;
      socket.destroy();
      resolve({ ok, ms: Date.now() - start });
    };
    socket.setTimeout(timeout);
    socket.once('connect', () => finish(true));
    socket.once('timeout', () => finish(false));
    socket.once('error', () => finish(false));
    socket.connect(port, host);
  });
}

function whoisQuery(server, query) {
  return new Promise((resolve, reject) => {
    const socket = net.connect(43, server, () => socket.write(query + '\r\n'));
    let buf = '';
    socket.setTimeout(8000);
    socket.on('data', (d) => { buf += d.toString(); });
    socket.on('end', () => resolve(buf));
    socket.on('timeout', () => { socket.destroy(); reject(new ApiError(504, 'whois 查询超时')); });
    socket.on('error', (e) => reject(new ApiError(502, 'whois 连接失败：' + e.message)));
  });
}

module.exports = {
  base64: (p) => {
    if (!p.text) throw new ApiError(400, '缺少参数 text');
    const type = p.type || 'encode';
    if (type === 'encode') return { result: Buffer.from(String(p.text), 'utf8').toString('base64'), type };
    if (type === 'decode') {
      try {
        const out = Buffer.from(String(p.text), 'base64').toString('utf8');
        return { result: out, type };
      } catch { throw new ApiError(400, '不是合法的 Base64 字符串'); }
    }
    throw new ApiError(400, 'type 只能是 encode 或 decode');
  },

  hash: (p) => {
    if (!p.text) throw new ApiError(400, '缺少参数 text');
    const type = (p.type || 'md5').toLowerCase();
    if (!['md5', 'sha1', 'sha256', 'sha512'].includes(type)) throw new ApiError(400, 'type 只能是 md5/sha1/sha256/sha512');
    return { result: crypto.createHash(type).update(String(p.text)).digest('hex'), type };
  },

  uuid: (p) => {
    let count = parseInt(p.count, 10) || 1;
    if (count < 1) count = 1;
    if (count > 100) count = 100;
    const uuids = Array.from({ length: count }, () => crypto.randomUUID());
    return { uuids, count };
  },

  password: (p) => {
    let length = parseInt(p.length, 10) || 16;
    if (length < 4) length = 4;
    if (length > 128) length = 128;
    let chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
    if (p.symbols === 'true' || p.symbols === '1') chars += '!@#$%^&*()-_=+[]{}';
    let out = '';
    const bytes = crypto.randomBytes(length);
    for (let i = 0; i < length; i++) out += chars[bytes[i] % chars.length];
    return { password: out, length };
  },

  timestamp: (p) => {
    const fmt = (d) => {
      const bj = new Date(d.getTime() + 8 * 3600 * 1000);
      const pad = (n) => String(n).padStart(2, '0');
      return `${bj.getUTCFullYear()}-${pad(bj.getUTCMonth() + 1)}-${pad(bj.getUTCDate())} ${pad(bj.getUTCHours())}:${pad(bj.getUTCMinutes())}:${pad(bj.getUTCSeconds())}`;
    };
    if (p.ts) {
      const n = Number(p.ts);
      if (!Number.isFinite(n)) throw new ApiError(400, 'ts 不是合法的时间戳');
      const ms = String(Math.trunc(Math.abs(n))).length > 10 ? n : n * 1000;
      const d = new Date(ms);
      if (isNaN(d.getTime())) throw new ApiError(400, 'ts 超出可转换范围');
      return { timestamp: Math.floor(ms / 1000), milliseconds: ms, beijing: fmt(d), utc: d.toISOString() };
    }
    const now = new Date();
    return { timestamp: Math.floor(now.getTime() / 1000), milliseconds: now.getTime(), beijing: fmt(now), utc: now.toISOString() };
  },

  color: (p) => {
    const hexToRgb = (hex) => {
      let h = hex.replace(/^#/, '');
      if (/^[0-9a-fA-F]{3}$/.test(h)) h = h.split('').map((c) => c + c).join('');
      if (!/^[0-9a-fA-F]{6}$/.test(h)) throw new ApiError(400, 'hex 格式不正确，应为 RRGGBB');
      return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
    };
    const rgbToHsl = (r, g, b) => {
      r /= 255; g /= 255; b /= 255;
      const max = Math.max(r, g, b), min = Math.min(r, g, b);
      let h = 0, s = 0; const l = (max + min) / 2;
      if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        if (max === r) h = ((g - b) / d + (g < b ? 6 : 0));
        else if (max === g) h = (b - r) / d + 2;
        else h = (r - g) / d + 4;
        h *= 60;
      }
      return { h: Math.round(h), s: Math.round(s * 100) + '%', l: Math.round(l * 100) + '%' };
    };
    if (p.rgb) {
      const parts = String(p.rgb).split(',').map((s) => parseInt(s.trim(), 10));
      if (parts.length !== 3 || parts.some((n) => isNaN(n) || n < 0 || n > 255)) throw new ApiError(400, 'rgb 格式应为 255,87,51');
      const [r, g, b] = parts;
      const hex = '#' + parts.map((n) => n.toString(16).padStart(2, '0')).join('').toUpperCase();
      return { hex, rgb: { r, g, b }, hsl: rgbToHsl(r, g, b) };
    }
    if (p.hex) {
      const [r, g, b] = hexToRgb(String(p.hex));
      const hex = '#' + [r, g, b].map((n) => n.toString(16).padStart(2, '0')).join('').toUpperCase();
      return { hex, rgb: { r, g, b }, hsl: rgbToHsl(r, g, b) };
    }
    throw new ApiError(400, '缺少参数 hex 或 rgb');
  },

  url: (p) => {
    if (!p.text) throw new ApiError(400, '缺少参数 text');
    const type = p.type || 'encode';
    try {
      return { result: type === 'decode' ? decodeURIComponent(String(p.text)) : encodeURIComponent(String(p.text)), type };
    } catch { throw new ApiError(400, 'URL 解码失败，字符串格式不正确'); }
  },

  qrcode: async (p) => {
    if (!p.text) throw new ApiError(400, '缺少参数 text');
    if (!QRCode) throw new ApiError(501, '依赖不可用：qrcode 模块未安装，请先运行 npm install');
    const buffer = await QRCode.toBuffer(String(p.text), { type: 'png', width: 300, margin: 2 });
    return { __png: buffer };
  },

  ip: async (p, req) => {
    const target = p.ip || (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || req.socket.remoteAddress || '';
    const clean = String(target).replace('::ffff:', '');
    if (!clean) throw new ApiError(400, '无法确定要查询的 IP');
    // 首选 HTTPS 数据源 ipapi.co；失败时回退 ip-api.com
    try {
      const j = await fetchJson(`https://ipapi.co/${encodeURIComponent(clean)}/json/`);
      if (j.error) throw new ApiError(400, '查询失败：' + (j.reason || '未知原因'));
      return { ip: j.ip || clean, country: j.country_name || null, region: j.region || null, city: j.city || null, isp: j.org || null, org: j.org || null, as: j.asn || null };
    } catch (e) {
      if (e instanceof ApiError && e.code === 400) throw e;
      const j = await fetchJson(`http://ip-api.com/json/${encodeURIComponent(clean)}?lang=zh-CN&fields=status,message,query,country,regionName,city,isp,org,as`);
      if (j.status !== 'success') throw new ApiError(400, '查询失败：' + (j.message || '未知原因'));
      return { ip: j.query, country: j.country, region: j.regionName, city: j.city, isp: j.isp, org: j.org, as: j.as };
    }
  },

  whois: async (p) => {
    if (!p.domain) throw new ApiError(400, '缺少参数 domain');
    const domain = String(p.domain).replace(/^https?:\/\//, '').split('/')[0].trim().toLowerCase();
    if (!/^[a-z0-9.-]+\.[a-z]{2,}$/.test(domain)) throw new ApiError(400, 'domain 格式不正确');
    let raw = await whoisQuery('whois.iana.org', domain);
    const refMatch = raw.match(/refer:\s*(\S+)/i);
    let server = 'whois.iana.org';
    if (refMatch && refMatch[1] && refMatch[1].toLowerCase() !== 'whois.iana.org') {
      server = refMatch[1];
      try { raw = await whoisQuery(server, domain); } catch { /* 跟随失败则保留 IANA 结果 */ }
    }
    const get = (re) => { const m = raw.match(re); return m ? m[1].trim() : null; };
    return {
      domain,
      server,
      registrar: get(/Registrar:\s*(.+)/i) || get(/registrar:\s*(.+)/i),
      created: get(/Creation Date:\s*(.+)/i) || get(/created:\s*(.+)/i),
      expires: get(/Registry Expiry Date:\s*(.+)/i) || get(/Expiry Date:\s*(.+)/i),
      status: get(/Domain Status:\s*(.+)/i),
      raw: raw.slice(0, 3000)
    };
  },

  'site/status': async (p) => {
    if (!p.url) throw new ApiError(400, '缺少参数 url');
    let url = String(p.url);
    if (!/^https?:\/\//i.test(url)) url = 'http://' + url;
    const start = Date.now();
    try {
      const res = await fetch(url, {
        method: 'GET', redirect: 'follow',
        headers: { 'User-Agent': 'Mozilla/5.0 ZhiyiAPI/1.0' },
        signal: AbortSignal.timeout(10000)
      });
      await res.text().catch(() => '');
      return { url, status: res.status, ok: res.ok, time_ms: Date.now() - start };
    } catch (e) {
      return { url, status: 0, ok: false, time_ms: Date.now() - start, error: e.cause ? e.cause.message : e.message };
    }
  },

  'site/title': async (p) => {
    if (!p.url) throw new ApiError(400, '缺少参数 url');
    let url = String(p.url);
    if (!/^https?:\/\//i.test(url)) url = 'http://' + url;
    const html = await fetchText(url, {}, 10000);
    const m = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    return { url, title: m ? m[1].trim().replace(/\s+/g, ' ') : null };
  },

  tcping: async (p) => {
    if (!p.host) throw new ApiError(400, '缺少参数 host');
    const port = parseInt(p.port, 10) || 80;
    if (port < 1 || port > 65535) throw new ApiError(400, 'port 不合法');
    const host = String(p.host).replace(/^https?:\/\//, '').split('/')[0].split(':')[0];
    const results = [];
    for (let i = 0; i < 3; i++) results.push(await tcpConnect(host, port, 3000));
    const oks = results.filter((r) => r.ok);
    return {
      host, port,
      alive: oks.length > 0,
      attempts: results.map((r) => ({ ok: r.ok, ms: r.ms })),
      avg_ms: oks.length ? Math.round(oks.reduce((s, r) => s + r.ms, 0) / oks.length) : null
    };
  },

  portscan: async (p) => {
    if (!p.host) throw new ApiError(400, '缺少参数 host');
    const host = String(p.host).replace(/^https?:\/\//, '').split('/')[0].split(':')[0];
    const ports = [21, 22, 80, 443, 3306, 6379, 8080, 8888];
    const names = { 21: 'FTP', 22: 'SSH', 80: 'HTTP', 443: 'HTTPS', 3306: 'MySQL', 6379: 'Redis', 8080: 'HTTP-Alt', 8888: 'HTTP-Alt2' };
    const results = await Promise.all(ports.map(async (port) => {
      const r = await tcpConnect(host, port, 800);
      return { port, service: names[port], open: r.ok, ms: r.ms };
    }));
    return { host, results, open_ports: results.filter((r) => r.open).map((r) => r.port) };
  }
};
