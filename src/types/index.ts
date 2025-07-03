import { LatLngExpression, LatLng, Path } from 'leaflet';

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

// Extended Path interface that includes the getBounds method
export interface PathWithBounds extends Path {
  getBounds(): {
    getSouth: () => number;
    getNorth: () => number;
    getWest: () => number;
    getEast: () => number;
  };
}
