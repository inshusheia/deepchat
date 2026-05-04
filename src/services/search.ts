// 联网搜索服务
// 使用 DuckDuckGo HTML 搜索 (免费无需API Key)

export interface SearchResult {
  title: string;
  url: string;
  snippet: string;
}

// 使用 DuckDuckGo 搜索
export async function webSearch(query: string, numResults: number = 5): Promise<SearchResult[]> {
  try {
    const encodedQuery = encodeURIComponent(query);
    const response = await fetch(
      `https://html.duckduckgo.com/html/?q=${encodedQuery}&num=${numResults}`,
      {
        headers: {
          'Accept': 'text/html',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`搜索失败: ${response.status}`);
    }

    const html = await response.text();
    const results: SearchResult[] = [];

    // 解析 HTML 结果
    const resultRegex = /<a class="result__a" href="([^"]+)"[^>]*>([^<]+)<\/a>[\s\S]*?<a class="result__snippet"[^>]*>([^<]+)<\/a>/g;
    let match;
    let count = 0;

    while ((match = resultRegex.exec(html)) !== null && count < numResults) {
      const url = match[1];
      const title = match[2].replace(/<[^>]+>/g, '').trim();
      const snippet = match[3].replace(/<[^>]+>/g, '').trim();

      if (url && title && !url.includes('duckduckgo.com')) {
        results.push({ title, url, snippet });
        count++;
      }
    }

    return results;
  } catch (error) {
    console.error('搜索错误:', error);
    return [];
  }
}

// 格式化搜索结果为文本
export function formatSearchResults(results: SearchResult[]): string {
  if (results.length === 0) return '未找到相关结果';

  let text = '【搜索结果】\n\n';
  results.forEach((result, index) => {
    text += `${index + 1}. ${result.title}\n`;
    text += `   ${result.snippet}\n`;
    text += `   来源: ${result.url}\n\n`;
  });

  return text;
}

// 判断是否需要搜索
export function shouldSearch(query: string): boolean {
  const searchKeywords = [
    '搜索', '查找', '最新', '现在', '今天', '天气',
    '股票', '价格', '新闻', '事件', '什么是', '如何',
    '怎么', '哪的', '哪里', 'who', 'what', 'when', 'where', 'how',
    'search', 'find', 'latest', 'current', 'news',
  ];

  const lowerQuery = query.toLowerCase();
  return searchKeywords.some(keyword => lowerQuery.includes(keyword.toLowerCase()));
}