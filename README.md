# DeepChat

*AI Chat Application with Tree-structured Conversations*

![React](https://img.shields.io/badge/React-19-blue) ![TypeScript](https://img.shields.io/badge/TypeScript-6-blue) ![Vite](https://img.shields.io/badge/Vite-8-purple) ![License](https://img.shields.io/badge/License-MIT-green)

---

## ✨ Key Features

### 🔀 Expand Rightward — Tree-structured Conversations

Unlike traditional chat apps that grow downward, DeepChat expands **horizontally to the right**. Each conversation can branch into multiple child conversations, creating a mind-map style layout that lets you explore topics without losing context.

> Chat forward, not downward — think in branches, not in lines.

### ⚡ One-click Summarize

Click the **Summarize** button on any parent conversation, and DeepChat automatically aggregates summaries from all its child conversations into one comprehensive overview.

---

## Screenshots

### Parent-Child Conversations & One-click Summarize
![Parent-Child](public/screenshot-parent-child.png)

### API Configuration
![Settings](public/screenshot-settings.png)

---

## Features

| Feature | Description |
|---------|-------------|
| **Tree Structure** | Expand conversations to the right, visualize thinking paths |
| **One-click Summarize** | Auto-aggregate child conversation summaries |
| **Drag & Resize** | Freely arrange cards on infinite canvas |
| **Trackpad Zoom** | Smooth zoom with pinch gestures |
| **File Attachments** | Images, PDFs, code files |
| **Web Search** | Built-in DuckDuckGo search |
| **Markdown** | Full GFM with syntax highlighting |
| **Auto-save** | LocalStorage persistence |

---

## Tech Stack

- React 19 + TypeScript 6 + Vite 8
- MiniMax API (streaming AI)
- PDF.js (PDF parsing)
- react-markdown + highlight.js

---

## Quick Start

```bash
# Clone & install
git clone https://github.com/inshusheia/deepchat.git
cd deepchat
npm install

# Run
npm run dev
```

Visit `http://localhost:5173`

---

## API Configuration

Click the **API** button in the toolbar to configure:

| Setting | Default |
|---------|---------|
| API Key | Your MiniMax key |
| Base URL | `https://api.minimax.chat` |
| Model | `abab6.5s-chat` |

Get your API key at [MiniMax Platform](https://platform.minimax.chat)

---

## How It Works

### Create Branch
Click **+** on any conversation card → new child branch appears to the right

### Summarize
Click **Summarize** button → children summaries merged into parent

### Move/Resize
Drag handle (⋮⋮) to move → drag corner to resize

---

## License

MIT

---

## Acknowledgments

- [MiniMax](https://minimax.chat) — AI API
- [Vite](https://vitejs.dev) — Build tool
- [React](https://react.dev) — UI library