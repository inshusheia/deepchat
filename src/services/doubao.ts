// 豆包浏览器自动化服务
// 确保已安装: npx playwright install chromium

const DOUBAO_URL = 'https://www.doubao.com/chat/';

let browser: any = null;
let page: any = null;

// 初始化浏览器（只启动一次）
export async function initDoubao() {
  if (page) return true;

  try {
    const { chromium } = await import('playwright');
    browser = await chromium.launch({
      headless: false, // 设置为 true 可以无头运行
      args: ['--no-sandbox']
    });
    page = await browser.newPage();
    await page.goto(DOUBAO_URL);
    await page.waitForTimeout(3000);
    console.log('豆包浏览器已启动，请在浏览器中登录');
    return true;
  } catch (e) {
    console.error('启动失败:', e);
    return false;
  }
}

// 发送消息获取回复
export async function sendToDoubao(message: string): Promise<string> {
  if (!page) {
    await initDoubao();
  }

  try {
    // 找到输入框并输入
    const inputBox = await page.$('textarea');
    if (!inputBox) {
      return '（未找到输入框，请手动登录）';
    }

    await inputBox.fill(message);

    // 点击发送按钮
    const sendBtn = await page.$('button.primary, button:has-text("发送"), [class*="send"]');
    if (sendBtn) {
      await sendBtn.click();
    }

    // 等待回复
    await page.waitForTimeout(5000);

    // 获取最新回复
    const messages = await page.$$('[class*="message"], [class*="response"]');
    if (messages.length > 0) {
      const lastMsg = messages[messages.length - 1];
      return await lastMsg.textContent() || '（无回复内容）';
    }

    return '（等待回复中...）';
  } catch (e) {
    return `（错误: ${e}）`;
  }
}

// 关闭浏览器
export async function closeDoubao() {
  if (browser) {
    await browser.close();
    browser = null;
    page = null;
  }
}