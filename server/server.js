// ===== AI 健身教练 - 后端服务 =====
// 职责：接收前端请求 → 调用 DeepSeek → 返回结果
// API Key 只存在这里，不会暴露给前端

const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json({ limit: '2mb' }));

const DEEPSEEK_KEY = process.env.DEEPSEEK_API_KEY;
const DEEPSEEK_URL = 'https://api.deepseek.com/chat/completions';
const MODEL = 'deepseek-chat';

// 调用 DeepSeek 的通用函数
async function callDeepSeek(messages) {
  if (!DEEPSEEK_KEY) {
    throw new Error('未配置 DEEPSEEK_API_KEY');
  }
  const res = await fetch(DEEPSEEK_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + DEEPSEEK_KEY,
    },
    body: JSON.stringify({
      model: MODEL,
      messages,
      temperature: 0.7,
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error('DeepSeek 调用失败: ' + res.status + ' ' + err);
  }
  const data = await res.json();
  return data.choices[0].message.content;
}

// ===== 接口 1：生成/更新健身计划 =====
app.post('/api/plan', async (req, res) => {
  try {
    const { profile, suggestion } = req.body;
    const sys = '你是一名专业的健身教练。根据用户的身体数据和训练动作，生成个性化、可执行的训练计划。用户可能对计划提出修改建议，请据此调整。输出用中文，简洁清晰，包含每周训练安排、动作、重量建议、组数次数。';
    const userMsg = '我的信息：\n' + JSON.stringify(profile, null, 2) +
      (suggestion ? '\n\n我对计划的想法/建议：' + suggestion : '\n\n请为我生成初始训练计划');
    const answer = await callDeepSeek([
      { role: 'system', content: sys },
      { role: 'user', content: userMsg },
    ]);
    res.json({ ok: true, plan: answer });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// ===== 接口 2：每日 AI 评估 =====
app.post('/api/evaluate', async (req, res) => {
  try {
    const { profile, date, records } = req.body;
    const sys = '你是一名专业的健身教练。根据用户的目标、当天的饮食和运动记录，评估用户今天是否达标，并给出明天的具体建议。评估要分饮食和运动两方面。输出用中文，结构清晰：\n1. 今日评估（饮食达标情况 / 运动达标情况，用 ✅⚠️❌ 标记）\n2. 明天建议（具体、可执行）';
    const userMsg = '我的信息：\n' + JSON.stringify(profile, null, 2) +
      '\n\n评估日期：' + date +
      '\n\n当天记录：\n' + JSON.stringify(records, null, 2);
    const answer = await callDeepSeek([
      { role: 'system', content: sys },
      { role: 'user', content: userMsg },
    ]);
    res.json({ ok: true, evaluation: answer });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// ===== 接口 3：AI 整理饮食记录（估算营养）=====
app.post('/api/analyze-diet', async (req, res) => {
  try {
    const { dietText } = req.body;
    const sys = '你是一名营养师。根据用户描述的食物，估算大致热量(千卡)、蛋白质(g)、碳水(g)、脂肪(g)，并判断是否健康。用中文，简洁输出一个表格或列表。';
    const answer = await callDeepSeek([
      { role: 'system', content: sys },
      { role: 'user', content: '我今天吃了：' + dietText },
    ]);
    res.json({ ok: true, analysis: answer });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// 静态文件：托管前端页面（public 目录）
app.use(express.static(path.join(__dirname, '..', 'public')));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log('服务已启动: http://localhost:' + PORT);
});
