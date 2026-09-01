// ===== AI 健身教练 - 前端逻辑 =====

// 访问密码（想改密码就改这里）
const ACCESS_PASSWORD = '123456';

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
const PLAN_KEY = 'ai_fitness_plan';           // 健身计划
const EVAL_KEY = 'ai_fitness_evaluations';    // 评估历史
const WEIGHT_KEY = 'ai_fitness_weight';       // 体重历史
const STRENGTH_KEY = 'ai_fitness_strength';   // 力量历史
const CHECKIN_KEY = 'ai_fitness_checkin';     // 打卡记录 {date: true}

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

// ===== 通用存取 =====
function getByKey(key) {
  const raw = localStorage.getItem(key);
  return raw ? JSON.parse(raw) : null;
}
function setByKey(key, val) {
  localStorage.setItem(key, JSON.stringify(val));
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

// ===== 显示密码页 =====
function showLock() {
  document.getElementById('page-lock').classList.add('active');
  document.getElementById('page-onboard').style.display = 'none';
  document.getElementById('app').style.display = 'none';
}

// ===== 进入 App（通过密码验证后）=====
function enterApp() {
  document.getElementById('page-lock').classList.remove('active');
  const profile = getProfile();
  if (profile) {
    fillProfile(profile);
    showApp();
    restoreSaved();
  } else {
    showOnboard();
  }
}

// ===== 初始化 =====
window.addEventListener('DOMContentLoaded', () => {
  bindEvents();
  // 每次进入都要求输入密码
  showLock();
});

// ===== 填充已保存的档案 =====
function fillProfile(profile) {
  document.getElementById('home-goal').textContent = profile.goal;
  document.getElementById('home-today').textContent = '你已建档，去「计划」页让 AI 生成训练计划吧！';
  document.getElementById('me-profile').textContent =
    '身高 ' + profile.height + 'cm，体重 ' + profile.weight + 'kg，目标：' + profile.goal;
  document.getElementById('me-movements').textContent = profile.movements || '未填写';
}

// ===== 恢复持久化内容（计划、图表、日历）=====
function restoreSaved() {
  // 恢复计划
  const plan = getByKey(PLAN_KEY);
  if (plan) {
    document.getElementById('plan-content').textContent = plan;
  }
  // 恢复当天评估
  const evals = getByKey(EVAL_KEY) || {};
  const today = todayStr();
  if (evals[today]) {
    const result = document.getElementById('evaluation-result');
    result.style.display = 'block';
    result.textContent = evals[today];
  }
  // 渲染图表和日历
  renderWeightChart();
  renderStrengthChart();
  renderCalendar();
  updateCheckinStatus();
}

// ===== 绑定事件 =====
function bindEvents() {
  // 密码验证
  document.getElementById('btn-unlock').addEventListener('click', () => {
    const input = document.getElementById('input-password');
    if (input.value === ACCESS_PASSWORD) {
      input.value = '';
      enterApp();
    } else {
      document.getElementById('lock-error').style.display = 'block';
      input.value = '';
    }
  });
  document.getElementById('input-password').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      document.getElementById('btn-unlock').click();
    }
  });

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

  // 重新填写档案
  document.getElementById('btn-reonboard').addEventListener('click', () => {
    if (!confirm('重新填写档案？你的记录、计划、图表数据会保留，只更新基本信息。')) return;
    localStorage.removeItem(STORAGE_KEY);
    // 清空引导页输入，回到第一步
    document.getElementById('input-height').value = '';
    document.getElementById('input-weight').value = '';
    document.getElementById('input-goal').value = '';
    document.getElementById('input-movements').value = '';
    document.querySelectorAll('.goal-btn').forEach(b => b.classList.remove('selected'));
    switchStep(1);
    showOnboard();
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
      setByKey(PLAN_KEY, data.plan); // 持久化保存
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
      setByKey(PLAN_KEY, data.plan); // 持久化保存
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
      // 保存评估历史（按日期）
      const evals = getByKey(EVAL_KEY) || {};
      evals[today] = data.evaluation;
      setByKey(EVAL_KEY, evals);
      result.style.display = 'block';
      result.textContent = data.evaluation;
    } catch (e) {
      result.style.display = 'block';
      result.textContent = '评估失败：' + e.message;
    }
    btn.textContent = 'AI 评估今天';
    btn.disabled = false;
  });

  // ===== 体重记录 =====
  document.getElementById('btn-save-weight').addEventListener('click', () => {
    const w = document.getElementById('input-bodyweight').value;
    if (!w) { alert('请输入体重'); return; }
    const log = getByKey(WEIGHT_KEY) || [];
    log.push({ date: todayStr(), weight: Number(w) });
    setByKey(WEIGHT_KEY, log);
    document.getElementById('input-bodyweight').value = '';
    renderWeightChart();
  });

  // ===== 力量记录 =====
  document.getElementById('btn-save-strength').addEventListener('click', () => {
    const name = document.getElementById('input-strength-name').value.trim();
    const weight = document.getElementById('input-strength-weight').value;
    if (!name || !weight) { alert('请输入动作名和重量'); return; }
    const log = getByKey(STRENGTH_KEY) || [];
    log.push({ date: todayStr(), name, weight: Number(weight) });
    setByKey(STRENGTH_KEY, log);
    document.getElementById('input-strength-name').value = '';
    document.getElementById('input-strength-weight').value = '';
    renderStrengthChart();
  });

  // ===== 日历翻月 =====
  document.getElementById('cal-prev').addEventListener('click', () => changeMonth(-1));
  document.getElementById('cal-next').addEventListener('click', () => changeMonth(1));

  // 点击日期格子（事件委托）
  document.getElementById('calendar').addEventListener('click', (e) => {
    const cell = e.target.closest('.cal-cell[data-date]');
    if (cell) showDayModal(cell.dataset.date);
  });

  // 弹窗关闭
  document.getElementById('modal-close').addEventListener('click', closeModal);
  document.getElementById('day-modal').addEventListener('click', (e) => {
    if (e.target === document.getElementById('day-modal')) closeModal();
  });

  // ===== 今日打卡 =====
  document.getElementById('btn-checkin').addEventListener('click', () => {
    const checkins = getByKey(CHECKIN_KEY) || {};
    checkins[todayStr()] = true;
    setByKey(CHECKIN_KEY, checkins);
    updateCheckinStatus();
    renderCalendar();
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

// ===== 折线图（纯 SVG）=====
function drawLineChart(container, points) {
  // points: [{label, value}]
  if (!points || points.length === 0) {
    container.innerHTML = '<p class="empty">暂无数据</p>';
    return;
  }
  const W = 320, H = 150, padL = 34, padB = 22, padT = 22, padR = 10;
  const values = points.map(p => p.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = (max - min) || 1;
  const innerW = W - padL - padR;
  const innerH = H - padT - padB;

  const x = i => padL + (points.length === 1 ? innerW / 2 : (i / (points.length - 1)) * innerW);
  const y = v => padT + (1 - (v - min) / range) * innerH;

  let lines = '';
  for (let i = 0; i < points.length; i++) {
    lines += x(i).toFixed(1) + ',' + y(points[i].value).toFixed(1) + ' ';
  }

  // 数据点圆
  let dots = points.map((p, i) =>
    `<circle cx="${x(i).toFixed(1)}" cy="${y(p.value).toFixed(1)}" r="3" fill="#6a5cff"/>`
  ).join('');

  // 数值标签（每个点上方显示具体数值）
  let valueLabels = points.map((p, i) =>
    `<text x="${x(i).toFixed(1)}" y="${(y(p.value) - 8).toFixed(1)}" font-size="10" font-weight="600" fill="#fff" text-anchor="middle">${p.value}</text>`
  ).join('');

  // 日期标签（最多显示首尾几个，避免拥挤）
  let labels = points.map((p, i) => {
    if (points.length > 8 && i !== 0 && i !== points.length - 1 && i % Math.ceil(points.length / 8) !== 0) return '';
    return `<text x="${x(i).toFixed(1)}" y="${H - 6}" font-size="8" fill="#888" text-anchor="middle">${p.label}</text>`;
  }).join('');

  container.innerHTML =
    `<svg viewBox="0 0 ${W} ${H}" style="width:100%;height:auto">
      <line x1="${padL}" y1="${padT}" x2="${padL}" y2="${H - padB}" stroke="#333"/>
      <line x1="${padL}" y1="${H - padB}" x2="${W - padR}" y2="${H - padB}" stroke="#333"/>
      <polyline points="${lines.trim()}" fill="none" stroke="#6a5cff" stroke-width="2"/>
      ${dots}
      ${valueLabels}
      ${labels}
    </svg>`;
}

// 渲染体重曲线
function renderWeightChart() {
  const log = getByKey(WEIGHT_KEY) || [];
  const points = log.map(e => ({ label: e.date.slice(5), value: e.weight }));
  drawLineChart(document.getElementById('weight-chart'), points);
}

// 渲染力量曲线（按动作分组，各画一条）
function renderStrengthChart() {
  const log = getByKey(STRENGTH_KEY) || [];
  const container = document.getElementById('strength-chart');
  if (log.length === 0) {
    container.innerHTML = '<p class="empty">暂无数据</p>';
    return;
  }
  // 按动作名分组
  const groups = {};
  log.forEach(e => {
    if (!groups[e.name]) groups[e.name] = [];
    groups[e.name].push({ label: e.date.slice(5), value: e.weight });
  });
  let html = '';
  Object.keys(groups).forEach(name => {
    html += '<div class="chart-title">' + name + '</div><div class="chart-box"></div>';
  });
  container.innerHTML = html;
  const boxes = container.querySelectorAll('.chart-box');
  Object.keys(groups).forEach((name, idx) => {
    drawLineChart(boxes[idx], groups[name]);
  });
}

// ===== 日历状态：当前查看的年月 =====
let calYear = new Date().getFullYear();
let calMonth = new Date().getMonth(); // 0-11

// 读取打卡记录
function getCheckins() {
  return getByKey(CHECKIN_KEY) || {};
}

// 更新"今日打卡"按钮状态
function updateCheckinStatus() {
  const checkins = getCheckins();
  const btn = document.getElementById('btn-checkin');
  const status = document.getElementById('checkin-status');
  if (checkins[todayStr()]) {
    status.textContent = '✅ 今天已打卡';
    btn.textContent = '今日已打卡';
    btn.disabled = true;
    btn.style.opacity = '0.6';
  } else {
    status.textContent = '今天还没打卡';
    btn.textContent = '今日打卡';
    btn.disabled = false;
    btn.style.opacity = '1';
  }
}

// 渲染打卡日历（可翻月，点击日期查看当天记录）
function renderCalendar() {
  const records = getRecords();
  const checkins = getCheckins();
  const today = todayStr();
  // 有记录（饮食或运动）的日期
  const hasRecords = new Set();
  Object.keys(records).forEach(date => { hasRecords.add(date); });

  const year = calYear;
  const month = calMonth;
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // 更新标题
  document.getElementById('cal-title').textContent = year + '年' + (month + 1) + '月';

  const container = document.getElementById('calendar');
  let html = '<div class="cal-grid">';
  ['日', '一', '二', '三', '四', '五', '六'].forEach(d => {
    html += '<div class="cal-head">' + d + '</div>';
  });
  for (let i = 0; i < firstDay; i++) html += '<div class="cal-cell empty-cell"></div>';
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = year + '-' + String(month + 1).padStart(2, '0') + '-' + String(d).padStart(2, '0');
    const isChecked = !!checkins[dateStr];
    const isPast = dateStr < today; // 过去的日期（含今天之前的）
    const isToday = dateStr === today;
    const has = hasRecords.has(dateStr);
    let cls = 'cal-cell';
    if (isChecked) {
      cls += ' checked'; // 已打卡 → 绿
    } else if (dateStr <= today) {
      cls += ' missed'; // 未打卡（过去或今天）→ 红
    }
    if (isToday) cls += ' today';
    const mark = has ? '<span class="cal-dot"></span>' : '';
    html += '<div class="' + cls + '" data-date="' + dateStr + '">' + d + mark + '</div>';
  }
  html += '</div>';
  container.innerHTML = html;
}

// 翻月
function changeMonth(delta) {
  calMonth += delta;
  if (calMonth < 0) { calMonth = 11; calYear--; }
  if (calMonth > 11) { calMonth = 0; calYear++; }
  renderCalendar();
}

// 显示某天的记录弹窗
function showDayModal(dateStr) {
  const records = getRecords();
  const items = records[dateStr] || [];
  document.getElementById('modal-date').textContent = prettyDate(dateStr) + (dateStr === todayStr() ? ' · 今天' : '');

  const body = document.getElementById('modal-body');
  if (items.length === 0) {
    body.innerHTML = '<p class="empty">这天没有记录</p>';
  } else {
    body.innerHTML = '';
    items.forEach(item => {
      const row = document.createElement('div');
      row.className = 'record-row';
      const tag = document.createElement('span');
      tag.className = 'record-tag ' + item.type;
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
      body.appendChild(row);
    });
  }
  document.getElementById('day-modal').style.display = 'flex';
}

// 关闭弹窗
function closeModal() {
  document.getElementById('day-modal').style.display = 'none';
}
