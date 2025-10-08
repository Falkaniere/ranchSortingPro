import { RiderCategory } from 'core/models/Competidor';
import { DuoGroup } from 'core/models/Duo';

export function computeDuoGroup(
  catA: RiderCategory,
  catB: RiderCategory
): DuoGroup {
  // 1D combinations
  const oneDTable: Array<[RiderCategory, RiderCategory]> = [
    ['Open', 'Amateur19'],
    ['Open', 'AmateurLight'],
    ['Amateur19', 'AmateurLight'],
  ];

  const twoDTable: Array<[RiderCategory, RiderCategory]> = [
    ['Open', 'Beginner'],
    ['Amateur19', 'Beginner'],
    ['AmateurLight', 'AmateurLight'],
    ['AmateurLight', 'Beginner'],
    ['Beginner', 'Beginner'],
  ];

  const pair: [RiderCategory, RiderCategory] = [catA, catB].sort() as any;

  const is1D = oneDTable.some(([x, y]) => {
    const s = [x, y].sort();
    return s[0] === pair[0] && s[1] === pair[1];
  });
  if (is1D) return '1D';

  const is2D = twoDTable.some(([x, y]) => {
    const s = [x, y].sort();
    return s[0] === pair[0] && s[1] === pair[1];
  });
  if (is2D) return '2D';

  // If a combination is not in any table, default to 1D by policy — but you can change this throw if needed.
  // throw new Error(`Unsupported category combination: ${catA} + ${catB}`);
  return '1D';
}
