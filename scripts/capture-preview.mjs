// Start `npm run dev -- --host 127.0.0.1` before capturing the local UI.
import { chromium } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

const output = fileURLToPath(new URL('../artifacts/ios-preview/', import.meta.url));
await mkdir(output, { recursive: true });
const browser = await chromium.launch({
  executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || undefined,
});
try {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, reducedMotion: 'reduce' });
  await page.route(/^https?:\/\//, route => ['127.0.0.1', 'localhost'].includes(new URL(route.request().url()).hostname) ? route.continue() : route.abort());
  const capture = async name => {
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({ path: join(output, `${name}.png`), fullPage: await page.getByRole('dialog').count() === 0 });
  };
  await page.goto('http://127.0.0.1:5173');
  await capture('01-home');
  await page.getByRole('button', { name: 'Start Game', exact: true }).click();
  await page.getByRole('textbox', { name: 'Team 1 name' }).fill('Court Kings');
  await page.getByRole('textbox', { name: 'Team 2 name' }).fill('Net Rippers');
  await capture('02-team-setup');
  await page.getByRole('button', { name: /^Tip Off/ }).click();
  await capture('03-game-board');
  await page.locator('.board-grid .slot:not(:disabled)').first().click();
  await capture('04-question');
  const count = await page.locator('.board-grid .slot').count();
  for (let turn = 0; turn < count; turn++) {
    if (turn) await page.locator('.board-grid .slot:not(:disabled)').first().click();
    const correct = await page.evaluate(() => JSON.parse(localStorage.getItem('hoops-trivia:match:v1')).state.currentQuestion.correctIndex);
    await page.locator('.q-options button').nth(turn % 3 === 1 ? (correct + 1) % 4 : correct).click();
    await page.getByRole('button', { name: /^Lock In/ }).click();
    if (!turn) await capture('05-answer');
    await page.getByRole('button', { name: /^(Next Turn|View Results)$/ }).click();
  }
  await capture('06-final-score');
  console.log(`Saved six phone previews to ${output}`);
} finally {
  await browser.close();
}
