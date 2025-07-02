import { Circle, LatLngExpression, LatLng, Path, latLng, CircleOptions } from 'leaflet';
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
    
    // Add part attribute to expose the element outside shadow DOM
    if (this.circleOptions.className) {
      this.circleOptions.className += ' accelerator-part';
    }
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
    // Convert reference point and center to arrays for easier handling
    const [refLat, refLng] = Array.isArray(referencePoint)
      ? referencePoint
      : [referencePoint.lat, referencePoint.lng];
    const [centerLat, centerLng] = Array.isArray(this.center)
      ? this.center
      : [this.center.lat, this.center.lng];

    // Get UTM zones for both points
    const centerUTM = getUTMZone(centerLng);
    const refUTM = getUTMZone(refLng);

    // Convert center and reference point to their respective UTM coordinates
    const [centerX, centerY] = proj4(WGS84, centerUTM, [centerLng, centerLat]);
    const [refX, refY] = proj4(WGS84, refUTM, [refLng, refLat]);

    // Calculate translation vector in meters
    const xDiff = refX - centerX;
    const yDiff = refY - centerY;

    return this.pointsOfInterest.map((poi) => {
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
  }
}
