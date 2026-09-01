// 公共模块：调用 DeepSeek
const DEEPSEEK_URL = 'https://api.deepseek.com/chat/completions';
const MODEL = 'deepseek-chat';

// 清洗字符串：移除可能触发 API 格式错误的特殊字符（如部分 emoji、不可见字符、非法 Unicode）
function sanitize(str) {
  if (typeof str !== 'string') return str;
  return str
    // 移除零宽字符、控制字符（保留空格、换行、制表符）
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    // 移除除常见字符外的其他控制字符
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    // 移除 emoji 的修饰符和变体选择符（避免组合字符触发格式校验错误）
    .replace(/[\u{1F3FB}-\u{1F3FF}\uFE0F\u20E3]/gu, '')
    // 移除孤立的代理对（不完整的 emoji 等）
    .replace(/[\uD800-\uDBFF](?![\uDC00-\uDFFF])/g, '')
    .replace(/(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/g, '');
}

async function callDeepSeek(messages) {
  const key = process.env.DEEPSEEK_API_KEY;
  if (!key) {
    throw new Error('未配置 DEEPSEEK_API_KEY');
  }
  // 清洗所有 message 的 content
  const cleanMessages = messages.map(m => ({
    role: m.role,
    content: sanitize(m.content),
  }));
  const res = await fetch(DEEPSEEK_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + key,
    },
    body: JSON.stringify({ model: MODEL, messages: cleanMessages, temperature: 0.7 }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error('DeepSeek 调用失败: ' + res.status + ' ' + err);
  }
  const data = await res.json();
  return data.choices[0].message.content;
}

module.exports = { callDeepSeek };
