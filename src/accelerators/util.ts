import { Circle, LatLngExpression, LatLng, Path, latLng, CircleOptions, Polyline } from 'leaflet';
import proj4 from 'proj4';
import { Accelerator, PointOfInterest } from '../types/cernMap';

export const WGS84 = 'EPSG:4326'; // Standard lat/lng coordinates

export const getUTMZone = (latitude: number, longitude: number): string => {
  const zoneNum = Math.floor((longitude + 180) / 6) + 1;
  const hemisphere = latitude >= 0 ? '6' : '7'; // 6 for Northern, 7 for Southern
  return `EPSG:32${hemisphere}${zoneNum.toString().padStart(2, '0')}`;
};

export const slugify = (name: string): string => {
  return name
    .toLowerCase()
    .replace(/ /g, '-')
    .replace(/[^a-z0-9-]/g, '');
};

export const translate = (referencePoint: LatLngExpression, originalPoint: LatLngExpression) => {
  const [refLat, refLng] = Array.isArray(referencePoint)
    ? referencePoint
    : [referencePoint.lat, referencePoint.lng];

  const [centerLat, centerLng] = Array.isArray(originalPoint)
    ? originalPoint
    : [originalPoint.lat, originalPoint.lng];

  // Determine the target UTM zone based on the referencePoint (where the accelerator will be displayed)
  const targetUTM = getUTMZone(refLat, refLng);

  // Convert originalPoint (CERN) to the target UTM coordinates
  const [originalX_in_targetUTM, originalY_in_targetUTM] = proj4(WGS84, targetUTM, [
    centerLng,
    centerLat,
  ]);

  // Convert referencePoint (e.g., Quito) to the target UTM coordinates
  const [refX_in_targetUTM, refY_in_targetUTM] = proj4(WGS84, targetUTM, [refLng, refLat]);

  // Calculate translation vector in meters within the target UTM zone
  const xDiff = refX_in_targetUTM - originalX_in_targetUTM;
  const yDiff = refY_in_targetUTM - originalY_in_targetUTM;

  return { xDiff, yDiff, targetUTM };
};

export const translatePoints = (
  referencePoint: LatLngExpression,
  originalPoint: LatLngExpression,
  pointsOfInterest: PointOfInterest[],
): PointOfInterest[] => {
  const { xDiff, yDiff, targetUTM } = translate(referencePoint, originalPoint);

  return pointsOfInterest.map((poi) => {
    const [poiLat, poiLng] = Array.isArray(poi.position)
      ? poi.position
      : [poi.position.lat, poi.position.lng];
    // Convert POI to the target UTM
    const [poiX, poiY] = proj4(WGS84, targetUTM, [poiLng, poiLat]);
    // Apply translation in meters
    const newX = poiX + xDiff;
    const newY = poiY + yDiff;
    // Convert back to lat/lng from the target UTM
    const [newLng, newLat] = proj4(targetUTM, WGS84, [newX, newY]);
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

    const [refLat, refLng] = Array.isArray(referencePoint)
      ? referencePoint
      : [referencePoint.lat, referencePoint.lng];

    // Determine the UTM zone of the reference point
    const refUTM = getUTMZone(refLat, refLng);

    // Convert reference point to its own UTM coordinates
    const [refX, refY] = proj4(WGS84, refUTM, [refLng, refLat]);

    // Calculate start and end points in UTM coordinates relative to the reference point
    const startX = refX - halfLength * Math.sin(directionRad);
    const startY = refY - halfLength * Math.cos(directionRad);
    const endX = refX + halfLength * Math.sin(directionRad);
    const endY = refY + halfLength * Math.cos(directionRad);

    // Convert back to lat/lng from the reference point's UTM zone
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
