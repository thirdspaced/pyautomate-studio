# 🐍 PyAutomate Studio

An interactive, browser-based Python learning platform built on [Automate the Boring Stuff with Python](https://automatetheboringstuff.com). Write, run, and test Python code directly in your browser — no installation required.

**Live site:** `https://<your-username>.github.io/pyautomate-studio/`

---

## Deploy to GitHub Pages (5 minutes)

### 1. Create a GitHub repository

```bash
# In the pyautomate-studio folder:
git init
git add .
git commit -m "Initial commit"

# Create a repo on GitHub (via github.com or CLI), then:
git remote add origin https://github.com/<your-username>/pyautomate-studio.git
git branch -M main
git push -u origin main
```

### 2. Enable GitHub Pages

1. Go to your repo on GitHub → **Settings** → **Pages**
2. Under **Source**, select **GitHub Actions**
3. That's it — the included workflow (`.github/workflows/deploy.yml`) auto-deploys on every push to `main`
4. Note: Your repo needs to be public for free pages to work unless you have pro/enterprise.

### 3. Wait ~2 minutes for the first build

Check the **Actions** tab on your repo to watch the build. Once it's green, your site is live at:

```
https://<your-username>.github.io/pyautomate-studio/
```

### Updating the site

Every time you push to `main`, GitHub Actions automatically rebuilds and redeploys. Just:

```bash
git add .
git commit -m "Add new lessons"
git push
```

---

## Run Locally (for development)

```bash
npm install
npm run dev
# Open http://localhost:3000
```

No database, no Docker, no API keys needed.

## Prerequisites

- **Node.js 18+** — [download here](https://nodejs.org/)
- **npm** (comes with Node.js)
- A **GitHub** account (for deployment)

## What Works

| Feature | Status |
|---|---|
| Course dashboard with all modules | ✅ |
| Lesson viewer with learning content | ✅ |
| Python editor (CodeMirror + syntax highlighting) | ✅ |
| Run Python in the browser (Pyodide WASM) | ✅ |
| Automated test runner for exercises | ✅ |
| Progressive hint system | ✅ |
| Self-assessment checkpoints | ✅ |
| Lesson navigation (prev/next) | ✅ |
| 20 authored lessons (Modules 1–4) | ✅ |
| Static export to GitHub Pages | ✅ |
| Auto-deploy via GitHub Actions | ✅ |
| Local progress saved in browser (IndexedDB) | 🔧 Wired, needs UI connection |
| Portfolio ZIP export | 🔧 Logic exists, needs UI button |
| AI Remix system | 📋 Planned |

## How It Works

The entire app is a **static site** — no server at all. Here's the architecture:

- **Build time:** Next.js reads the lesson JSON files and pre-renders every page as static HTML/JS
- **Runtime:** Each visitor's browser loads the page and runs Python via **Pyodide** (Python compiled to WebAssembly, loaded from CDN)
- **Storage:** Progress and code snapshots are saved in **IndexedDB** (each visitor's browser, private to them)
- **Cost:** Hosting is free on GitHub Pages. No serverless functions, no database, no API keys

### Lesson Data Flow

```
content/lessons/*.json  →  Next.js static export (build time)  →  GitHub Pages (CDN)
                                                                        ↓
                                                               Visitor's browser
                                                                        ↓
                                                    CodeMirror editor + Pyodide WASM runtime
                                                                        ↓
                                                              Run Python, check tests
```

## Authoring New Lessons

Each lesson is a single JSON file. Here's the minimal structure:

```json
{
  "id": "m05-l01",
  "moduleId": "m05",
  "title": "Your Lesson Title",
  "order": 1,
  "estimatedMinutes": 20,
  "objectives": ["Learn X", "Practice Y"],
  "prerequisites": ["m04-l03"],
  "tags": ["skill1", "skill2"],
  "sections": [
    {
      "type": "concept",
      "title": "Key Idea",
      "content": "Markdown content explaining the concept..."
    },
    {
      "type": "exercise",
      "title": "Try It",
      "content": "Write a function that...",
      "starterCode": "def my_func():\n    # your code here\n    pass",
      "solutionCode": "def my_func():\n    return 42",
      "tests": [
        {"name": "returns_42", "assertion": "_assert_test('returns_42', my_func() == 42, 'Should return 42')", "points": 10}
      ],
      "hints": [
        "What value should the function return?",
        "Use the return keyword",
        "return 42"
      ]
    }
  ]
}
```

After creating the file, add its ID to `content/curriculum.json` under the appropriate module. Push to `main` and it auto-deploys.

## Available Scripts

```bash
npm run dev       # Local dev server on :3000
npm run build     # Static export to /out directory
npm run start     # Serve the static export locally
npm run lint      # ESLint
```

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (static export) |
| UI | React 19 + Tailwind CSS v4 |
| Editor | CodeMirror 6 (Python mode + One Dark) |
| Python Runtime | Pyodide 0.26.4 (WASM, from CDN) |
| State | Zustand 5 |
| Persistence | Dexie.js 4 (IndexedDB) |
| Hosting | GitHub Pages (free) |
| CI/CD | GitHub Actions |

## Troubleshooting

**Build fails on GitHub Actions?**
Check the Actions tab for error logs. Most common issue: missing `npm ci` or Node version mismatch. The workflow uses Node 20.

**Pyodide takes a long time to load on first visit?**
Normal — it downloads ~15MB of WASM files from CDN. Cached by the browser after first load.

**Site shows 404 on GitHub Pages?**
Make sure you set Pages source to "GitHub Actions" (not "Deploy from branch") in Settings → Pages.

**Links broken on GitHub Pages?**
The `basePath` in `next.config.ts` should match your repo name. It reads from the `REPO_NAME` env var set in the workflow. If your repo is named something other than `pyautomate-studio`, it auto-adapts.

**Want to use a custom domain?**
Add a `CNAME` file to the `public/` directory with your domain name, and configure DNS per [GitHub's docs](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site).
