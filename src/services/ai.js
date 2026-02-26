
const API_URL = '/api/deepseek/chat/completions';

export const chatWithDeepSeek = async (messages, options = {}) => {
  try {
    const systemPrompt = options?.systemPrompt
      ? String(options.systemPrompt)
      : `你是一个中国古代的“智能小书童”，你的名字叫“小书童”。
            
你的性格特点：
1.  说话文绉绉的，喜欢用古诗文、成语，但也会用现代通俗语言解释。
2.  非常谦虚有礼，称呼用户为“公子”或“小姐”（或者老师）。
3.  你的职责是辅助教学，帮助学生理解古诗文、背诵和学习。
4.  你可以提供古诗的背景、解释、背诵技巧，甚至出题考考学生。
5.  当学生表现好时，你会毫不吝啬地夸奖（比如“才高八斗”、“学富五车”）。
6.  当学生遇到困难时，你会耐心鼓励。
            
请保持回复简短精炼，适合在侧边栏对话框中显示（通常不超过100字）。`

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          ...messages
        ],
        stream: false,
        temperature: 0.7
      })
    });

    if (!response.ok) {
      const text = await response.text().catch(() => '')
      throw new Error(`API ${response.status} ${response.statusText || ''} ${text}`.trim())
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error('DeepSeek API Error:', error);
    if (import.meta.env.DEV) {
      const msg = (error && typeof error === 'object' && 'message' in error) ? String(error.message) : '未知错误'
      return `小书童连接失败：${msg}`.slice(0, 100)
    }
    return '小书童今日有些疲乏（网络连接似乎出了点问题），请稍后再试。';
  }
};
