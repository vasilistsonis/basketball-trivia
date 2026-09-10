import type { CategoryId, GameCategory, Question } from '../types';

export const CATEGORY_DEFINITIONS = [
  { id: 'geography', label: 'Geography', icon: '🌍', description: 'NBA & EuroLeague arenas, cities and courts', color: '#3B4D8A', prefix: 'geography', points: [1, 2, 3] },
  { id: 'history', label: 'History', icon: '📜', description: 'Basketball champions, records and milestones', color: '#A4661B', prefix: 'history', points: [1, 2, 3] },
  { id: 'logo', label: 'Logo', icon: '🎨', description: 'Team emblems, colors and visual clues', color: '#77508A', prefix: 'logo', points: [1, 2] },
  { id: 'guess-whos-missing', label: "Who's Missing?", icon: '🔍', description: 'Complete an iconic basketball lineup', color: '#10523A', prefix: 'missing', points: [1, 2, 3] },
  { id: 'guess-the-player', label: 'Guess the Player', icon: '🃏', description: 'Name the player from his career clues', color: '#B5311A', prefix: 'player', points: [1, 2, 3] },
] as const;

export const SLOT_DEFINITIONS = CATEGORY_DEFINITIONS.flatMap((category) =>
  category.points.map((points) => ({ key: `${category.prefix}-${points}`, category: category.id, points })),
);

export function findSlot(key: string) {
  return SLOT_DEFINITIONS.find((slot) => slot.key === key);
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

export function isNonEmptyString(value: unknown, maxLength = 500): value is string {
  return typeof value === 'string' && value.trim().length > 0 && value.length <= maxLength;
}

export function isIndex(value: unknown): value is number {
  return Number.isInteger(value) && (value as number) >= 0 && (value as number) < 4;
}

export function isCategoryId(value: unknown): value is CategoryId {
  return CATEGORY_DEFINITIONS.some((category) => category.id === value);
}

export function isImageUrl(value: unknown): value is string {
  if (typeof value !== 'string' || value.length > 2048) return false;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && !url.username && !url.password;
  } catch {
    return false;
  }
}

export function isQuestion(value: unknown): value is Question {
  if (!isRecord(value)) return false;
  return isNonEmptyString(value.id, 100)
    && isCategoryId(value.category)
    && Number.isInteger(value.points) && (value.points as number) >= 1 && (value.points as number) <= 3
    && isNonEmptyString(value.question, 4000)
    && Array.isArray(value.options) && value.options.length === 4
    && value.options.every((option) => isNonEmptyString(option, 500))
    && new Set(value.options.map((option) => (option as string).trim().toLocaleLowerCase())).size === 4
    && isIndex(value.correctIndex)
    && (value.imageUrl === undefined || isImageUrl(value.imageUrl));
}

/** The board always has the original five categories and fourteen slots. */
export function categoriesFromCounts(counts: ReadonlyMap<string, number>): GameCategory[] {
  return CATEGORY_DEFINITIONS.map(({ prefix, points, ...category }) => {
    const slots = points.map((pointValue) => {
      const key = `${prefix}-${pointValue}`;
      return { key, points: pointValue, questionCount: counts.get(key) ?? 0 };
    });
    return { ...category, slots, questionCount: slots.reduce((sum, slot) => sum + slot.questionCount, 0) };
  });
}

export function isCategories(value: unknown): value is GameCategory[] {
  if (!Array.isArray(value) || value.length !== CATEGORY_DEFINITIONS.length) return false;
  return value.every((category, index) => {
    const definition = CATEGORY_DEFINITIONS[index];
    if (!isRecord(category) || category.id !== definition.id
      || !isNonEmptyString(category.label, 80) || !isNonEmptyString(category.description, 250)
      || !isNonEmptyString(category.icon, 20) || typeof category.color !== 'string' || !/^#[a-f\d]{6}$/i.test(category.color)
      || !Array.isArray(category.slots) || category.slots.length !== definition.points.length) return false;
    const validSlots = category.slots.every((slot, slotIndex) => isRecord(slot)
      && slot.key === `${definition.prefix}-${definition.points[slotIndex]}`
      && slot.points === definition.points[slotIndex]
      && Number.isSafeInteger(slot.questionCount) && (slot.questionCount as number) > 0
      && (slot.questionCount as number) <= 100_000);
    return validSlots && category.questionCount === category.slots.reduce((sum: number, slot: { questionCount: number }) => sum + slot.questionCount, 0);
  });
}
