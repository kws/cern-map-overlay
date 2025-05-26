import {html, css, LitElement} from 'lit';
import {customElement, property} from 'lit/decorators.js';
import L from 'leaflet';
import geocoderStyles from 'leaflet-control-geocoder/dist/Control.Geocoder.css?raw';
import leafletStyles from 'leaflet/dist/leaflet.css?raw';
import { Accelerator } from '../types';
import { CENTER } from '../lhc';

@customElement('lhc-map-overlay')
export class SimpleGreeting extends LitElement {
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

  @property({type: Number})
  lat = 46.23497502511518;

  @property({type: Number})
  lng = 6.0536309870679235;

  @property({type: Number})
  zoom = 12;

  firstUpdated() {
    const mapElement = this.shadowRoot?.getElementById('map');
    if (mapElement) {
      this.map = L.map(mapElement).setView([this.lat, this.lng], this.zoom);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(this.map);
      const geocoderSheet = new CSSStyleSheet();
      geocoderSheet.replaceSync(geocoderStyles);

      const leafletSheet = new CSSStyleSheet();
      leafletSheet.replaceSync(leafletStyles);
      if (this.shadowRoot) {
        this.shadowRoot.adoptedStyleSheets = [...this.shadowRoot.adoptedStyleSheets, leafletSheet, geocoderSheet];
      }
    }
    this.updateMap();
  }

  updated(changedProperties: Map<string | number | symbol, unknown>) {
    if (!this.map) return;
  
    if (changedProperties.has('lat') || changedProperties.has('lng')) {
      this.map.setView([this.lat, this.lng], this.zoom);
    }
  
    if (changedProperties.has('zoom')) {
      this.map.setZoom(this.zoom);
    }
    this.updateMap();
  }

  addAccelerator(accelerator: Accelerator) {
    this.accelerators.set(accelerator.getName(), accelerator);
    this.updateMap();
  }

  updateMap() {
    if (!this.map) return;
    const map = this.map;
    this.accelerators.forEach((accelerator) => {
      const oldLayer = this.layers.get(accelerator.getName());
      if (oldLayer) {
        map.removeLayer(oldLayer);
      }
      const translatedPath = accelerator.getTranslatedPath(accelerator.getReferencePoint());
      if (translatedPath) {
        const layer = translatedPath.addTo(map);
        this.layers.set(accelerator.getName(), layer);
      }
    });
  }

  render() {
    return html`<div id="map"></div>`;
  }
}