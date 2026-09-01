// 接口：AI 分析饮食营养
const { callDeepSeek } = require('./_deepseek');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ ok: false, error: '只支持 POST' });
    return;
  }
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
};
