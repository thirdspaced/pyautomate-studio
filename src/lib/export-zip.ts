// src/lib/export-zip.ts — Generate downloadable ZIP portfolio projects
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { db } from './db';

// ─── README Template ──────────────────────────────────────────

interface ReadmeParams {
  projectName: string;
  lessonId: string;
  description: string;
  objectives: string[];
  reflection: string;
  files: string[];
  remixTheme?: string;
}

function generateReadme(params: ReadmeParams): string {
  const { projectName, description, objectives, reflection, files, remixTheme } = params;

  const objectivesList = objectives.map((o) => `- ${o}`).join('\n');
  const filesList = files.map((f) => `- \`${f}\``).join('\n');
  const themeNote = remixTheme && remixTheme !== 'general'
    ? `\n> *Customized for the **${remixTheme}** domain.*\n`
    : '';

  return `# ${projectName}

${description}
${themeNote}
## Skills Practiced

${objectivesList}

## How to Run

\`\`\`bash
python main.py
\`\`\`

## Project Files

${filesList}

## What I Learned

${reflection || '_Add your reflection here before pushing to GitHub._'}

## Running Tests

\`\`\`bash
python -m pytest test_main.py -v
\`\`\`

---

*Built with [PyAutomate Studio](https://github.com/your-org/pyautomate-studio) — an interactive course for Automate the Boring Stuff with Python.*
`;
}

// ─── Export Function ──────────────────────────────────────────

export interface ExportOptions {
  lessonId: string;
  projectName: string;
  description?: string;
  objectives?: string[];
  includeTests?: boolean;
  testCode?: string;
}

export async function exportProjectZip(options: ExportOptions): Promise<void> {
  const {
    lessonId,
    projectName,
    description = 'A Python project from PyAutomate Studio.',
    objectives = [],
    includeTests = true,
    testCode,
  } = options;

  const zip = new JSZip();
  const folder = zip.folder(projectName)!;

  // ── Gather code artifacts ───────────────────────────────
  const allArtifacts = await db.codeArtifacts
    .where({ lessonId })
    .toArray();

  // Keep only the latest version per file
  const latestByFile = new Map<string, { content: string; version: number }>();
  for (const artifact of allArtifacts) {
    const existing = latestByFile.get(artifact.filename);
    if (!existing || artifact.version > existing.version) {
      latestByFile.set(artifact.filename, {
        content: artifact.content,
        version: artifact.version,
      });
    }
  }

  // Add each file to the ZIP
  const fileNames: string[] = [];
  for (const [filename, { content }] of latestByFile) {
    folder.file(filename, content);
    fileNames.push(filename);
  }

  // ── Get lesson state for reflection ─────────────────────
  const lessonState = await db.lessonStates.get(lessonId);
  const profile = await db.userProfile.get('default');

  // ── Generate README ─────────────────────────────────────
  const readme = generateReadme({
    projectName,
    lessonId,
    description,
    objectives,
    reflection: lessonState?.reflection ?? '',
    files: fileNames,
    remixTheme: profile?.portfolioTheme,
  });
  folder.file('README.md', readme);

  // ── Add .gitignore ──────────────────────────────────────
  folder.file('.gitignore', [
    '__pycache__/',
    '*.pyc',
    '*.pyo',
    '.env',
    'venv/',
    '.venv/',
    '*.egg-info/',
    'dist/',
    'build/',
  ].join('\n'));

  // ── Add requirements.txt (placeholder) ──────────────────
  folder.file('requirements.txt', '# Add your project dependencies here\n');

  // ── Add test file ───────────────────────────────────────
  if (includeTests) {
    const testContent = testCode ?? [
      '"""Auto-generated test suite for ' + projectName + '"""',
      'import pytest',
      '',
      '# Import your main module',
      '# import main',
      '',
      'def test_placeholder():',
      '    """Replace with real tests."""',
      '    assert True',
      '',
    ].join('\n');

    folder.file('test_main.py', testContent);
    fileNames.push('test_main.py');
  }

  // ── Generate ZIP and trigger download ───────────────────
  const blob = await zip.generateAsync({
    type: 'blob',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 },
  });

  saveAs(blob, `${projectName}.zip`);

  // ── Record export manifest ──────────────────────────────
  await db.exportManifests.add({
    lessonId,
    projectName,
    files: fileNames.map((f) => ({
      filename: f,
      size: latestByFile.get(f)?.content.length ?? 0,
    })),
    portfolioReady: lessonState?.status === 'completed',
    narrative: lessonState?.reflection,
    exportedAt: new Date(),
  });
}
