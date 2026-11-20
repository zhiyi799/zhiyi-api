// 首页逻辑：接口列表全部来自 /api/list（注册表），不在前端写死
let allApis = [];

function render(filter = '') {
  const kw = filter.trim().toLowerCase();
  const sections = document.getElementById('sections');
  sections.innerHTML = '';
  const cats = [...new Set(allApis.map((a) => a.category))];
  let visible = 0;
  for (const cat of cats) {
    const items = allApis.filter((a) => a.category === cat &&
      (!kw || a.name.toLowerCase().includes(kw) || a.path.toLowerCase().includes(kw) || a.desc.toLowerCase().includes(kw)));
    if (!items.length) continue;
    visible += items.length;
    const h = document.createElement('h2');
    h.className = 'cat-title';
    h.textContent = cat;
    sections.appendChild(h);
    const grid = document.createElement('div');
    grid.className = 'grid';
    for (const api of items) {
      const a = document.createElement('a');
      a.className = 'card';
      a.href = `doc.html?id=${encodeURIComponent(api.id)}`;
      a.innerHTML = `<h3></h3><p></p><span class="path"></span>`;
      a.querySelector('h3').textContent = api.name;
      const method = document.createElement('span');
      method.className = 'method';
      method.textContent = api.method;
      a.querySelector('h3').appendChild(method);
      a.querySelector('p').textContent = api.desc;
      a.querySelector('.path').textContent = api.path;
      grid.appendChild(a);
    }
    sections.appendChild(grid);
  }
  document.getElementById('empty').style.display = visible ? 'none' : 'block';
}

async function load() {
  try {
    const res = await fetch('/api/list');
    const json = await res.json();
    allApis = json.data.list;
    document.getElementById('statTotal').textContent = json.data.total;
    document.getElementById('statCat').textContent = new Set(allApis.map((a) => a.category)).size;
    render();
  } catch (e) {
    document.getElementById('sections').innerHTML = '<div class="empty" style="display:block">接口列表加载失败，请确认服务已启动</div>';
  }
}

document.getElementById('search').addEventListener('input', (e) => render(e.target.value));
load();
