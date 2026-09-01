// 接口：生成/更新健身计划
const { callDeepSeek } = require('./_deepseek');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ ok: false, error: '只支持 POST' });
    return;
  }
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
};
