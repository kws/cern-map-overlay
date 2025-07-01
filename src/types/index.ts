import { Circle, LatLngExpression, LatLng, Path, latLng } from 'leaflet';
import proj4 from 'proj4';

// Define the source projection
const WGS84 = 'EPSG:4326'; // Standard lat/lng coordinates

// Helper to get UTM zone from longitude
const getUTMZone = (longitude: number): string => {
  // UTM zones are 6 degrees wide, numbered from 1 to 60
  const zone = Math.floor((longitude + 180) / 6) + 1;
  // Format as EPSG code (326xx for northern hemisphere)
  return `EPSG:326${zone.toString().padStart(2, '0')}`;
};

export interface PointOfInterest {
  name: string;
  position: LatLngExpression;
}

export interface Accelerator {
  getName(): string;
  getReferencePoint(): LatLng;
  getTranslatedPath(referencePoint: LatLngExpression): Path;
  getTranslatedPointsOfInterest(referencePoint: LatLngExpression): PointOfInterest[];
}

export interface Location {
  lat: number;
  lng: number;
  name?: string;
}

export interface GeocoderEvent {
  geocode: {
    center: { lat: number; lng: number };
    name: string;
  };
}

export class CircularCollider implements Accelerator {
  private name: string;
  private center: LatLng;
  private radius: number;
  private pointsOfInterest: PointOfInterest[];

  constructor(
    name: string,
    center: LatLngExpression,
    radius: number,
    pointsOfInterest: PointOfInterest[],
  ) {
    this.name = name;
    this.center = latLng(center);
    this.radius = radius;
    this.pointsOfInterest = pointsOfInterest;
  }

  getName(): string {
    return this.name;
  }

  getReferencePoint(): LatLng {
    return this.center;
  }

  getTranslatedPath(referencePoint: LatLngExpression): Path {
    return new Circle(referencePoint, { radius: this.radius, fill: false });
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
