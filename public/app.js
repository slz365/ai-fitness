// ===== AI 健身教练 - 前端逻辑 =====

// 后端地址：自动适配
// - 部署到 Vercel 后：用相对路径（前端和 API 同域）
// - 本地开发：用 localhost:3000
const API_BASE = (location.hostname === 'localhost' || location.hostname === '127.0.0.1')
  ? 'http://localhost:3000'
  : ''; // 云端同域，直接用相对路径

// 通用请求函数
async function api(path, body) {
  const res = await fetch(API_BASE + path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!data.ok) throw new Error(data.error || '请求失败');
  return data;
}

// 本地存储的 key
const STORAGE_KEY = 'ai_fitness_profile';
const RECORDS_KEY = 'ai_fitness_records';

// 读取档案
function getProfile() {
  const raw = localStorage.getItem(STORAGE_KEY);
  return raw ? JSON.parse(raw) : null;
}

// 保存档案
function saveProfile(profile) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
}

// ===== 记录相关 =====
// 读取所有记录 { 'YYYY-MM-DD': [{type:'diet'|'workout', text}...] }
function getRecords() {
  const raw = localStorage.getItem(RECORDS_KEY);
  return raw ? JSON.parse(raw) : {};
}

function saveRecords(records) {
  localStorage.setItem(RECORDS_KEY, JSON.stringify(records));
}

// 获取今天的日期字符串
function todayStr() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return y + '-' + m + '-' + day;
}

// 友好显示日期
function prettyDate(str) {
  const d = new Date(str);
  const week = ['日', '一', '二', '三', '四', '五', '六'][d.getDay()];
  return (d.getMonth() + 1) + '月' + d.getDate() + '日 周' + week;
}

// ===== 页面切换 =====
function showPage(pageId) {
  // 隐藏所有主界面 page
  document.querySelectorAll('#app .page').forEach(p => p.classList.remove('active'));
  // 显示目标页面
  const target = document.getElementById('page-' + pageId);
  if (target) target.classList.add('active');

  // 更新底部导航高亮
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.nav === pageId);
  });
}

function showOnboard() {
  document.getElementById('page-onboard').classList.add('active');
  document.getElementById('page-onboard').style.display = 'flex';
  document.getElementById('app').style.display = 'none';
}

function showApp() {
  document.getElementById('page-onboard').classList.remove('active');
  document.getElementById('page-onboard').style.display = 'none';
  document.getElementById('app').style.display = 'block';
  showPage('home');
  window.scrollTo(0, 0);
}

// ===== 初始化 =====
window.addEventListener('DOMContentLoaded', () => {
  const profile = getProfile();
  if (profile) {
    fillProfile(profile);
    showApp();
  } else {
    showOnboard();
  }
  bindEvents();
});

// ===== 填充已保存的档案 =====
function fillProfile(profile) {
  document.getElementById('home-goal').textContent = profile.goal;
  document.getElementById('home-today').textContent = '你已建档，去「计划」页让 AI 生成训练计划吧！';
  document.getElementById('me-profile').textContent =
    '身高 ' + profile.height + 'cm，体重 ' + profile.weight + 'kg，目标：' + profile.goal;
  document.getElementById('me-movements').textContent = profile.movements || '未填写';
}

// ===== 绑定事件 =====
function bindEvents() {
  // 目标选择
  document.querySelectorAll('.goal-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.goal-btn').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      document.getElementById('input-goal').value = btn.dataset.goal;
    });
  });

  // 分步切换：下一步 / 上一步
  function switchStep(n) {
    document.querySelectorAll('.step').forEach(s => s.classList.remove('active'));
    document.getElementById('step-' + n).classList.add('active');
  }

  document.querySelectorAll('[data-next]').forEach(btn => {
    btn.addEventListener('click', () => {
      // 第 1 步校验身高体重
      if (btn.dataset.next === '2') {
        const h = document.getElementById('input-height').value;
        const w = document.getElementById('input-weight').value;
        if (!h || !w) { alert('请填写身高和体重'); return; }
      }
      // 第 2 步校验目标
      if (btn.dataset.next === '3') {
        const goal = document.getElementById('input-goal').value;
        if (!goal) { alert('请选择一个目标'); return; }
      }
      switchStep(btn.dataset.next);
    });
  });

  document.querySelectorAll('[data-prev]').forEach(btn => {
    btn.addEventListener('click', () => switchStep(btn.dataset.prev));
  });

  // 完成按钮
  document.getElementById('btn-start').addEventListener('click', () => {
    const height = document.getElementById('input-height').value;
    const weight = document.getElementById('input-weight').value;
    const goal = document.getElementById('input-goal').value;
    const movements = document.getElementById('input-movements').value.trim();

    if (!height || !weight || !goal) {
      alert('请填写身高、体重和目标');
      return;
    }

    const profile = { height, weight, goal, movements };
    saveProfile(profile);
    fillProfile(profile);
    showApp();
  });

  // 底部导航
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => showPage(btn.dataset.nav));
  });

  // 首页快捷按钮
  document.querySelectorAll('.quick-btn').forEach(btn => {
    btn.addEventListener('click', () => showPage(btn.dataset.nav));
  });

  // 记录页分栏
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      // 饮食分栏显示餐次/放纵餐选项，运动分栏隐藏
      const isDiet = btn.dataset.tab === 'diet';
      document.getElementById('diet-options').style.display = isDiet ? 'block' : 'none';
      document.getElementById('input-record').placeholder = isDiet
        ? '吃了什么？例如：两个鸡蛋一碗粥'
        : '练了什么？例如：卧推 5 组 60kg';
    });
  });

  // 餐次选择
  document.querySelectorAll('.meal-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.meal-btn').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      document.getElementById('input-meal').value = btn.dataset.meal;
    });
  });

  // 生成计划
  document.getElementById('btn-generate-plan').addEventListener('click', async () => {
    const profile = getProfile();
    if (!profile) { alert('请先填写档案'); return; }
    const btn = document.getElementById('btn-generate-plan');
    btn.textContent = '🤖 AI 生成中...';
    btn.disabled = true;
    try {
      const data = await api('/api/plan', { profile });
      document.getElementById('plan-content').textContent = data.plan;
    } catch (e) {
      alert('生成失败：' + e.message);
    }
    btn.textContent = '🤖 生成我的计划';
    btn.disabled = false;
  });

  // 对计划提建议
  document.getElementById('btn-suggest').addEventListener('click', async () => {
    const profile = getProfile();
    const suggestion = document.getElementById('input-suggest').value.trim();
    if (!suggestion) { alert('请先输入建议'); return; }
    const btn = document.getElementById('btn-suggest');
    btn.textContent = '发送中...';
    btn.disabled = true;
    try {
      const data = await api('/api/plan', { profile, suggestion });
      document.getElementById('plan-content').textContent = data.plan;
      document.getElementById('input-suggest').value = '';
    } catch (e) {
      alert('发送失败：' + e.message);
    }
    btn.textContent = '发送建议';
    btn.disabled = false;
  });
  document.getElementById('btn-save-record').addEventListener('click', () => {
    const text = document.getElementById('input-record').value.trim();
    if (!text) { alert('请先输入内容'); return; }

    // 当前选中的分栏（饮食/运动）
    const activeTab = document.querySelector('.tab-btn.active');
    const type = activeTab ? activeTab.dataset.tab : 'diet';

    // 按日期保存
    const records = getRecords();
    const date = todayStr();
    if (!records[date]) records[date] = [];
    const item = { type, text };

    // 饮食记录附带餐次和放纵餐信息
    if (type === 'diet') {
      item.meal = document.getElementById('input-meal').value;
      item.cheat = document.getElementById('input-cheat').checked;
    }

    records[date].push(item);

    saveRecords(records);
    renderRecords();
    document.getElementById('input-record').value = '';
    document.getElementById('input-cheat').checked = false;
  });

  // 初始化记录列表
  renderRecords();

  // AI 评估今天
  document.getElementById('btn-evaluate').addEventListener('click', async () => {
    const profile = getProfile();
    const records = getRecords();
    const today = todayStr();
    if (!records[today] || records[today].length === 0) {
      alert('今天还没有记录，先去记录饮食或运动吧');
      return;
    }
    const btn = document.getElementById('btn-evaluate');
    const result = document.getElementById('evaluation-result');
    btn.textContent = '🤖 评估中...';
    btn.disabled = true;
    try {
      const data = await api('/api/evaluate', {
        profile,
        date: today,
        records: records[today],
      });
      result.style.display = 'block';
      result.textContent = data.evaluation;
    } catch (e) {
      result.style.display = 'block';
      result.textContent = '评估失败：' + e.message;
    }
    btn.textContent = 'AI 评估今天';
    btn.disabled = false;
  });
}

// 渲染记录列表（按日期分组）
function renderRecords() {
  const records = getRecords();
  const list = document.getElementById('record-list');
  const dates = Object.keys(records).sort().reverse();

  if (dates.length === 0) {
    list.innerHTML = '<p class="empty">暂无记录</p>';
    return;
  }

  list.innerHTML = '';
  dates.forEach(date => {
    const group = document.createElement('div');
    group.className = 'record-group';

    const title = document.createElement('div');
    title.className = 'record-date';
    const isToday = date === todayStr();
    title.textContent = (isToday ? '今天 · ' : '') + prettyDate(date);
    group.appendChild(title);

    records[date].forEach(item => {
      const row = document.createElement('div');
      row.className = 'record-row';
      const tag = document.createElement('span');
      tag.className = 'record-tag ' + item.type;
      // 饮食记录：标签显示餐次；有放纵餐则加标记
      if (item.type === 'diet') {
        tag.textContent = (item.meal || '饮食') + (item.cheat ? ' 😈' : '');
      } else {
        tag.textContent = '🏋️ 运动';
      }
      const txt = document.createElement('span');
      txt.className = 'record-text';
      txt.textContent = item.text;
      row.appendChild(tag);
      row.appendChild(txt);
      group.appendChild(row);
    });

    list.appendChild(group);
  });
}
