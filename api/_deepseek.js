// 公共模块：调用 DeepSeek
const DEEPSEEK_URL = 'https://api.deepseek.com/chat/completions';
const MODEL = 'deepseek-chat';

async function callDeepSeek(messages) {
  const key = process.env.DEEPSEEK_API_KEY;
  if (!key) {
    throw new Error('未配置 DEEPSEEK_API_KEY');
  }
  const res = await fetch(DEEPSEEK_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + key,
    },
    body: JSON.stringify({ model: MODEL, messages, temperature: 0.7 }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error('DeepSeek 调用失败: ' + res.status + ' ' + err);
  }
  const data = await res.json();
  return data.choices[0].message.content;
}

module.exports = { callDeepSeek };
