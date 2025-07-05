import { LatLng, Path, latLng, Polygon, LatLngExpression } from 'leaflet';
import proj4 from 'proj4';
import { PointOfInterest, Accelerator } from '../types/cernMap';
import { WGS84, getUTMZone, slugify, translatePoints } from './util';

/**
 * These are just guestimates as I don't have the exact coordinates or the exact length.
 */

export class RoundedRectangleAccelerator implements Accelerator {
  private name: string;
  private center: LatLng;
  private width: number;
  private height: number;
  private rotation: number;
  private pointsOfInterest: PointOfInterest[];
  public color?: string;

  constructor(
    name: string,
    center: LatLngExpression,
    width: number,
    height: number,
    rotation: number,
    pointsOfInterest: PointOfInterest[],
    color?: string,
  ) {
    this.name = name;
    this.center = latLng(center);
    this.width = width;
    this.height = height;
    this.rotation = rotation;
    this.pointsOfInterest = pointsOfInterest;
    this.color = color;
  }

  getName(): string {
    return this.name;
  }

  getReferencePoint(): LatLng {
    return this.center;
  }

  createRoundedRectangle(
    halfWidth: number,
    halfHeight: number,
    radius: number,
    stepsPerCorner = 6,
  ): [number, number][] {
    const points: [number, number][] = [];

    const corners = [
      { cx: halfWidth - radius, cy: -halfHeight + radius, start: -Math.PI / 2, end: 0 }, // top-right
      { cx: halfWidth - radius, cy: halfHeight - radius, start: 0, end: Math.PI / 2 }, // bottom-right
      { cx: -halfWidth + radius, cy: halfHeight - radius, start: Math.PI / 2, end: Math.PI }, // bottom-left
      { cx: -halfWidth + radius, cy: -halfHeight + radius, start: Math.PI, end: 1.5 * Math.PI }, // top-left
    ];

    for (const { cx, cy, start, end } of corners) {
      for (let i = 0; i <= stepsPerCorner; i++) {
        const t = i / stepsPerCorner;
        const angle = start + (end - start) * t;
        const x = cx + radius * Math.cos(angle);
        const y = cy + radius * Math.sin(angle);
        points.push([x, y]);
      }
    }

    return points;
  }

  getTranslatedPath(referencePoint: LatLngExpression): Path {
    const [refLat, refLng] = Array.isArray(referencePoint)
      ? referencePoint
      : [referencePoint.lat, referencePoint.lng];

    // Get UTM zone for the reference point
    const refUTM = getUTMZone(refLat, refLng);

    // Convert reference point to UTM coordinates (this will be the new center)
    const [refX, refY] = proj4(WGS84, refUTM, [refLng, refLat]);

    // Create rectangle corners in meters relative to center
    const halfWidth = this.width / 2;
    const halfHeight = this.height / 2;

    // Create rectangle points (counter-clockwise from top-left)
    const corners = this.createRoundedRectangle(halfWidth, halfHeight, 3);

    // Apply rotation
    const cos = Math.cos((this.rotation * Math.PI) / 180);
    const sin = Math.sin((this.rotation * Math.PI) / 180);

    const polygonPoints: LatLngExpression[] = corners.map(([x, y]) => {
      // Apply rotation to the local offsets
      const rotatedX = x * cos - y * sin;
      const rotatedY = x * sin + y * cos;

      // Add the rotated offsets to the new center (refX, refY)
      const finalX_utm = refX + rotatedX;
      const finalY_utm = refY + rotatedY;

      // Convert back to lat/lng
      const [lng, lat] = proj4(refUTM, WGS84, [finalX_utm, finalY_utm]);
      return [lat, lng];
    });

    return new Polygon(polygonPoints, {
      color: this.color,
      fill: false,
      className: `accelerator accelerator-rounded-rectangle ${slugify(this.name)}`,
    });
  }

  getTranslatedPointsOfInterest(referencePoint: LatLngExpression): PointOfInterest[] {
    return translatePoints(referencePoint, this.center, this.pointsOfInterest);
  }
}

// LEIR accelerator instance
const LEIR = new RoundedRectangleAccelerator(
  'LEIR',
  [46.231557004669, 6.047967826365111], // Center coordinates (approximate CERN location)
  20, // Width in meters
  20, // Height in meters
  54, // Rotation in degrees
  [], // Points of interest (empty for now)
  '#ff6b6b', // Color
);

export default LEIR;
