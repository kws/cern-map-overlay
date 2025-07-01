import { html, css, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import L, { type LatLngExpression, LatLng } from 'leaflet';
import geocoder from 'leaflet-control-geocoder';
import geocoderStyles from 'leaflet-control-geocoder/dist/Control.Geocoder.css?raw';
import leafletStyles from 'leaflet/dist/leaflet.css?raw';
import { Accelerator } from '../types';

interface GeocoderEvent {
  geocode: {
    name: string;
    center: { lat: number; lng: number };
  };
}

@customElement('cern-map-overlay')
export class CERNMapOverlay extends LitElement {
  static styles = css`
    :host {
      display: block;
      width: 100%;
      height: 400px;
    }
    #map {
      height: 100%;
      width: 100%;
    }
  `;

  private map: L.Map | null = null;
  private accelerators: Map<string, Accelerator> = new Map();
  private layers: Map<string, L.Path> = new Map();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private _geocoder: any = null; // Geocoder control instance with methods: addTo, remove, on
  private _isUpdatingFromMap = false; // Prevent circular updates

  @property({ type: Number })
  lat = 46.23497502511518;

  @property({ type: Number })
  lng = 6.0536309870679235;

  @property({ type: Number })
  zoom = 12;

  @property({ type: Boolean, attribute: 'geocoder-enabled' })
  geocoderEnabled = false;

  @property({ type: Boolean, attribute: 'follow-location' })
  followLocation = true;

  firstUpdated() {
    const mapElement = this.shadowRoot?.getElementById('map');
    if (mapElement) {
      this.map = L.map(mapElement).setView([this.lat, this.lng], this.zoom);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
      }).addTo(this.map);
      const geocoderSheet = new CSSStyleSheet();
      geocoderSheet.replaceSync(geocoderStyles);

      const leafletSheet = new CSSStyleSheet();
      leafletSheet.replaceSync(leafletStyles);
      if (this.shadowRoot) {
        this.shadowRoot.adoptedStyleSheets = [
          ...this.shadowRoot.adoptedStyleSheets,
          leafletSheet,
          geocoderSheet,
        ];
      }

      this.map.on('moveend', this.onMoveEnd.bind(this));
    }
    this.updateMap();
  }

  updated(changedProperties: Map<string | number | symbol, unknown>) {
    if (!this.map) return;

    // Only update map view if changes came from external property updates, not from map interactions
    if (!this._isUpdatingFromMap) {
      if (changedProperties.has('lat') || changedProperties.has('lng')) {
        this.map.setView([this.lat, this.lng], this.zoom);
      }

      if (changedProperties.has('zoom')) {
        this.map.setZoom(this.zoom);
      }
    }

    if (changedProperties.has('geocoderEnabled')) {
      if (this.geocoderEnabled) {
        this._geocoder = new geocoder();
        this._geocoder.addTo(this.map);
        this._geocoder.on('markgeocode', this.onGeocode);
      } else if (this._geocoder) {
        this._geocoder.remove();
        this._geocoder = null;
      }
    }
    this.updateMap();
  }

  onMoveEnd() {
    this._isUpdatingFromMap = true;
    this.lat = this.map?.getCenter().lat ?? this.lat;
    this.lng = this.map?.getCenter().lng ?? this.lng;
    this.zoom = this.map?.getZoom() ?? this.zoom;
    this._isUpdatingFromMap = false;
    // Don't call updateMap() here - it will be called by updated()
  }

  onGeocode = (e: GeocoderEvent) => {
    this.dispatchEvent(
      new CustomEvent('markgeocode', {
        detail: e,
        bubbles: true,
        composed: true,
      }),
    );
  };

  addAccelerator(name: string, accelerator: Accelerator): void;
  addAccelerator(accelerator: Accelerator): void;
  addAccelerator(nameOrAccelerator: string | Accelerator, accelerator?: Accelerator): void {
    if (typeof nameOrAccelerator === 'string' && accelerator) {
      this.accelerators.set(nameOrAccelerator, accelerator);
    } else if (typeof nameOrAccelerator === 'object') {
      this.accelerators.set(nameOrAccelerator.getName(), nameOrAccelerator);
    }
    this.updateMap();
  }

  removeAccelerator(acceleratorName: string) {
    const accelerator = this.accelerators.get(acceleratorName);
    if (accelerator) {
      const layer = this.layers.get(acceleratorName);
      if (layer && this.map) {
        this.map.removeLayer(layer);
      }
      this.accelerators.delete(acceleratorName);
      this.layers.delete(acceleratorName);
      this.updateMap();
    }
  }

  updateMap() {
    if (!this.map) return;
    const map = this.map;

    this.accelerators.forEach((accelerator, name) => {
      const oldLayer = this.layers.get(name);
      if (oldLayer) {
        map.removeLayer(oldLayer);
      }
      const refPoint: LatLngExpression = this.followLocation
        ? new LatLng(this.lat, this.lng)
        : accelerator.getReferencePoint();
      const translatedPath = accelerator.getTranslatedPath(refPoint);
      if (translatedPath) {
        const layer = translatedPath.addTo(map);
        this.layers.set(name, layer);
      }
    });
  }

  render() {
    return html`<div id="map"></div>`;
  }
}
