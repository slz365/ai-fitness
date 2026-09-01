// 接口：每日 AI 评估
const { callDeepSeek } = require('./_deepseek');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ ok: false, error: '只支持 POST' });
    return;
  }
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
};
