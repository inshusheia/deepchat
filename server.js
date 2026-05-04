import express, { Request, Response } from 'express';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json());

// 豆包服务
let browser: any = null;
let page: any = null;

async function initBrowser() {
  try {
    const { chromium } = await import('playwright');
    browser = await chromium.launch({ headless: true });
    page = await browser.newPage();
    await page.goto('https://www.doubao.com/chat/');
    console.log('豆包浏览器已启动');
  } catch (e) {
    console.error('启动失败:', e);
  }
}

async function sendToDoubao(message: string): Promise<string> {
  try {
    if (!page) await initBrowser();

    const inputSelector = 'textarea';
    await page.fill(inputSelector, message);

    const sendBtn = 'button.primary, button:has-text("发送")';
    await page.click(sendBtn);

    await page.waitForTimeout(5000);

    const replySelector = '.message-content, [class*="assistant"]';
    const replies = await page.$$eval(replySelector, els => els.map((e: any) => e.textContent));

    return replies[replies.length - 1] || '（无回复）';
  } catch (e) {
    return `（错误: ${e}）`;
  }
}

app.post('/api/chat', async (req: Request, res: Response) => {
  const { messages, model } = req.body;

  if (model === 'doubao') {
    const lastMsg = messages[messages.length - 1]?.content;
    const reply = await sendToDoubao(lastMsg);
    res.json({ content: reply });
  } else {
    res.json({ content: '其他模型暂未接入' });
  }
});

const PORT = 3001;
app.listen(PORT, () => console.log(`服务运行在 http://localhost:${PORT}`));