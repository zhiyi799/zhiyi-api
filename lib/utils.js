// 通用工具：带超时的 fetch、统一错误
class ApiError extends Error {
  constructor(code, msg) {
    super(msg);
    this.code = code;
  }
}

async function fetchWithTimeout(url, options = {}, timeout = 9000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    const res = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36 ZhiyiAPI/1.0',
        ...(options.headers || {})
      }
    });
    return res;
  } catch (e) {
    if (e.name === 'AbortError') throw new ApiError(504, '请求外部数据源超时');
    throw new ApiError(502, '请求外部数据源失败：' + (e.cause ? e.cause.message : e.message));
  } finally {
    clearTimeout(timer);
  }
}

async function fetchJson(url, options, timeout) {
  const res = await fetchWithTimeout(url, options, timeout);
  if (!res.ok) throw new ApiError(502, `外部数据源返回 HTTP ${res.status}`);
  try {
    return await res.json();
  } catch {
    throw new ApiError(502, '外部数据源返回的数据不是合法 JSON');
  }
}

async function fetchText(url, options, timeout) {
  const res = await fetchWithTimeout(url, options, timeout);
  if (!res.ok) throw new ApiError(502, `外部数据源返回 HTTP ${res.status}`);
  return res.text();
}

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

module.exports = { ApiError, fetchWithTimeout, fetchJson, fetchText, pick };
