import type { BugQuestion, BugData } from './types';

// Load all Correction JSON banks
const questionBankModules = import.meta.glob('../../../../Content/grammar/**/*-Correction.json', { query: 'url', import: 'default' });

/**
 * Load questions based on a topic (or load all if no topic provided).
 * For now, we load all of them, or match by a keyword.
 */
export async function loadCorrectionQuestions(topicPattern?: string): Promise<BugQuestion[]> {
  let allQuestions: BugQuestion[] = [];
  
  for (const path in questionBankModules) {
    if (!topicPattern || path.toLowerCase().includes(topicPattern.toLowerCase())) {
      try {
        // Fetch the JSON file content using the URL returned by Vite
        const url = await questionBankModules[path]() as string;
        const response = await fetch(url);
        const data = await response.json() as BugQuestion[];
        allQuestions = allQuestions.concat(data);
      } catch (e) {
        console.error(`Failed to load ${path}:`, e);
      }
    }
  }

  // Shuffle the questions
  return allQuestions.sort(() => Math.random() - 0.5);
}
