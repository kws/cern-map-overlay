import { describe, it, expect } from 'vitest';
import { LatLng, Circle, Polyline } from 'leaflet';
import {
  getUTMZone,
  slugify,
  CircularCollider,
  LinearAccelerator,
  WGS84,
} from '../src/accelerators/util';
import proj4 from 'proj4';

describe('Utility Functions', () => {
  it('should return the correct UTM zone', () => {
    expect(getUTMZone(46.233, 6.05)).toBe('EPSG:32632');
    expect(getUTMZone(-0.1807, -78.4678)).toBe('EPSG:32717');
    expect(getUTMZone(-46.4, 168.35)).toBe('EPSG:32759');
  });

  it('should correctly slugify a string', () => {
    expect(slugify('Test String')).toBe('test-string');
    expect(slugify('Another Test String')).toBe('another-test-string');
  });
});

describe('CircularCollider', () => {
  const colliderRadius = 1000;
  const collider = new CircularCollider('Test Collider', [46.233, 6.05], colliderRadius, [], 'red');

  it('should return the correct name', () => {
    expect(collider.getName()).toBe('Test Collider');
  });

  it('should return the correct reference point', () => {
    expect(collider.getReferencePoint()).toEqual(new LatLng(46.233, 6.05));
  });

  it('should return a Circle object for the translated path', () => {
    const path = collider.getTranslatedPath([40.7128, -74.006]);
    expect(path).toBeInstanceOf(Circle);
  });

  it('should maintain the correct radius after translation', () => {
    const referencePoint = new LatLng(40.7128, -74.006); // New York
    const path = collider.getTranslatedPath(referencePoint);
    const circlePath = path as Circle;
    const center = circlePath.getLatLng();
    const radius = circlePath.getRadius();

    // Convert center to UTM to verify radius in meters
    const refUTM = getUTMZone(referencePoint.lat, referencePoint.lng);
    const [centerX, centerY] = proj4(WGS84, refUTM, [center.lng, center.lat]);

    // Create a point at the edge of the circle in UTM
    const edgeX = centerX + radius;
    const edgeY = centerY;

    // Convert the edge point back to LatLng

    // Calculate the distance between center and edge in meters using Euclidean distance in UTM
    const measuredRadius = Math.sqrt(Math.pow(edgeX - centerX, 2) + Math.pow(edgeY - centerY, 2));

    expect(measuredRadius).toBeCloseTo(colliderRadius, 0);
  });
});

describe('LinearAccelerator', () => {
  const accelerator = new LinearAccelerator(
    'Test Accelerator',
    [46.233, 6.05],
    1000,
    0,
    [],
    'blue',
  );

  it('should return the correct name', () => {
    expect(accelerator.getName()).toBe('Test Accelerator');
  });

  it('should return the correct reference point', () => {
    expect(accelerator.getReferencePoint()).toEqual(new LatLng(46.233, 6.05));
  });

  it('should return a Polyline object for the translated path', () => {
    const path = accelerator.getTranslatedPath([40.7128, -74.006]);
    expect(path).toBeInstanceOf(Polyline);
  });
});
