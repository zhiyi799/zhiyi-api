// 资讯生活类接口：免 key 公共数据源，失败优雅报错
const { ApiError, fetchJson } = require('../utils');

const WMO = {
  0: '晴', 1: '晴间多云', 2: '多云', 3: '阴', 45: '雾', 48: '雾凇',
  51: '毛毛雨', 53: '毛毛雨', 55: '毛毛雨', 56: '冻毛毛雨', 57: '冻毛毛雨',
  61: '小雨', 63: '中雨', 65: '大雨', 66: '冻雨', 67: '冻雨',
  71: '小雪', 73: '中雪', 75: '大雪', 77: '雪粒',
  80: '阵雨', 81: '阵雨', 82: '暴雨阵雨', 85: '阵雪', 86: '阵雪',
  95: '雷阵雨', 96: '雷阵雨伴冰雹', 99: '雷阵雨伴冰雹'
};

module.exports = {
  weather: async (p) => {
    if (!p.city) throw new ApiError(400, '缺少参数 city');
    const geo = await fetchJson(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(p.city)}&count=1&language=zh&format=json`);
    if (!geo.results || !geo.results.length) throw new ApiError(404, `找不到城市：${p.city}`);
    const g = geo.results[0];
    const fc = await fetchJson(`https://api.open-meteo.com/v1/forecast?latitude=${g.latitude}&longitude=${g.longitude}&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=Asia%2FShanghai&forecast_days=7`);
    const d = fc.daily;
    const forecast = d.time.map((date, i) => ({
      date,
      weather: WMO[d.weather_code[i]] || '未知',
      temp_max: d.temperature_2m_max[i],
      temp_min: d.temperature_2m_min[i]
    }));
    return { city: g.name, province: g.admin1 || null, country: g.country || null, latitude: g.latitude, longitude: g.longitude, forecast };
  },

  history: async () => {
    const now = new Date(Date.now() + 8 * 3600 * 1000);
    const mm = String(now.getUTCMonth() + 1).padStart(2, '0');
    const dd = String(now.getUTCDate()).padStart(2, '0');
    const j = await fetchJson(`https://api.wikimedia.org/feed/v1/wikipedia/zh/onthisday/all/${mm}/${dd}`, {
      headers: { 'Api-User-Agent': 'ZhiyiAPI/1.0' }
    });
    const events = (j.events || []).slice(0, 15).map((e) => ({ year: e.year, text: e.text }));
    const births = (j.births || []).slice(0, 5).map((e) => ({ year: e.year, text: e.text }));
    const deaths = (j.deaths || []).slice(0, 5).map((e) => ({ year: e.year, text: e.text }));
    if (!events.length) throw new ApiError(502, '数据源未返回历史事件');
    return { date: `${mm}-${dd}`, events, births, deaths };
  },

  'hot/baidu': async () => {
    const j = await fetchJson('https://top.baidu.com/api/board?platform=pc&tab=realtime');
    const items = [];
    const walk = (node) => {
      if (!node || typeof node !== 'object') return;
      if (Array.isArray(node)) { node.forEach(walk); return; }
      const title = node.query || node.word;
      if (title && node.hotScore !== undefined) {
        items.push({ title, desc: node.desc || '', hot: Number(node.hotScore) || null, url: node.rawUrl || node.appUrl || node.url || '' });
        return;
      }
      Object.values(node).forEach(walk);
    };
    walk(j.data && j.data.cards);
    const seen = new Set();
    const list = items.filter((i) => (seen.has(i.title) ? false : seen.add(i.title))).slice(0, 30);
    if (!list.length) throw new ApiError(502, '百度热搜数据解析失败，数据源结构可能已变更');
    return { list };
  },

  'hot/bilibili': async () => {
    const j = await fetchJson('https://api.bilibili.com/x/web-interface/popular?ps=20&pn=1', {
      headers: { Referer: 'https://www.bilibili.com/' }
    });
    if (!j.data || !Array.isArray(j.data.list)) throw new ApiError(502, 'B 站数据源返回异常');
    return {
      list: j.data.list.map((v) => ({
        title: v.title,
        author: v.owner ? v.owner.name : '',
        play: v.stat ? v.stat.view : null,
        url: v.bvid ? `https://www.bilibili.com/video/${v.bvid}` : ''
      }))
    };
  },

  'hot/weibo': async () => {
    const j = await fetchJson('https://weibo.com/ajax/side/hotSearch', {
      headers: { Referer: 'https://weibo.com/', 'X-Requested-With': 'XMLHttpRequest' }
    }).catch((e) => { throw new ApiError(502, '微博热搜获取失败（数据源通常需要登录态）：' + e.message); });
    const realtime = j.data && j.data.realtime;
    if (!Array.isArray(realtime)) throw new ApiError(502, '微博热搜数据结构异常，可能需要登录');
    return {
      list: realtime.slice(0, 30).map((it) => ({
        title: it.word,
        hot: it.num || null,
        label: it.label_name || '',
        url: `https://s.weibo.com/weibo?q=${encodeURIComponent(it.word)}`
      }))
    };
  },

  'music/netease': async () => {
    const j = await fetchJson('https://music.163.com/api/playlist/detail?id=3778678', {
      headers: { Referer: 'https://music.163.com/' }
    });
    const tracks = j.result && j.result.tracks;
    if (!Array.isArray(tracks) || !tracks.length) throw new ApiError(502, '网易云热歌榜数据获取失败');
    return {
      playlist: '云音乐热歌榜',
      list: tracks.slice(0, 20).map((t) => ({
        name: t.name,
        artists: (t.artists || []).map((a) => a.name).join('/'),
        album: t.album ? t.album.name : '',
        id: t.id
      }))
    };
  },

  phone: async (p) => {
    if (!p.num) throw new ApiError(400, '缺少参数 num');
    const num = String(p.num).replace(/\D/g, '');
    if (num.length < 7) throw new ApiError(400, '号码长度不正确');
    const j = await fetchJson(`https://cx.shouji.360.cn/phonearea.php?number=${num}`);
    if (!j.data || !j.data.province) throw new ApiError(404, '未查询到该号码的归属地');
    return { number: num, province: j.data.province, city: j.data.city, carrier: j.data.sp };
  },

  exchange: async (p) => {
    const from = String(p.from || 'USD').toUpperCase();
    const to = String(p.to || 'CNY').toUpperCase();
    if (!/^[A-Z]{3}$/.test(from) || !/^[A-Z]{3}$/.test(to)) throw new ApiError(400, '币种应为三位代码，如 USD、CNY');
    const amount = p.amount !== undefined ? Number(p.amount) : 1;
    if (!Number.isFinite(amount) || amount < 0) throw new ApiError(400, 'amount 不合法');
    const j = await fetchJson(`https://open.er-api.com/v6/latest/${from}`);
    if (j.result !== 'success' || !j.rates || j.rates[to] === undefined) throw new ApiError(502, '汇率数据源返回异常或币种不支持');
    const rate = j.rates[to];
    return { from, to, amount, rate, converted: Math.round(amount * rate * 10000) / 10000, updated: j.time_last_update_utc || null };
  },

  'image/random': async (p) => {
    const type = p.type || 'anime';
    if (type === 'anime') {
      try {
        const j = await fetchJson('https://api.waifu.pics/sfw/waifu');
        if (!j.url) throw new ApiError(502, '图片数据源返回异常');
        return { __redirect: j.url };
      } catch {
        // 主数据源不可用时回退 waifu.im
        const j = await fetchJson('https://api.waifu.im/search?included_tags=waifu&is_nsfw=false');
        const img = j.images && j.images[0] && j.images[0].url;
        if (!img) throw new ApiError(502, '动漫图片数据源暂时不可用');
        return { __redirect: img };
      }
    }
    if (type === 'scenery') return { __redirect: 'https://picsum.photos/800/600' };
    if (type === 'avatar') {
      const seed = Math.random().toString(36).slice(2, 10);
      return { __redirect: `https://api.dicebear.com/9.x/adventurer/png?seed=${seed}&size=300` };
    }
    throw new ApiError(400, 'type 只能是 anime、scenery 或 avatar');
  }
};
