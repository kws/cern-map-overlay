import { LatLngExpression, LatLng, LatLngBounds, Path } from 'leaflet';

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

export interface CernMapLayer extends L.Path {
  name: string;
  accelerator: Accelerator;
  cernLocationRefKey: string;
  getBounds(): LatLngBounds;
}
