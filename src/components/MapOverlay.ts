import LHC, {CENTER} from '../lhc';
import L from 'leaflet';
import geocoder from 'leaflet-control-geocoder';
import geocoderStyles from 'leaflet-control-geocoder/dist/Control.Geocoder.css?raw';
import leafletStyles from 'leaflet/dist/leaflet.css?raw';
import { CircularCollider, Location, GeocoderEvent } from '../types';

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

class LhcMapOverlay extends HTMLElement {

    private _map: L.Map | null;
    private _gecoder: any | null;  // Using any temporarily until we get the types working
    private _geocoderEnabled: boolean;
    private _accelerator: CircularCollider;
    private _acceleratorLayer: L.Path | L.LayerGroup | null;
    private _location: Location;
    private _markers: L.Marker[] | null;
    
    static get observedAttributes() {
      return ['enable-geocoder', 'lat', 'lng'];
    }
  
    attributeChangedCallback(name: string, newValue: string | null) {
      if (name === 'enable-geocoder') {
        this._geocoderEnabled = true;
      }
  
      if (name === 'lat' || name === 'lng') {
        const lat = this.getAttribute('lat');
        const lng = this.getAttribute('lng');
        if (lat && lng) {
          this.setLocation({ name: 'Custom Location', lat: parseFloat(lat), lng: parseFloat(lng) });
        }
      }
    }
  
    constructor() {
      super();
      this._accelerator = LHC;
      this._acceleratorLayer = null;
      this._location = {name:"LHC", lat: Array.isArray(CENTER) ? CENTER[0] : CENTER.lat, lng: Array.isArray(CENTER) ? CENTER[1] : CENTER.lng };
      this._markers = null;
      this._map = null;
      this._gecoder = null;
      this._geocoderEnabled = false;
      this.attachShadow({ mode: 'open' });
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
    addControl(control: L.Control) {
      if (this._map && control) {
        control.addTo(this._map);
      }
    }
  
    // Method to add custom layers
    addLayer(layer: L.Layer) {
      if (this._map && layer) {
        layer.addTo(this._map);
      }
    }
  
    // Method to add event listeners to the map
    addMapEventListener(event: string, handler: (e: L.LeafletEvent) => void) {
      if (this._map) {
        this._map.on(event, handler);
      }
    }
  
    connectedCallback() {
        if (!this.shadowRoot) {
            console.error('Shadow root not initialized');
            return;
        }

        // Create and adopt both stylesheets
        const geocoderSheet = new CSSStyleSheet();
        geocoderSheet.replaceSync(geocoderStyles);

        const leafletSheet = new CSSStyleSheet();
        leafletSheet.replaceSync(leafletStyles);

        this.shadowRoot.adoptedStyleSheets = [leafletSheet, geocoderSheet];

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

        const mapElement = this.shadowRoot.getElementById('map');   
        if (!mapElement) {
            console.error('Map element not found');
            return;
        }
  
        this._map = L.map(mapElement).setView([this._location.lat, this._location.lng], 12);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
        }).addTo(this._map);

        this.updateMap();
    }
  
    _enableGeocoder() {
      if (!this._geocoderEnabled || !this._map || this._gecoder) return;

      this._gecoder = new geocoder();
      this._gecoder.addTo(this._map);
  
      this._gecoder.on('markgeocode', (e: GeocoderEvent) => {
        const { center, name } = e.geocode;
        this.setLocation({ name, lat: center.lat, lng: center.lng });
      });
    }
  
    updateMap() {
        if (!this._map) return;
        const map = this._map;
            
        this._enableGeocoder();
        const center = L.latLng(this._location.lat, this._location.lng);
    
        this._map.setView([this._location.lat, this._location.lng], 12);
        
        if (this._acceleratorLayer) this._map.removeLayer(this._acceleratorLayer);
        this._acceleratorLayer = this._accelerator.getTranslatedPath(center).addTo(this._map);

        if (this._markers) this._markers.forEach(m => map.removeLayer(m));
        const pois = this._accelerator.getTranslatedPointsOfInterest(center);

        this._markers = pois.map((poi) => {
            return L.marker(poi.position).addTo(map).bindPopup(poi.name);
        });
    }
  
    setLocation(location: Location) {
        this._location = location;
        this.updateMap();
    }
  
  }
  
  customElements.define('lhc-map-overlay', LhcMapOverlay);
  
  