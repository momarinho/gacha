export function getXpRequiredForLevel(level: number) {
  return 100 + Math.max(0, level - 1) * 25;
}
