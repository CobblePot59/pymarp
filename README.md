# PyMarp

A comprehensive Markdown presentation tool that allows you to convert, edit, and preview Markdown files with ease.

## Features

### Convert PPTX
Convert your PowerPoint presentations to Markdown format. Perfect for migrating existing presentations to a more portable format.

### Edit
Edit and modify your Markdown files with a live preview panel. Write Markdown on one side and see your presentation render in real-time on the other.

### Preview
Preview your Markdown presentations in a beautiful, presentation-ready format. Supports fullscreen mode for presenting.

## Technologies

This project uses:
- **[Marp](https://github.com/marp-team/marp)** - Markdown presentation ecosystem
- **[pptx2md](https://github.com/ssine/pptx2md)** - PowerPoint to Markdown converter

## Quick Start

### Prerequisites
- Docker
- Docker Compose

### Installation

1. Clone the repository:
```bash
git clone https://github.com/CobblePot59/pymarp.git
cd pymarp
```

2. Start the application:
```bash
docker compose up -d --build
```

3. Open your browser and navigate to:
```
http://localhost:5000
```

## Markdown Syntax

Create slides by separating them with `---`:

```markdown
# Slide 1 Title

Welcome to your presentation

---

## Slide 2

- Point 1
- Point 2
- Point 3

---

## Slide 3

Content with **bold** and *italic*

---

## Code Example

\`\`\`javascript
const hello = () => {
  console.log("Hello World");
};
\`\`\`
```