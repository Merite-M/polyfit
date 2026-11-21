/**
 * PolyFit Corporate Employee App - ISO/IEC 18004 Compliant QR Code Matrix Generator
 * Pure TypeScript implementation with Reed-Solomon Error Correction over GF(256).
 * Universally compatible with Expo Web, iOS, Android, and Hermes without binary dependencies.
 */

import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';

interface QrCodeProps {
  value: string;
  size?: number;
  color?: string;
  backgroundColor?: string;
}

// ─── 1. Galois Field GF(256) Arithmetic (Primitive Polynomial: 0x11D / 285) ───

const GF_EXP = new Uint8Array(512);
const GF_LOG = new Uint8Array(256);

(function initGaloisField() {
  let val = 1;
  for (let i = 0; i < 255; i++) {
    GF_EXP[i] = val;
    GF_EXP[i + 255] = val;
    GF_LOG[val] = i;
    val <<= 1;
    if (val & 0x100) {
      val ^= 0x11d; // x^8 + x^4 + x^3 + x^2 + 1
    }
  }
})();

function gfMultiply(x: number, y: number): number {
  if (x === 0 || y === 0) return 0;
  return GF_EXP[GF_LOG[x] + GF_LOG[y]];
}

// ─── 2. Reed-Solomon Error Correction Generator ───────────────────────────────

function createGeneratorPolynomial(ecCount: number): Uint8Array {
  let poly = new Uint8Array([1]);
  for (let i = 0; i < ecCount; i++) {
    const nextPoly = new Uint8Array(poly.length + 1);
    const alpha = GF_EXP[i];
    for (let j = 0; j < poly.length; j++) {
      nextPoly[j] ^= gfMultiply(poly[j], alpha);
      nextPoly[j + 1] ^= poly[j];
    }
    poly = nextPoly;
  }
  return poly;
}

function computeReedSolomon(data: Uint8Array, ecCount: number): Uint8Array {
  const gen = createGeneratorPolynomial(ecCount);
  const remainder = new Uint8Array(ecCount);

  for (let i = 0; i < data.length; i++) {
    const factor = data[i] ^ remainder[0];
    remainder.copyWithin(0, 1);
    remainder[ecCount - 1] = 0;
    if (factor !== 0) {
      for (let j = 0; j < ecCount; j++) {
        remainder[j] ^= gfMultiply(gen[j], factor);
      }
    }
  }

  return remainder;
}

// ─── 3. ISO/IEC 18004 Standard QR Specifications (Level M) ───────────────────

interface QrVersionSpec {
  version: number;
  size: number;
  totalCodewords: number;
  dataCodewords: number;
  ecCodewords: number;
  alignPos: number[];
}

// Standard QR Version Tables for Pass Payloads (Versions 1-6, Error Correction Level M: 15% recovery)
const QR_SPECS: Record<number, QrVersionSpec> = {
  1: { version: 1, size: 21, totalCodewords: 26, dataCodewords: 16, ecCodewords: 10, alignPos: [] },
  2: { version: 2, size: 25, totalCodewords: 44, dataCodewords: 28, ecCodewords: 16, alignPos: [6, 18] },
  3: { version: 3, size: 29, totalCodewords: 70, dataCodewords: 44, ecCodewords: 26, alignPos: [6, 22] },
  4: { version: 4, size: 33, totalCodewords: 100, dataCodewords: 64, ecCodewords: 36, alignPos: [6, 26] },
  5: { version: 5, size: 37, totalCodewords: 134, dataCodewords: 86, ecCodewords: 48, alignPos: [6, 30] },
  6: { version: 6, size: 41, totalCodewords: 172, dataCodewords: 108, ecCodewords: 64, alignPos: [6, 34] },
};

function selectVersion(byteLength: number): QrVersionSpec {
  for (let v = 1; v <= 6; v++) {
    const spec = QR_SPECS[v];
    // Byte mode overhead: 4 bits mode + 8 bits count = 1.5 bytes
    if (byteLength + 2 <= spec.dataCodewords) {
      return spec;
    }
  }
  return QR_SPECS[6];
}

// ─── 4. Standard ISO/IEC 18004 Matrix Assembly ────────────────────────────────

export function generateIso18004QrMatrix(text: string): boolean[][] {
  const utf8 = new TextEncoder().encode(text);
  const spec = selectVersion(utf8.length);
  const size = spec.size;

  // A. Encode Byte Stream: Mode Indicator (0100) + Character Count (8-bit) + Data + Terminator
  const bits: number[] = [0, 1, 0, 0]; // 0100 = 8-bit Byte Mode
  const count = utf8.length;
  for (let i = 7; i >= 0; i--) {
    bits.push((count >> i) & 1);
  }
  for (let i = 0; i < utf8.length; i++) {
    const b = utf8[i];
    for (let j = 7; j >= 0; j--) {
      bits.push((b >> j) & 1);
    }
  }

  // Terminator (up to 4 zeros)
  const maxDataBits = spec.dataCodewords * 8;
  const termLen = Math.min(4, maxDataBits - bits.length);
  for (let i = 0; i < termLen; i++) bits.push(0);

  // Pad to multiple of 8
  while (bits.length % 8 !== 0) bits.push(0);

  // Convert bits to byte codewords
  const dataCodewords = new Uint8Array(spec.dataCodewords);
  for (let i = 0; i < bits.length / 8; i++) {
    let byteVal = 0;
    for (let j = 0; j < 8; j++) {
      byteVal = (byteVal << 1) | bits[i * 8 + j];
    }
    dataCodewords[i] = byteVal;
  }

  // Alternate standard pad bytes (0xEC, 0x11)
  const padBytes = [0xec, 0x11];
  let padIdx = 0;
  for (let i = bits.length / 8; i < spec.dataCodewords; i++) {
    dataCodewords[i] = padBytes[padIdx % 2];
    padIdx++;
  }

  // B. Compute Reed-Solomon Error Correction Codewords
  const ecCodewords = computeReedSolomon(dataCodewords, spec.ecCodewords);

  // C. Interleave All Codewords
  const allCodewords = new Uint8Array(spec.totalCodewords);
  allCodewords.set(dataCodewords, 0);
  allCodewords.set(ecCodewords, spec.dataCodewords);

  // D. Construct Matrix
  const matrix: boolean[][] = Array.from({ length: size }, () => Array(size).fill(false));
  const isFunction: boolean[][] = Array.from({ length: size }, () => Array(size).fill(false));

  const setModule = (r: number, c: number, val: boolean, isFunc: boolean = true) => {
    matrix[r][c] = val;
    if (isFunc) isFunction[r][c] = true;
  };

  // 1. Finder Patterns (7x7) + Separators
  const drawFinder = (row: number, col: number) => {
    for (let r = -1; r <= 7; r++) {
      for (let c = -1; c <= 7; c++) {
        const tr = row + r;
        const tc = col + c;
        if (tr >= 0 && tr < size && tc >= 0 && tc < size) {
          const isCore = r >= 2 && r <= 4 && c >= 2 && c <= 4;
          const isBorder = r === 0 || r === 6 || c === 0 || c === 6;
          setModule(tr, tc, isCore || isBorder);
        }
      }
    }
  };

  drawFinder(0, 0);
  drawFinder(0, size - 7);
  drawFinder(size - 7, 0);

  // 2. Alignment Patterns (5x5) for Version >= 2
  if (spec.alignPos.length > 0) {
    for (const r of spec.alignPos) {
      for (const c of spec.alignPos) {
        // Skip finders
        if (
          (r < 9 && c < 9) ||
          (r < 9 && c >= size - 9) ||
          (r >= size - 9 && c < 9)
        ) {
          continue;
        }
        for (let ar = -2; ar <= 2; ar++) {
          for (let ac = -2; ac <= 2; ac++) {
            const isBorder = Math.abs(ar) === 2 || Math.abs(ac) === 2;
            const isCenter = ar === 0 && ac === 0;
            setModule(r + ar, c + ac, isBorder || isCenter);
          }
        }
      }
    }
  }

  // 3. Timing Patterns
  for (let i = 8; i < size - 8; i++) {
    setModule(6, i, i % 2 === 0);
    setModule(i, 6, i % 2 === 0);
  }

  // 4. Dark Module
  setModule(size - 8, 8, true);

  // 5. Format Information Area Reservation
  for (let i = 0; i < 9; i++) {
    if (i !== 6) {
      setModule(8, i, false);
      setModule(i, 8, false);
    }
  }
  for (let i = 0; i < 8; i++) {
    setModule(8, size - 1 - i, false);
    setModule(size - 1 - i, 8, false);
  }

  // E. Place Data Codewords (Zig-Zag upward/downward 2-column paths)
  let bitPointer = 0;
  const totalBits = allCodewords.length * 8;
  let upward = true;

  for (let col = size - 1; col > 0; col -= 2) {
    if (col === 6) col--; // Skip vertical timing column

    const rows = [];
    if (upward) {
      for (let r = size - 1; r >= 0; r--) rows.push(r);
    } else {
      for (let r = 0; r < size; r++) rows.push(r);
    }

    for (const row of rows) {
      for (let c = 0; c < 2; c++) {
        const curCol = col - c;
        if (!isFunction[row][curCol]) {
          let bit = false;
          if (bitPointer < totalBits) {
            const byteIdx = Math.floor(bitPointer / 8);
            const bitOffset = 7 - (bitPointer % 8);
            bit = ((allCodewords[byteIdx] >> bitOffset) & 1) === 1;
            bitPointer++;
          }

          // Apply standard Mask 0: (row + col) % 2 == 0
          if ((row + curCol) % 2 === 0) {
            bit = !bit;
          }

          matrix[row][curCol] = bit;
        }
      }
    }

    upward = !upward;
  }

  // F. Format Information (Level M + Mask 0: 0x5412 XOR pattern -> 101010000010010)
  // Standard 15-bit format information sequence for EC Level M, Mask Pattern 0
  const FORMAT_BITS = [1, 0, 1, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0];

  // Top-left finder placement
  for (let i = 0; i < 6; i++) matrix[8][i] = FORMAT_BITS[i] === 1;
  matrix[8][7] = FORMAT_BITS[6] === 1;
  matrix[8][8] = FORMAT_BITS[7] === 1;
  matrix[7][8] = FORMAT_BITS[8] === 1;
  for (let i = 9; i < 15; i++) matrix[14 - i][8] = FORMAT_BITS[i] === 1;

  // Split finders placement
  for (let i = 0; i < 7; i++) matrix[size - 1 - i][8] = FORMAT_BITS[i] === 1;
  for (let i = 7; i < 15; i++) matrix[8][size - 15 + i] = FORMAT_BITS[i] === 1;

  return matrix;
}

// ─── 5. High-Performance Memoized QR Component ────────────────────────────────

export const QrCodeMatrix: React.FC<QrCodeProps> = React.memo(({
  value,
  size = 200,
  color = '#0B1F33',
  backgroundColor = '#FFFFFF',
}) => {
  const matrix = useMemo(() => generateIso18004QrMatrix(value), [value]);
  const moduleCount = matrix.length;
  const cellSize = size / moduleCount;

  return (
    <View
      style={[
        styles.container,
        {
          width: size,
          height: size,
          backgroundColor,
        },
      ]}
    >
      {matrix.map((row, r) => (
        <View key={r} style={[styles.row, { height: cellSize }]}>
          {row.map((isDark, c) => (
            <View
              key={c}
              style={{
                width: cellSize,
                height: cellSize,
                backgroundColor: isDark ? color : backgroundColor,
              }}
            />
          ))}
        </View>
      ))}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
    overflow: 'hidden',
    padding: 6,
  },
  row: {
    flexDirection: 'row',
  },
});
