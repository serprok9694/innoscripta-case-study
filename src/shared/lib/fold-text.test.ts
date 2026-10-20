import { describe, expect, it } from 'vitest';
import { foldText } from './fold-text';

describe('foldText', () => {
  it('ignores case, accents and surrounding whitespace', () => {
    expect(foldText('  Ségolène LE Stradic ')).toBe('segolene le stradic');
  });
});
