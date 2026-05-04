# DeepChat

A modern AI chat application with tree-structured conversations, inspired by mind-map thinking. Built with React, TypeScript, and MiniMax API.

![DeepChat](https://img.shields.io/badge/React-19-blue) ![TypeScript](https://img.shields.io/badge/TypeScript-6-blue) ![Vite](https://img.shields.io/badge/Vite-8-purple)

## Features

- **Tree-structured Conversations**: Create parent-child conversation branches, visualize thinking paths like a mind map
- **Drag & Resize**: Freely arrange conversation cards on an infinite canvas
- **Trackpad Zoom**: Smooth zoom with pinch gestures (trackpad/wheel)
- **One-click Summarize**: Aggregate all child conversation summaries into parent
- **File Attachments**: Support for images, PDFs, and code files
- **Web Search**: Built-in DuckDuckGo search for up-to-date information
- **Markdown Rendering**: Full GFM support with syntax highlighting
- **Resizable Panels**: Adjustable sidebar and files panel
- **Local Storage**: Auto-save all conversations and UI state

## Tech Stack

- React 19 + TypeScript 6
- Vite 8 (build tool)
- MiniMax API (AI chat with streaming)
- PDF.js (PDF parsing)
- react-markdown + remark-gfm (Markdown)
- highlight.js (syntax highlighting)
- localStorage (persistence)

## Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

## Configuration

Click the API button in the toolbar to configure:

- **API Key**: Your MiniMax API key
- **Base URL**: API endpoint (default: `https://api.minimax.chat`)
- **Model**: Model ID (e.g., `abab6.5s-chat`)

## Usage

- **New Chat**: Click the + button to create a new conversation
- **Add Child**: Click + on a conversation card to create a child branch
- **Summarize**: Click the summarize button to aggregate child conversations
- **Zoom**: Use trackpad/pinch or toolbar buttons
- **Move**: Drag the handle (⋮⋮) on card header
- **Resize**: Drag the corner handle on card bottom-right

## License

MIT