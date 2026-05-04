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

### 1. Clone the Repository

```bash
git clone https://github.com/inshusheia/deepchat.git
cd deepchat
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure API Key

1. Get your MiniMax API key at [MiniMax Platform](https://platform.minimax.chat)
2. Run the app:
```bash
npm run dev
```
3. Open `http://localhost:5173`
4. Click the **API** button in the toolbar (top-right)
5. Enter your API key
6. Select a model (auto-detected from available models)
7. Click Save

### 4. Start Using

- Click **+** to create a new conversation
- Type your message and press Enter
- To branch: click **+** on any conversation card
- To summarize: click **Summarize** button on parent

---

## Deployment

### Build for Production

```bash
npm run build
```

The built files will be in the `dist/` folder.

### Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

### Deploy to Netlify

```bash
# Install Netlify CLI
npm i -g netlify-cli

# Deploy
netlify deploy --prod
```

### Deploy to Any Static Hosting

Upload the contents of `dist/` folder to your hosting provider.

---

## API Configuration

Click the **API** button in the toolbar to configure:

| Setting | Default | Description |
|---------|---------|-------------|
| API Key | - | Your MiniMax API key |
| Base URL | `https://api.minimax.chat` | API endpoint |
| Model | Auto-detected | Available models are loaded automatically |

### Getting API Key

1. Visit [MiniMax Platform](https://platform.minimax.chat)
2. Create an account or log in
3. Go to **API Keys** section
4. Create a new API key
5. Copy and paste into the app

> **Tip**: The model dropdown automatically fetches available models from MiniMax API. Make sure your API key is valid before opening the settings.

---

## How It Works

### Creating a Conversation

1. Click the **+** button in the toolbar (top-left)
2. A new conversation card appears on the canvas
3. Type your message in the input field
4. Press Enter or click the Send button
5. Wait for AI response (streaming in real-time)

### Branching (Expand Rightward)

1. Click the **+** button on any conversation card header
2. A new child conversation is created to the right
3. Visual connection line shows the parent-child relationship
4. Each child can have its own children (unlimited depth)
5. Drag to reposition cards freely

### One-click Summarize

1. Click the **Summarize** button on a parent conversation
2. The app automatically gathers all child conversation summaries
3. Generates a comprehensive summary
4. Adds the summary to the parent's messages

### Moving Cards

1. Click and drag the handle (⋮⋮) in the card header
2. Move to any position on the canvas
3. Cards snap to best position on release

### Resizing Cards

1. Drag the handle in the bottom-right corner of any card
2. Resize to your preferred dimensions
3. Minimum size is enforced

### Zooming

- **Trackpad**: Pinch to zoom in/out
- **Mouse Wheel**: Scroll while holding Cmd (Mac) or Ctrl (Windows)
- **Toolbar**: Use +/- buttons

### Attaching Files

1. Click the paperclip icon in the input area
2. Select an image (PNG, JPG, GIF, WebP) or PDF
3. File is processed and attached
4. Send your message with the attachment

### Adjusting Panels

- **Left Sidebar**: Drag the right edge to resize
- **Bottom Files Panel**: Drag the top edge to resize

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| Enter | Send message |
| Shift + Enter | New line in input |

---

## License

MIT

---

## Acknowledgments

- [MiniMax](https://minimax.chat) — AI API
- [Vite](https://vitejs.dev) — Build tool
- [React](https://react.dev) — UI library