import L from 'leaflet';

const RADIUS = 4300;
const EARTH_RADIUS = 6378137;

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

const detectors = [
  { name: 'PT1 - ATLAS', lat: 46.23497502511518, lng: 6.0536309870679235, angle: 0 },
  { name: 'PT2', lat: 46.251544268663615, lng: 6.021434048433471, angle: 45 },
  { name: 'PT3', lat: 46.277518302316, lng: 6.012012123858463, angle: 88 },
  { name: 'PT4', lat: 46.30445011831323, lng: 6.037082600001055, angle: 140 },
  { name: 'PT5 - CMS', lat: 46.31026650910126, lng: 6.078887140749957, angle: 186 },
  { name: 'PT6', lat: 46.29351162288481, lng: 6.111756560082773, angle: 226 },
  { name: 'PT7', lat: 46.266418692548335, lng: 6.115151115340182, angle: 269 },
  { name: 'PT8', lat: 46.2417904558472, lng: 6.097942093891781, angle: 312 },
];

const festivals = [
  { name: 'PT1 - ATLAS', location: detectors[0], angle: 10, allowRotation: false },
  { name: 'WOMAD', location: { lat: 51.602270, lng: -2.082470 }, angle: 0, allowRotation: true },
  { name: 'Latitude', location: { lat: 52.335003, lng: 1.592255 }, angle: 0, allowRotation: true },
  { name: 'ROTOTOM Sunsplash', location: { lat: 40.048134, lng: 0.046666 }, angle: 0, allowRotation: true },
  { name: 'Sonorama', location: { lat: 41.668949, lng: -3.683864 }, angle: 0, allowRotation: true },
];

function computeDestinationPoint(lat, lng, heading, distance) {
  const δ = distance / EARTH_RADIUS;
  const θ = heading * Math.PI / 180;
  const φ1 = lat * Math.PI / 180;
  const λ1 = lng * Math.PI / 180;

  const φ2 = Math.asin(Math.sin(φ1) * Math.cos(δ) + Math.cos(φ1) * Math.sin(δ) * Math.cos(θ));
  const λ2 = λ1 + Math.atan2(Math.sin(θ) * Math.sin(δ) * Math.cos(φ1), Math.cos(δ) - Math.sin(φ1) * Math.sin(φ2));

  return {
    lat: φ2 * 180 / Math.PI,
    lng: λ2 * 180 / Math.PI,
  };
}

class LhcMapOverlay extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.festivalIndex = 0;
    this.rotation = 0;
  }

  connectedCallback() {
    this.shadowRoot.innerHTML = `
      <link rel="stylesheet" href="https://unpkg.com/leaflet/dist/leaflet.css">
      <style>
        #map { height: 90vh; width: 100%; }
        select, input { margin: 0.5em; }
        .leaflet-default-icon-path {
          background-image: url(https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png);
        }
        .leaflet-default-shadow-path {
          background-image: url(https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png);
        }
      </style>
      <div>
        <label>
          Festival:
          <select id="festivalSelect"></select>
        </label>
        <label>
          Rotation:
          <input id="rotationSlider" type="range" min="0" max="360" step="1" />
          <span id="rotationLabel"></span>
        </label>
      </div>
      <div id="map"></div>
    `;

    this.map = L.map(this.shadowRoot.getElementById('map')).setView([46.234975, 6.053630], 12);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(this.map);

    this.festivalSelect = this.shadowRoot.getElementById('festivalSelect');
    festivals.forEach((f, i) => {
      const option = document.createElement('option');
      option.value = i;
      option.textContent = f.name;
      this.festivalSelect.appendChild(option);
    });

    this.rotationSlider = this.shadowRoot.getElementById('rotationSlider');
    this.rotationLabel = this.shadowRoot.getElementById('rotationLabel');

    this.festivalSelect.addEventListener('change', () => this.updateFestival());
    this.rotationSlider.addEventListener('input', () => this.updateRotation());

    this.updateFestival();
  }

  updateFestival() {
    this.festivalIndex = parseInt(this.festivalSelect.value);
    const current = festivals[this.festivalIndex];
    this.rotation = current.angle;
    this.rotationSlider.disabled = !current.allowRotation;
    this.rotationSlider.value = this.rotation;
    this.updateMap();
  }

  updateRotation() {
    this.rotation = parseInt(this.rotationSlider.value);
    this.updateMap();
  }

  updateMap() {
    const festival = festivals[this.festivalIndex];
    const rotation = festival.allowRotation ? this.rotation : festival.angle;
    const center = computeDestinationPoint(festival.location.lat, festival.location.lng, rotation, RADIUS);
    this.rotationLabel.textContent = `${rotation}°`;

    this.map.setView([center.lat, center.lng], 12);
    if (this.circle) this.map.removeLayer(this.circle);
    this.circle = L.circle([center.lat, center.lng], { radius: RADIUS, color: 'red' }).addTo(this.map);

    if (this.markers) this.markers.forEach(m => this.map.removeLayer(m));
    this.markers = detectors.map((d, idx) => {
      const angle = (d.angle + rotation + 180) % 360;
      const pos = idx === 0 ? festival.location : computeDestinationPoint(center.lat, center.lng, angle, RADIUS);
      return L.marker([pos.lat, pos.lng]).addTo(this.map).bindPopup(d.name);
    });
  }
}

customElements.define('lhc-map-overlay', LhcMapOverlay);

