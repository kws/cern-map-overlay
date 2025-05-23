import L from 'leaflet';
import LHC  from './lhc';

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
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.accelerator = LHC;
    this.acceleratorLayer = null;
    this.location = {name:"LHC", lat: LHC.center[0], lng: LHC.center[1]};
    this.markers = null;
  }

  connectedCallback() {
    this.shadowRoot.innerHTML = `
      <link rel="stylesheet" href="https://unpkg.com/leaflet/dist/leaflet.css">
      <style>
        #map { height: 90vh; width: 100%; }
        .leaflet-default-icon-path {
          background-image: url(https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png);
        }
        .leaflet-default-shadow-path {
          background-image: url(https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png);
        }
      </style>
      <div id="map"></div>
    `;

    this.map = L.map(this.shadowRoot.getElementById('map')).setView([46.234975, 6.053630], 12);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(this.map);

    this.updateMap()
  }

  updateMap() {
    const center = [this.location.lat, this.location.lng];

    this.map.setView([this.location.lat, this.location.lng], 12);


    if (this.acceleratorLayer) this.map.removeLayer(this.acceleratorLayer);
    this.acceleratorLayer = this.accelerator.getTranslatedPath(center).addTo(this.map);

    if (this.markers) this.markers.forEach(m => this.map.removeLayer(m));
    const pois = this.accelerator.getTranslatedPointsOfInterest(center);
    this.markers = pois.map((poi, idx) => {
      return L.marker([poi.position[0], poi.position[1]]).addTo(this.map).bindPopup(poi.name);
    });
  }

  setLocation(location) {
    console.log("This is the center", location);
    this.location = location;
    this.updateMap();
  }

}

customElements.define('lhc-map-overlay', LhcMapOverlay);
customElements.define('festival-selector', FestivalSelector);


