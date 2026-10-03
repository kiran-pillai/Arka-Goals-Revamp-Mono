export const AVATAR_COLOR_POOL = [
  '#e6a532', '#228be6', '#7950f2', '#12b886', '#e64980',
  '#f76707', '#15aabf', '#82c91e', '#be4bdb', '#4263eb',
  '#fd7e14', '#20c997', '#d6336c', '#1098ad', '#5c940d',
  '#9c36b5', '#2b8a3e', '#e8590c', '#1c7ed6', '#ae3ec9',
  '#0ca678', '#f06595', '#3b5bdb', '#66a80f', '#e03131',
  '#0c8599', '#845ef7', '#2f9e44', '#c2255c', '#1971c2',
  '#7048e8', '#099268', '#f03e3e', '#1864ab', '#862e9c',
  '#37b24d', '#d9480f', '#4dabf7', '#9775fa', '#38d9a9',
  '#ff6b6b', '#3bc9db', '#a9e34b', '#da77f2', '#fcc419',
  '#748ffc', '#63e6be', '#ff8787', '#66d9e8', '#c0eb75',
];

export function assignColorSlot(usedSlots: number[]): number {
  const taken = new Set(usedSlots);
  let slot = 0;
  while (taken.has(slot)) slot++;
  return slot;
}
