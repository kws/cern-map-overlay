import { Circle, LatLngExpression, LatLng, Path, latLng, CircleOptions, Polyline } from 'leaflet';
import proj4 from 'proj4';
import { Accelerator, PointOfInterest } from '../types';

export const WGS84 = 'EPSG:4326'; // Standard lat/lng coordinates

export const getUTMZone = (longitude: number): string => {
  const zone = Math.floor((longitude + 180) / 6) + 1;
  return `EPSG:326${zone.toString().padStart(2, '0')}`;
};

export const slugify = (name: string): string => {
  return name
    .toLowerCase()
    .replace(/ /g, '-')
    .replace(/[^a-z0-9-]/g, '');
};

export const translatePoints = (
  referencePoint: LatLngExpression,
  originalPoint: LatLngExpression,
  pointsOfInterest: PointOfInterest[],
): PointOfInterest[] => {
  const [refLat, refLng] = Array.isArray(referencePoint)
    ? referencePoint
    : [referencePoint.lat, referencePoint.lng];

  const [centerLat, centerLng] = Array.isArray(originalPoint)
    ? originalPoint
    : [originalPoint.lat, originalPoint.lng];

  // Get UTM zones for both points
  const centerUTM = getUTMZone(centerLng);
  const refUTM = getUTMZone(refLng);

  // Convert center and reference point to their respective UTM coordinates
  const [centerX, centerY] = proj4(WGS84, centerUTM, [centerLng, centerLat]);
  const [refX, refY] = proj4(WGS84, refUTM, [refLng, refLat]);

  // Calculate translation vector in meters
  const xDiff = refX - centerX;
  const yDiff = refY - centerY;

  return pointsOfInterest.map((poi) => {
    const [poiLat, poiLng] = Array.isArray(poi.position)
      ? poi.position
      : [poi.position.lat, poi.position.lng];
    // Get UTM zone for the POI
    const poiUTM = getUTMZone(poiLng);
    // Convert POI to UTM
    const [poiX, poiY] = proj4(WGS84, poiUTM, [poiLng, poiLat]);
    // Apply translation in meters
    const newX = poiX + xDiff;
    const newY = poiY + yDiff;
    // Convert back to lat/lng using the reference point's UTM zone
    const [newLng, newLat] = proj4(refUTM, WGS84, [newX, newY]);
    return {
      ...poi,
      position: [newLat, newLng],
    };
  });
};

export class CircularCollider implements Accelerator {
  private name: string;
  private center: LatLng;
  private radius: number;
  private pointsOfInterest: PointOfInterest[];
  public color?: string;
  public circleOptions: CircleOptions;

  constructor(
    name: string,
    center: LatLngExpression,
    radius: number,
    pointsOfInterest: PointOfInterest[],
    color?: string,
    circleOptions?: Partial<CircleOptions>,
  ) {
    this.name = name;
    this.center = latLng(center);
    this.radius = radius;
    this.pointsOfInterest = pointsOfInterest;
    this.color = color;

    // Initialize circleOptions with defaults, allowing overrides
    this.circleOptions = {
      radius: this.radius,
      fill: false,
      color: this.color,
      className: `accelerator accelerator-circle ${slugify(this.name)}`,
      ...circleOptions,
    };
  }

  getName(): string {
    return this.name;
  }

  getReferencePoint(): LatLng {
    return this.center;
  }

  getTranslatedPath(referencePoint: LatLngExpression): Path {
    return new Circle(referencePoint, this.circleOptions);
  }

  getTranslatedPointsOfInterest(referencePoint: LatLngExpression): PointOfInterest[] {
    return translatePoints(referencePoint, this.center, this.pointsOfInterest);
  }
}

export class LinearAccelerator implements Accelerator {
  private name: string;
  private midpoint: LatLng;
  private length: number; // Length in meters
  private direction: number; // Direction in degrees (0 = North, 90 = East, etc.)
  private pointsOfInterest: PointOfInterest[];
  public color?: string;

  constructor(
    name: string,
    midpoint: LatLngExpression,
    length: number, // Length in meters
    direction: number, // Direction in degrees (0 = North, 90 = East, etc.)
    pointsOfInterest: PointOfInterest[],
    color?: string,
  ) {
    this.name = name;
    this.midpoint = latLng(midpoint);
    this.length = length;
    this.direction = direction;
    this.pointsOfInterest = pointsOfInterest;
    this.color = color;
  }

  getName(): string {
    return this.name;
  }

  getReferencePoint(): LatLng {
    return this.midpoint;
  }

  getTranslatedPath(referencePoint: LatLngExpression): Path {
    // Convert direction to radians
    const directionRad = (this.direction * Math.PI) / 180;

    // Calculate half length for extending from midpoint
    const halfLength = this.length / 2;

    // Get UTM zone for the reference point
    const [refLat, refLng] = Array.isArray(referencePoint)
      ? referencePoint
      : [referencePoint.lat, referencePoint.lng];
    const refUTM = getUTMZone(refLng);

    // Convert reference point to UTM coordinates
    const [refX, refY] = proj4(WGS84, refUTM, [refLng, refLat]);

    // Calculate start and end points in UTM coordinates
    // For 0 degrees (North), we move along Y-axis (North-South)
    // For 90 degrees (East), we move along X-axis (East-West)
    const startX = refX - halfLength * Math.sin(directionRad);
    const startY = refY - halfLength * Math.cos(directionRad);
    const endX = refX + halfLength * Math.sin(directionRad);
    const endY = refY + halfLength * Math.cos(directionRad);

    // Convert back to lat/lng
    const [startLng, startLat] = proj4(refUTM, WGS84, [startX, startY]);
    const [endLng, endLat] = proj4(refUTM, WGS84, [endX, endY]);

    return new Polyline(
      [
        [startLat, startLng],
        [endLat, endLng],
      ],
      {
        color: this.color,
        className: `accelerator accelerator-linear ${slugify(this.name)}`,
      },
    );
  }

  getTranslatedPointsOfInterest(referencePoint: LatLngExpression): PointOfInterest[] {
    return translatePoints(referencePoint, this.midpoint, this.pointsOfInterest);
  }
}
