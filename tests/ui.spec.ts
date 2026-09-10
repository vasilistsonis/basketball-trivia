import { expect, test, type Page } from '@playwright/test';
import type { GameState } from '../src/types';

const STORAGE_KEY = 'hoops-trivia:match:v1';
const pageErrors = new WeakMap<Page, string[]>();

test.beforeEach(async ({ page }) => {
  const errors: string[] = [];
  pageErrors.set(page, errors);
  page.on('pageerror', (error) => errors.push(error.message));
  // Exercise the bundled game even if a developer has local Supabase settings.
  // No remote data is seeded or modified, and no external HTTP request leaves
  // the test browser. Local Vite resources remain available.
  await page.route(/^https?:\/\//, async (route) => {
    const hostname = new URL(route.request().url()).hostname;
    if (['127.0.0.1', 'localhost', '[::1]'].includes(hostname)) await route.continue();
    else await route.abort('blockedbyclient');
  });
});

test.afterEach(async ({ page }) => {
  expect(pageErrors.get(page), 'The app should not throw unhandled browser errors').toEqual([]);
});

async function readSavedState(page: Page): Promise<GameState> {
  const state = await page.evaluate((key) => {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw).state : null;
  }, STORAGE_KEY);
  expect(state, 'An active match should be saved on this device').toBeTruthy();
  return state as GameState;
}

async function expectNoHorizontalOverflow(page: Page) {
  await expect.poll(() => page.evaluate(() => Math.max(
    document.documentElement.scrollWidth - document.documentElement.clientWidth,
    document.body.scrollWidth - document.documentElement.clientWidth,
    ...Array.from(document.querySelectorAll<HTMLElement>('.modal-panel'))
      .map((panel) => panel.scrollWidth - panel.clientWidth),
  )), { message: 'Screens and sheets should fit without horizontal scrolling' }).toBeLessThanOrEqual(1);
}

async function openSetup(page: Page) {
  await page.goto('/');
  await page.getByRole('button', { name: /^Start Game$/i }).click();
  await expect(page.getByRole('textbox', { name: 'Team 1 name' })).toBeVisible();
}

async function startMatch(page: Page, names = ['North Stars', 'Fast Break']) {
  await openSetup(page);
  await page.getByRole('textbox', { name: 'Team 1 name' }).fill(names[0]);
  await page.getByRole('textbox', { name: 'Team 2 name' }).fill(names[1]);
  await page.getByRole('button', { name: /^Tip Off/i }).click();
  await expect(page.locator('.board-grid')).toBeVisible();
}

async function openQuestion(page: Page) {
  await page.locator('.board-grid').getByRole('button', { disabled: false }).first().click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await expect.poll(async () => (await readSavedState(page)).currentQuestion?.id).toBeTruthy();
  return (await readSavedState(page)).currentQuestion!;
}

async function resumeFromHome(page: Page) {
  await page.getByRole('button', { name: /^Resume Game$/i }).click();
}

test('home, setup, board and questions fit phone and tablet widths', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('button', { name: /^Start Game$/i })).toBeEnabled();
  await expectNoHorizontalOverflow(page);
  await page.getByRole('button', { name: /^Start Game$/i }).click();
  await page.getByRole('textbox', { name: 'Team 1 name' }).fill('West Coast Ballers!!');
  await page.getByRole('textbox', { name: 'Team 2 name' }).fill('Championship Crew!!!');
  await expectNoHorizontalOverflow(page);
  await page.getByRole('button', { name: /^Tip Off/i }).click();
  await expect(page.locator('.board-col')).toHaveCount(5);
  await expectNoHorizontalOverflow(page);
  const tiles = page.locator('.board-grid .slot');
  const tileSizes = await tiles.evaluateAll((elements) => elements.map((element) => {
    const rect = element.getBoundingClientRect();
    return { width: rect.width, height: rect.height };
  }));
  for (const size of tileSizes) {
    expect(size.width, 'Question tiles need a usable touch width').toBeGreaterThanOrEqual(44);
    expect(size.height, 'Question tiles need a usable touch height').toBeGreaterThanOrEqual(44);
  }
  await openQuestion(page);
  await expectNoHorizontalOverflow(page);
  await page.getByRole('dialog').getByRole('button', { name: /^Save & Exit$/i }).scrollIntoViewIfNeeded();
  await expect(page.getByRole('dialog').getByRole('button', { name: /^Save & Exit$/i })).toBeInViewport();
});

test('rules, privacy and category sheets trap focus and restore the opener', async ({ page }) => {
  await page.goto('/');
  const sheets = [
    { trigger: /^How to play/i, title: 'How to play', content: 'Use your power-ups' },
    { trigger: /^Privacy$/i, title: 'Your privacy', content: 'Your game stays on your device' },
    { trigger: /^Preview Geography$/i, title: 'Geography', content: null },
  ];
  for (const sheet of sheets) {
    const trigger = page.getByRole('button', { name: sheet.trigger });
    await trigger.scrollIntoViewIfNeeded();
    const before = await page.evaluate(() => ({ scroll: window.scrollY, position: document.body.style.position }));
    await trigger.click();
    const dialog = page.getByRole('dialog', { name: sheet.title, exact: true });
    await expect(dialog).toBeVisible();
    await expect(dialog).toHaveAttribute('aria-modal', 'true');
    await expect(dialog.getByRole('heading', { name: sheet.title, exact: true })).toBeFocused();
    await expect(page.locator('#root')).toHaveAttribute('inert', '');
    await expect(page.locator('#root')).toHaveAttribute('aria-hidden', 'true');
    if (sheet.content) await expect(dialog.getByRole('heading', { name: sheet.content, exact: true })).toBeVisible();
    const close = dialog.getByRole('button', { name: `Close ${sheet.title}`, exact: true });
    const done = dialog.getByRole('button', { name: /^(Done|Got it)/i });
    await page.keyboard.press('Shift+Tab');
    await expect(done).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(close).toBeFocused();
    await page.keyboard.press('Shift+Tab');
    await expect(done).toBeFocused();
    await expectNoHorizontalOverflow(page);
    await page.keyboard.press('Escape');
    await expect(dialog).toHaveCount(0);
    await expect(trigger).toBeFocused();
    await expect(page.locator('#root')).not.toHaveAttribute('inert', '');
    expect(await page.evaluate(() => document.body.style.position)).toBe(before.position);
    expect(Math.abs(await page.evaluate(() => window.scrollY) - before.scroll)).toBeLessThanOrEqual(1);
  }
});

test('team names validate duplicates and empty names fall back to defaults', async ({ page }) => {
  await openSetup(page);
  const first = page.getByRole('textbox', { name: 'Team 1 name' });
  const second = page.getByRole('textbox', { name: 'Team 2 name' });
  await expect(first).toHaveAttribute('maxlength', '20');
  await first.fill('Same Team');
  await second.fill(' same TEAM ');
  await page.getByRole('button', { name: /^Tip Off/i }).click();
  await expect(page.getByRole('alert')).toContainText('different name');
  await expect(first).toBeVisible();
  await first.fill('   ');
  await second.fill('   ');
  await page.getByRole('button', { name: /^Tip Off/i }).click();
  await expect(page.locator('.board-grid')).toBeVisible();
  await expect(page.locator('.scoreboard')).toContainText('Team 1');
  await expect(page.locator('.scoreboard')).toContainText('Team 2');
  await expectNoHorizontalOverflow(page);
});

test('selection, power-up and revealed result survive save, exit and relaunch', async ({ page }) => {
  await startMatch(page);
  const question = await openQuestion(page);
  let dialog = page.getByRole('dialog');
  await dialog.locator('.q-options').getByRole('button').nth(question.correctIndex).click();
  await dialog.getByRole('button', { name: /Double Up/i }).click();
  await dialog.getByRole('button', { name: /^Save & Exit$/i }).click();
  await resumeFromHome(page);
  dialog = page.getByRole('dialog');
  await expect(dialog.locator('.q-text')).toHaveText(question.question);
  await expect(dialog.locator('.q-options').getByRole('button').nth(question.correctIndex)).toHaveClass(/is-selected/);
  expect((await readSavedState(page)).activeDouble).toBe(true);

  await page.reload();
  await resumeFromHome(page);
  dialog = page.getByRole('dialog');
  await expect(dialog.locator('.q-text')).toHaveText(question.question);
  await expect(dialog.locator('.q-options').getByRole('button').nth(question.correctIndex)).toHaveClass(/is-selected/);
  await dialog.getByRole('button', { name: /^Lock In/i }).click();
  await expect(dialog.locator('.q-result')).toContainText(`+${question.points * 2}`);
  await expect.poll(async () => (await readSavedState(page)).teams[0].score).toBe(question.points * 2);

  await page.reload();
  await resumeFromHome(page);
  dialog = page.getByRole('dialog');
  await expect(dialog.locator('.q-result')).toContainText(`+${question.points * 2}`);
  await expect(dialog.getByRole('button', { name: /^Lock In/i })).toHaveCount(0);
  await expect(dialog.locator('.q-options').getByRole('button', { disabled: true })).toHaveCount(4);
  await dialog.getByRole('button', { name: /^(Next Turn|View Results)/i }).click();
  await expect(page.locator('.board-grid .slot.answered')).toHaveCount(1);
  const saved = await readSavedState(page);
  expect(saved.teams[0].score).toBe(question.points * 2);
  expect(saved.teams[1].score).toBe(0);
  expect(saved.currentTeamIndex).toBe(1);
  await expect(page.locator('.turn-bar')).toContainText('Fast Break');
});

test('Fifty Fifty clears an eliminated selection and prevents combining power-ups', async ({ page }) => {
  // A stable random source makes the chosen wrong answer one of the two
  // eliminations, so this regression cannot pass by chance.
  await page.addInitScript(() => { Math.random = () => 0.999999; });
  await startMatch(page);
  const question = await openQuestion(page);
  const dialog = page.getByRole('dialog');
  const wrongIndex = question.options.findIndex((_, index) => index !== question.correctIndex);
  const options = dialog.locator('.q-options').getByRole('button');
  await options.nth(wrongIndex).click();
  await expect(dialog.getByRole('button', { name: /^Lock In/i })).toBeEnabled();
  await dialog.getByRole('button', { name: /Fifty Fifty/i }).click();
  await expect(options.nth(wrongIndex)).toBeDisabled();
  await expect(dialog.locator('.q-options').getByRole('button', { disabled: true })).toHaveCount(2);
  await expect(dialog.locator('.q-options .is-selected')).toHaveCount(0);
  await expect(dialog.getByRole('button', { name: /^(Select an Answer|Lock In)/i })).toBeDisabled();
  await expect(dialog.getByRole('button', { name: /Double Up/i })).toBeDisabled();
  await expect(dialog.getByRole('button', { name: /Fifty Fifty/i })).toBeDisabled();
  await options.nth(question.correctIndex).click();
  await dialog.getByRole('button', { name: /^Lock In/i }).click();
  await expect(dialog.locator('.q-result')).toContainText(`+${Math.ceil(question.points / 2)}`);
});

test('an entire offline match alternates teams and produces the correct final score', async ({ page }) => {
  test.setTimeout(120_000);
  await startMatch(page);
  const totalSlots = await page.locator('.board-grid .slot').count();
  expect(totalSlots).toBeGreaterThan(0);
  const scores = [0, 0];
  const correctCounts = [0, 0];

  for (let turn = 0; turn < totalSlots; turn += 1) {
    const question = await openQuestion(page);
    const dialog = page.getByRole('dialog');
    const team = turn % 2;
    expect((await readSavedState(page)).currentTeamIndex).toBe(team);
    let points = question.points;
    if (turn === 0 || turn === 3) {
      await dialog.getByRole('button', { name: /Double Up/i }).click();
      points *= 2;
      await expect(dialog.getByRole('button', { name: /Fifty Fifty/i })).toBeDisabled();
    } else if (turn === 1 || turn === 2) {
      await dialog.getByRole('button', { name: /Fifty Fifty/i }).click();
      points = Math.ceil(points / 2);
      await expect(dialog.getByRole('button', { name: /Double Up/i })).toBeDisabled();
    } else {
      await expect(dialog.getByRole('button', { name: /Double Up/i })).toBeDisabled();
      await expect(dialog.getByRole('button', { name: /Fifty Fifty/i })).toBeDisabled();
    }
    const correct = turn < 4 || turn % 3 !== 1;
    const selected = correct ? question.correctIndex : question.options.findIndex((_, index) => index !== question.correctIndex);
    await dialog.locator('.q-options').getByRole('button').nth(selected).click();
    await dialog.getByRole('button', { name: /^Lock In/i }).click();
    const earned = correct ? points : 0;
    scores[team] += earned;
    if (correct) correctCounts[team] += 1;
    await expect(dialog.locator('.q-result')).toContainText(correct ? `+${earned}` : `Correct answer: ${question.options[question.correctIndex]}`);
    await expect.poll(async () => (await readSavedState(page)).teams.map((entry) => entry.score)).toEqual(scores);
    await dialog.getByRole('button', { name: turn === totalSlots - 1 ? /^View Results/i : /^Next Turn/i }).click();
    if (turn < totalSlots - 1) await expect(page.locator('.board-grid .slot.answered')).toHaveCount(turn + 1);
  }

  await expect(page.locator('.go-final')).toBeVisible();
  await expect.poll(async () => (await page.locator('.go-final-score').allTextContents()).map(Number)).toEqual(scores);
  const final = await readSavedState(page);
  expect(Object.keys(final.answeredSlots)).toHaveLength(totalSlots);
  expect(final.phase).toBe('game-over');
  for (const team of [0, 1]) {
    const attempts = team === 0 ? Math.ceil(totalSlots / 2) : Math.floor(totalSlots / 2);
    await expect(page.locator('.go-final-row').nth(team)).toContainText(new RegExp(`${correctCounts[team]}\\s*/\\s*${attempts}\\s+correct`));
  }
  await expectNoHorizontalOverflow(page);
});
