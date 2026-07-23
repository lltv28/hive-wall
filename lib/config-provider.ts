import { promises as fs } from 'fs';
import path from 'path';
import { QuizConfig } from './quiz-config';

const CONFIG_PATH = path.join(process.cwd(), 'data', 'quiz-config.json');

export async function loadConfig(): Promise<QuizConfig> {
  const raw = await fs.readFile(CONFIG_PATH, 'utf-8');
  return JSON.parse(raw) as QuizConfig;
}

export async function saveConfig(config: QuizConfig): Promise<void> {
  const dir = path.dirname(CONFIG_PATH);
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(CONFIG_PATH, JSON.stringify(config, null, 2), 'utf-8');
}
