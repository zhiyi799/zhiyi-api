// 文案类接口：本地语料随机返回
const data = require('../data');

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

module.exports = {
  yiyan: () => ({ content: pick(data.yiyan) }),

  dujitang: () => ({ content: pick(data.dujitang) }),

  qinghua: () => ({ content: pick(data.qinghua) }),

  tiangou: () => ({ content: pick(data.tiangou) }),

  joke: () => ({ content: pick(data.joke) }),

  miyu: (params) => {
    const item = pick(data.miyu);
    const result = { riddle: item.q };
    if (params.answer) result.answer = item.a;
    else result.tip = '在请求参数中加上 answer=1 可查看答案';
    return result;
  },

  mingyan: () => {
    const item = pick(data.mingyan);
    return { content: item.text, author: item.author };
  },

  shici: () => ({ content: pick(data.shici) })
};
