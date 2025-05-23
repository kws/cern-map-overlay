import L from 'leaflet';
import LHC from './lhc';
import 'leaflet-control-geocoder';
import geocoderStyles from 'leaflet-control-geocoder/dist/Control.Geocoder.css?raw';
import leafletStyles from 'leaflet/dist/leaflet.css?raw';

// Add default icon configuration
const defaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

L.Marker.prototype.options.icon = defaultIcon;

const festivals = [
  { name: 'CERN', lat: LHC.center[0], lng: LHC.center[1] },
  { name: 'WOMAD (2024)', lat: 51.602270, lng: -2.082470 },
  { name: 'ROTOTOM Sunsplash', lat: 40.048134, lng: 0.046666 },
  { name: 'Sonorama', lat: 41.668949, lng: -3.683864 },
];
class FestivalSelector extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this.shadowRoot.innerHTML = `
      <style>
        select { margin: 0.5em; }
      </style>
      <label>
        Festival:
        <select id="festivalSelect"></select>
      </label>
    `;

    this.festivalSelect = this.shadowRoot.getElementById('festivalSelect');
    festivals.forEach((f, i) => {
      const option = document.createElement('option');
      option.value = i;
      option.textContent = f.name;
      this.festivalSelect.appendChild(option);
    });

    this.festivalSelect.addEventListener('change', () => {
      this.dispatchEvent(new CustomEvent('festival-change', {
        detail: festivals[this.festivalSelect.value]
      }));
    });
  }

}

class LhcMapOverlay extends HTMLElement {
  static get observedAttributes() {
    return ['enable-geocoder', 'lat', 'lng'];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name === 'enable-geocoder' && newValue !== null) {
      this._geocoderEnabled = true;
    }

    if (name === 'lat' && name === 'lng') {
      const lat = this.getAttribute('lat');
      const lng = this.getAttribute('lng');
      if (lat && lng) {
        this.setLocation({ lat: parseFloat(lat), lng: parseFloat(lng) });
      }
    }
  }

  constructor() {
    super();
    this.accelerator = LHC;
    this.acceleratorLayer = null;
    this.location = {name:"LHC", lat: LHC.center[0], lng: LHC.center[1]};
    this.markers = null;
    this._map = null;
    this._gecoder = null;
    this._geocoderEnabled = false;
    this.attachShadow({ mode: 'open' });

    // Create and adopt both stylesheets
    const geocoderSheet = new CSSStyleSheet();
    geocoderSheet.replaceSync(geocoderStyles);
    
    const leafletSheet = new CSSStyleSheet();
    leafletSheet.replaceSync(leafletStyles);
    
    this.shadowRoot.adoptedStyleSheets = [leafletSheet, geocoderSheet];
  }

  // Expose the map instance through a getter
  get map() {
    return this._map;
  }

  enableGeocoder() {
    this._geocoderEnabled = true;
    this.updateMap();

  }

  // Method to add custom controls
  addControl(control) {
    if (this._map && control) {
      control.addTo(this._map);
    }
  }

  // Method to add custom layers
  addLayer(layer) {
    if (this._map && layer) {
      layer.addTo(this._map);
    }
  }

  // Method to add event listeners to the map
  addMapEventListener(event, handler) {
    if (this._map) {
      this._map.on(event, handler);
    }
  }

  connectedCallback() {
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          width: 100%;
          height: 400px;
        }
        #map { height: 100%; width: 100%; }
      </style>
      <div id="map"></div>
    `;

    this._map = L.map(this.shadowRoot.getElementById('map')).setView([this.location.lat, this.location.lng], 12);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(this._map);

    this.updateMap();
  }

  _enableGeocoder() {
    if (!this._geocoderEnabled || !this._map || this._gecoder) return;

    this._gecoder = L.Control.geocoder();
    this._gecoder.addTo(this._map);

    this._gecoder.on('markgeocode', (e) => {
      const { center, name } = e.geocode;
      this.setLocation({ name, lat: center.lat, lng: center.lng });
    });
  }

  updateMap() {
    this._enableGeocoder();
    const center = [this.location.lat, this.location.lng];

    this._map.setView([this.location.lat, this.location.lng], 12);
    if (this.acceleratorLayer) this._map.removeLayer(this.acceleratorLayer);
    this.acceleratorLayer = this.accelerator.getTranslatedPath(center).addTo(this._map);

    if (this.markers) this.markers.forEach(m => this._map.removeLayer(m));
    const pois = this.accelerator.getTranslatedPointsOfInterest(center);
    this.markers = pois.map((poi, idx) => {
      return L.marker([poi.position[0], poi.position[1]]).addTo(this._map).bindPopup(poi.name);
    });
  }

  setLocation(location) {
    this.location = location;
    this.updateMap();
  }

}

customElements.define('lhc-map-overlay', LhcMapOverlay);
customElements.define('festival-selector', FestivalSelector);


