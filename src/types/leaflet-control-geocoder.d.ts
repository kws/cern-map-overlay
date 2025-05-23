declare module 'leaflet-control-geocoder' {
  import { Control } from 'leaflet';

  interface GeocoderOptions {
    defaultMarkGeocode?: boolean;
    queryMinLength?: number;
    queryDelay?: number;
    placeholder?: string;
    errorMessage?: string;
    classPrefix?: string;
    suggestMinLength?: number;
    suggestDelay?: number;
    initialQueryDelay?: number;
  }

  interface GeocodeResult {
    name: string;
    center: { lat: number; lng: number };
    bbox: { _southWest: { lat: number; lng: number }; _northEast: { lat: number; lng: number } };
  }

  interface GeocoderEvent {
    geocode: GeocodeResult;
  }

  interface Geocoder extends Control {
    on(event: 'markgeocode', handler: (e: GeocoderEvent) => void): this;
  }

  const geocoder: {
    (options?: GeocoderOptions): Geocoder;
    new(options?: GeocoderOptions): Geocoder;
  };

  export default geocoder;
} 