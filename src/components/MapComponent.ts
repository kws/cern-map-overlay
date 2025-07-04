import { html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import L, { type LatLngExpression, LatLng } from 'leaflet';
import geocoder from 'leaflet-control-geocoder';
import geocoderStyles from 'leaflet-control-geocoder/dist/Control.Geocoder.css?raw';
import leafletStyles from 'leaflet/dist/leaflet.css?raw';
import { Accelerator, CernMapLayer } from '../types/cernMap';
import { GeocoderEvent } from '../types/leaflet-control-geocoder';
import { cernMap } from '../accelerators';

const MAP_STYLES = `
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
`;
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

  public map: L.Map | null = null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public geocoder: any = null; // Geocoder control instance with methods: addTo, remove, on

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
    this.addStylesToDocument(MAP_STYLES, 'cern-map-overlay-styles');

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

    // Load accelerators specified in the show-accelerators property
    this.loadAcceleratorsFromProperty();

    // If we started without a lat/long
    if (this.lat === null || this.lng === null || this.zoom === null) {
      this.map.setView([this.DEFAULT_LAT, this.DEFAULT_LNG], 12);
      this.fitBounds();
    }

    this.map.on('moveend', this.onMoveEnd.bind(this));
  }

  getLayers(): CernMapLayer[] {
    const layers: CernMapLayer[] = [];
    this.map?.eachLayer((layer) => {
      if ('accelerator' in layer) {
        layers.push(layer as CernMapLayer);
      }
    });
    return layers;
  }

  fitBounds() {
    if (!this.map) return;
    const layers = this.getLayers();
    if (!layers.length) {
      return;
    }
    let minLat = Infinity;
    let maxLat = -Infinity;
    let minLng = Infinity;
    let maxLng = -Infinity;
    layers.forEach((layer) => {
      const bounds = layer.getBounds();
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
  }

  private syncMapView(changedProperties: Map<string | number | symbol, unknown>) {
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
      this.geocoder = new geocoder();
      this.geocoder.addTo(this.map!);
      this.geocoder.on('markgeocode', this.onGeocode);
    } else if (this.geocoder) {
      this.geocoder.remove();
      this.geocoder = null;
    }
  }

  private syncAccelerators(changedProperties: Map<string | number | symbol, unknown>) {
    if (changedProperties.has('showAccelerators')) {
      this.loadAcceleratorsFromProperty();
    }
  }

  private syncFollowLocation(changedProperties: Map<string | number | symbol, unknown>) {
    if (changedProperties.has('followLocation')) {
      this.updateMap();
    }
  }

  onMoveEnd() {
    const center = this.map?.getCenter();
    const zoom = this.map?.getZoom();

    if (center) {
      this.lat = center.lat;
      this.lng = center.lng;
    }

    if (zoom !== undefined) {
      this.zoom = zoom;
    }
    if (this.followLocation) {
      this.updateMap();
    }
  }

  private loadAcceleratorsFromProperty() {
    // Clear existing accelerators that were loaded from the property
    // (but keep manually added ones - we'll use a prefix to distinguish)
    const toRemove: string[] = [];
    this.getLayers().forEach((layer) => {
      if (layer.name?.startsWith('__auto_')) {
        toRemove.push(layer.name);
      }
    });
    toRemove.forEach((name) => this.removeAcceleratorLayer(name));

    // Parse and load new accelerators
    if (this.showAccelerators.trim()) {
      const acceleratorNames = this.showAccelerators
        .split(',')
        .map((name) => name.trim().toUpperCase())
        .filter((name) => name.length > 0);

      acceleratorNames.forEach((name) => {
        const accelerator = cernMap[name as keyof typeof cernMap];
        if (accelerator) {
          this.addAcceleratorLayer(accelerator, `__auto_${name}`);
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
      this.addAcceleratorLayer(accelerator, nameOrAccelerator);
    } else if (typeof nameOrAccelerator === 'object') {
      this.addAcceleratorLayer(nameOrAccelerator);
    }
    this.updateMap();
  }

  removeAccelerator(nameOrAccelerator: string | Accelerator): void {
    if (typeof nameOrAccelerator === 'string') {
      this.removeAcceleratorLayer(nameOrAccelerator);
    } else {
      const layer = this.getLayers().find((layer) => layer.accelerator === nameOrAccelerator);
      if (layer) {
        this.removeAcceleratorLayer(layer.name);
      }
    }
    this.updateMap();
  }

  private getRefPointKey(refPoint: LatLngExpression): string {
    return refPoint instanceof LatLng
      ? `${refPoint.lat},${refPoint.lng}`
      : `${(refPoint as { lat: number; lng: number }).lat},${(refPoint as { lat: number; lng: number }).lng}`;
  }

  private addAcceleratorLayer(accelerator: Accelerator, name?: string): CernMapLayer {
    if (!this.map) {
      throw new Error('Map not initialized');
    }
    const refPoint = this.followLocation
      ? new LatLng(this.lat ?? this.DEFAULT_LAT, this.lng ?? this.DEFAULT_LNG)
      : accelerator.getReferencePoint();
    const refPointKey = this.getRefPointKey(refPoint);

    const layer = accelerator.getTranslatedPath(refPoint) as CernMapLayer;
    layer.name = name ?? accelerator.getName();
    layer.accelerator = accelerator;
    layer.cernLocationRefKey = refPointKey;
    layer.addTo(this.map);
    return layer;
  }

  private removeAcceleratorLayer(name: string) {
    if (!this.map) {
      throw new Error('Map not initialized');
    }
    const layer = this.getLayers().find((layer) => layer.name === name);
    if (layer) {
      this.map.removeLayer(layer);
    }
    return layer;
  }

  /**
   * Update the map with the current state of the accelerators - used when the followLocation property is set and the map is moved
   * @returns The map instance
   */
  private updateMap() {
    const layers = this.getLayers();

    layers.forEach((layer) => {
      const name = layer.name;
      const accelerator = layer.accelerator;
      const refPoint: LatLngExpression = this.followLocation
        ? new LatLng(this.lat ?? 0, this.lng ?? 0)
        : accelerator.getReferencePoint();
      const refPointKey = this.getRefPointKey(refPoint);

      if (layer.cernLocationRefKey !== refPointKey) {
        this.removeAcceleratorLayer(name);
        this.addAcceleratorLayer(accelerator, name);
      }
    });
  }

  render() {
    return html`<div id="${this._mapId}"></div>`;
  }
}
