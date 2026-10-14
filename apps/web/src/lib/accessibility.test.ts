import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { validateColorContrast } from './accessibility.ts';

describe('validateColorContrast', () => {
  describe('High Contrast Pairs (Pass AA and AAA)', () => {
    it('should return true for black on white at AA level', () => {
      assert.equal(validateColorContrast('#000000', '#ffffff', 'AA'), true);
    });

    it('should return true for black on white at AAA level', () => {
      assert.equal(validateColorContrast('#000000', '#ffffff', 'AAA'), true);
    });

    it('should default to AA level when no level is specified', () => {
      assert.equal(validateColorContrast('#000000', '#ffffff'), true);
    });

    it('should return true for white on black at AA level', () => {
      assert.equal(validateColorContrast('#ffffff', '#000000', 'AA'), true);
    });

    it('should return true for blue (#0000ff) on white (#ffffff)', () => {
      assert.equal(validateColorContrast('#0000ff', '#ffffff', 'AA'), true);
      assert.equal(validateColorContrast('#0000ff', '#ffffff', 'AAA'), true);
    });
  });

  describe('Low Contrast Pairs (Fail AA and AAA)', () => {
    it('should return false for yellow on white', () => {
      assert.equal(validateColorContrast('#ffff00', '#ffffff', 'AA'), false);
      assert.equal(validateColorContrast('#ffff00', '#ffffff', 'AAA'), false);
    });

    it('should return false for light gray on white', () => {
      assert.equal(validateColorContrast('#e0e0e0', '#ffffff', 'AA'), false);
    });

    it('should return false for identical colors', () => {
      assert.equal(validateColorContrast('#ffffff', '#ffffff', 'AA'), false);
      assert.equal(validateColorContrast('#000000', '#000000', 'AA'), false);
      assert.equal(validateColorContrast('#123456', '#123456', 'AA'), false);
    });
  });

  describe('Boundary Conditions (WCAG AA vs AAA)', () => {
    it('should pass AA but fail AAA for border-line gray (#767676 on white)', () => {
      // #767676 on #ffffff has a contrast ratio of ~4.54:1 (>= 4.5, < 7.0)
      assert.equal(validateColorContrast('#767676', '#ffffff', 'AA'), true);
      assert.equal(validateColorContrast('#767676', '#ffffff', 'AAA'), false);
    });

    it('should pass both AA and AAA for dark gray (#595959 on white)', () => {
      // #595959 on #ffffff has a contrast ratio of ~7.0:1
      assert.equal(validateColorContrast('#595959', '#ffffff', 'AA'), true);
      assert.equal(validateColorContrast('#595959', '#ffffff', 'AAA'), true);
    });

    it('should fail both AA and AAA for gray (#808080 on white)', () => {
      // #808080 on #ffffff has a contrast ratio of ~3.95:1 (< 4.5)
      assert.equal(validateColorContrast('#808080', '#ffffff', 'AA'), false);
      assert.equal(validateColorContrast('#808080', '#ffffff', 'AAA'), false);
    });
  });

  describe('Symmetry and Commutativity', () => {
    it('should yield identical results regardless of foreground/background argument order', () => {
      const fg = '#767676';
      const bg = '#ffffff';

      assert.equal(
        validateColorContrast(fg, bg, 'AA'),
        validateColorContrast(bg, fg, 'AA')
      );
      assert.equal(
        validateColorContrast(fg, bg, 'AAA'),
        validateColorContrast(bg, fg, 'AAA')
      );
    });
  });

  describe('Hex Format Handling', () => {
    it('should be case-insensitive for hex strings', () => {
      assert.equal(validateColorContrast('#FFFFFF', '#000000', 'AA'), true);
      assert.equal(validateColorContrast('#ffffff', '#000000', 'AA'), true);
      assert.equal(validateColorContrast('#FfFfFf', '#000000', 'AA'), true);
    });

    it('should handle hex strings without leading # symbol', () => {
      assert.equal(validateColorContrast('000000', 'ffffff', 'AA'), true);
      assert.equal(validateColorContrast('000000', 'ffffff', 'AAA'), true);
      assert.equal(validateColorContrast('ffff00', 'ffffff', 'AA'), false);
    });
  });

  describe('Edge Cases and Invalid Inputs', () => {
    it('should safely handle 3-digit hex strings without throwing', () => {
      const result = validateColorContrast('#000', '#fff', 'AA');
      assert.equal(typeof result, 'boolean');
    });

    it('should safely handle invalid color strings without throwing', () => {
      const result1 = validateColorContrast('invalid', '#ffffff', 'AA');
      const result2 = validateColorContrast('', '#000000', 'AA');
      assert.equal(typeof result1, 'boolean');
      assert.equal(typeof result2, 'boolean');
    });
  });
});
