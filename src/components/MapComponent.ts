import { html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import L, { type LatLngExpression, LatLng } from 'leaflet';
import geocoder from 'leaflet-control-geocoder';
import geocoderStyles from 'leaflet-control-geocoder/dist/Control.Geocoder.css?raw';
import leafletStyles from 'leaflet/dist/leaflet.css?raw';
import { Accelerator, PathWithBounds } from '../types';
import { cernMap } from '../accelerators';

interface GeocoderEvent {
  geocode: {
    name: string;
    center: { lat: number; lng: number };
  };
}

@customElement('cern-map-overlay')
export class CERNMapOverlay extends LitElement {
  private _mapId = `map-${Math.random().toString(36).substring(2, 9)}`;

  // Disable shadow DOM
  createRenderRoot() {
    return this;
  }

  private addStylesToDocument(styles: string, id: string) {
    // Check if styles are already added
    if (document.getElementById(id)) {
      return;
    }

    const styleElement = document.createElement('style');
    styleElement.id = id;
    styleElement.textContent = styles;
    document.head.appendChild(styleElement);
  }

  private map: L.Map | null = null;
  private accelerators: Map<string, Accelerator> = new Map();
  private layers: Map<string, L.Path> = new Map();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private _geocoder: any = null; // Geocoder control instance with methods: addTo, remove, on
  private _isUpdatingFromMap = false; // Prevent circular updates

  private DEFAULT_LAT = 46.23497502511518;
  private DEFAULT_LNG = 6.0536309870679235;

  @property({ type: Number })
  lat: number | null = null;

  @property({ type: Number })
  lng: number | null = null;

  @property({ type: Number })
  zoom: number | null = null;

  @property({ type: Boolean, attribute: 'geocoder-enabled' })
  geocoderEnabled = false;

  @property({ type: Boolean, attribute: 'follow-location' })
  followLocation = false;

  @property({ type: String, attribute: 'show-accelerators' })
  showAccelerators = '';

  firstUpdated() {
    this.addStylesToDocument(
      `
      cern-map-overlay {
        display: block;
        height: var(--cern-map-height, 400px);
        width: 100%;
      }

      cern-map-overlay>div {
        display: block;
        height: 100%;
        width: 100%;
      }
    `,
      'cern-map-overlay-styles',
    );

    const mapElement = this.querySelector(`#${this._mapId}`) as HTMLElement;
    if (!mapElement) {
      throw new Error('Map element not found');
    }

    this.map = L.map(mapElement);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(this.map);

    // Add Leaflet and Geocoder styles to the document head
    this.addStylesToDocument(leafletStyles, 'leaflet-styles');
    this.addStylesToDocument(geocoderStyles, 'geocoder-styles');

    this.map.on('moveend', this.onMoveEnd.bind(this));

    // Load accelerators specified in the show-accelerators property
    this.loadAcceleratorsFromProperty();

    this.updateMap();

    // If we started without a lat/long
    if (this.lat === null || this.lng === null || this.zoom === null) {
      this.fitBounds();
    }
  }

  fitBounds() {
    if (!this.map) return;
    if (!this.layers.size) {
      this.map.setView([this.DEFAULT_LAT, this.DEFAULT_LNG], 12);
      return;
    }
    this.map.setView([0, 0], 12);
    let minLat = Infinity;
    let maxLat = -Infinity;
    let minLng = Infinity;
    let maxLng = -Infinity;
    this.layers.forEach((layer) => {
      console.log('layer', layer);
      const bounds = (layer as PathWithBounds).getBounds();
      if (bounds) {
        minLat = Math.min(minLat, bounds.getSouth());
        maxLat = Math.max(maxLat, bounds.getNorth());
        minLng = Math.min(minLng, bounds.getWest());
        maxLng = Math.max(maxLng, bounds.getEast());
      }
    });
    this.map.fitBounds([
      [minLat, minLng],
      [maxLat, maxLng],
    ]);
  }

  updated(changedProperties: Map<string | number | symbol, unknown>) {
    if (!this.map) return;

    this.syncMapView(changedProperties);
    this.syncGeocoder(changedProperties);
    this.syncAccelerators(changedProperties);
    this.syncFollowLocation(changedProperties);

    // Always update layers at the end
    this.updateMap();
  }

  private syncMapView(changedProperties: Map<string | number | symbol, unknown>) {
    if (this._isUpdatingFromMap) return;

    if (changedProperties.has('lat') || changedProperties.has('lng')) {
      if (this.lat !== null && this.lng !== null) {
        this.map!.setView([this.lat, this.lng], this.zoom ?? 12);
      }
    }

    if (changedProperties.has('zoom')) {
      if (this.zoom !== null) {
        this.map!.setZoom(this.zoom);
      }
    }
  }

  private syncGeocoder(changedProperties: Map<string | number | symbol, unknown>) {
    if (!changedProperties.has('geocoderEnabled')) return;

    if (this.geocoderEnabled) {
      this._geocoder = new geocoder();
      this._geocoder.addTo(this.map!);
      this._geocoder.on('markgeocode', this.onGeocode);
    } else if (this._geocoder) {
      this._geocoder.remove();
      this._geocoder = null;
    }
  }

  private syncAccelerators(changedProperties: Map<string | number | symbol, unknown>) {
    if (changedProperties.has('showAccelerators')) {
      this.loadAcceleratorsFromProperty();
    }
  }

  private syncFollowLocation(changedProperties: Map<string | number | symbol, unknown>) {
    if (changedProperties.has('followLocation')) {
      // Might affect accelerator path placement
      this.updateMap();
    }
  }

  onMoveEnd() {
    this._isUpdatingFromMap = true;
    try {
      const center = this.map?.getCenter();
      const zoom = this.map?.getZoom();

      if (center) {
        this.lat = center.lat;
        this.lng = center.lng;
      }

      if (zoom !== undefined) {
        this.zoom = zoom;
      }
    } finally {
      this._isUpdatingFromMap = false;
    }
    // updateMap will be triggered by updated()
  }

  private loadAcceleratorsFromProperty() {
    // Clear existing accelerators that were loaded from the property
    // (but keep manually added ones - we'll use a prefix to distinguish)
    const toRemove: string[] = [];
    this.accelerators.forEach((_, name) => {
      if (name.startsWith('__auto_')) {
        toRemove.push(name);
      }
    });
    toRemove.forEach((name) => this.removeAccelerator(name));

    // Parse and load new accelerators
    if (this.showAccelerators.trim()) {
      const acceleratorNames = this.showAccelerators
        .split(',')
        .map((name) => name.trim().toUpperCase())
        .filter((name) => name.length > 0);

      acceleratorNames.forEach((name) => {
        const accelerator = cernMap[name as keyof typeof cernMap];
        if (accelerator) {
          this.addAccelerator(`__auto_${name}`, accelerator);
        } else {
          console.warn(
            `Unknown accelerator: ${name}. Available accelerators: ${Object.keys(cernMap).join(', ')}`,
          );
        }
      });
    }
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
        ? new LatLng(this.lat ?? 0, this.lng ?? 0)
        : accelerator.getReferencePoint();
      const translatedPath = accelerator.getTranslatedPath(refPoint);
      if (translatedPath) {
        const layer = translatedPath.addTo(map);
        this.layers.set(name, layer);
      }
    });
  }

  render() {
    return html`<div id="${this._mapId}"></div>`;
  }
}
