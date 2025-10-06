// 在api/ai.js开头添加简单的测试代码
export default async function handler(req, res) {
  // 先返回简单响应测试
  if (req.method === 'GET') {
    return res.json({ 
      status: 'ok', 
      message: '服务器运行正常',
      timestamp: new Date().toISOString()
    });
  }
  
  // 如果是POST请求，返回测试数据
  return res.json({
    success: true,
    word: 'test',
    mnemonic: '✅ 测试记忆联想',
    service: 'test-mode'
  });
} // api/ai.js - 完整的AI记忆服务器
import OpenAI from 'openai';

// 初始化OpenAI客户端
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '你的API密钥'
});

export default async function handler(req, res) {
  // 设置CORS头
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // 处理CORS预检请求
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // 健康检查路由
  if (req.method === 'GET') {
    return res.json({ 
      status: 'ready', 
      service: 'anki-ai-server',
      message: 'AI记忆服务器运行正常',
      timestamp: new Date().toISOString()
    });
  }
  
  // 只处理POST请求
  if (req.method !== 'POST') {
    return res.status(405).json({ error: '只支持POST请求' });
  }

  try {
    const { word, meaning } = req.body;
    
    // 验证输入
    if (!word) {
      return res.status(400).json({ 
        success: false, 
        error: '需要提供word参数' 
      });
    }

    console.log('收到请求:', { word, meaning });
    
    // 调用OpenAI API生成记忆联想
    const prompt = `
你是一个专业的英语词汇记忆专家。请为单词"${word}"（中文意思："${meaning}"）生成最有效的记忆联想方案。

要求：
1. 提供发音联想（中文谐音法）
2. 分析词根词缀（如有）
3. 创作一个30字内的趣味故事
4. 给出实用的记忆口诀
5. 用中文回复，每个要点用✅开头

请为"${word}"生成记忆方案：`;

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "你是一个英语教育专家，擅长使用多种记忆法帮助学习者快速掌握单词。"
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 800,
      temperature: 0.7
    });

    const aiResponse = completion.choices[0].message.content;
    
    // 返回成功响应
    res.json({ 
      success: true, 
      word: word,
      meaning: meaning || '未提供详细释义',
      mnemonic: aiResponse,
      service: 'openai-gpt-3.5-turbo'
    });
    
  } catch (error) {
    console.error('AI生成错误:', error);
    
    // 备用方案
    const { word, meaning } = req.body;
    res.json({ 
      success: false, 
      error: error.message,
      fallback: `✅ 备用记忆方案：将"${word}"联想为"${meaning}"\n✅ 技巧：创造个人故事加强记忆`,
      note: 'API调用失败，使用备用方案'
    });
  }
}
