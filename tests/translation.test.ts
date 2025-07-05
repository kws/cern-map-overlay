import { describe, it, expect } from 'vitest';
import { LatLng } from 'leaflet';
import { translate } from '../src/accelerators/util';

describe('translate', () => {
  const originalPoint = new LatLng(46.233, 6.05); // CERN

  it('should correctly translate to a new location in a different UTM zone', () => {
    const referencePoint = new LatLng(40.7128, -74.006); // New York

    const { xDiff, yDiff } = translate(referencePoint, originalPoint);

    // Check that the translation vector is not zero
    expect(xDiff).not.toBe(0);
    expect(yDiff).not.toBe(0);
  });

  it('should correctly translate to a new location in the same UTM zone', () => {
    const referencePoint = new LatLng(46.2044, 6.1432); // Geneva

    const { xDiff, yDiff } = translate(referencePoint, originalPoint);

    // Check that the translation vector is not zero
    expect(xDiff).not.toBe(0);
    expect(yDiff).not.toBe(0);
  });
});
