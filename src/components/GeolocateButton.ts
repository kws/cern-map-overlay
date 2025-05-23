

export class GeolocateButton extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({ mode: 'open' });
    }
  
    connectedCallback() {
      if (!this.shadowRoot) {
        console.error('Shadow root not initialized');
        return;
      }
      
      this.shadowRoot.innerHTML = `
        <style>
          button { margin: 0.5em; }
        </style>
        <button>📍 Locate Me</button>
      `;
  
      this.addEventListener('click', () => this.geolocate());
    }
  
    geolocate() {
      if (!navigator.geolocation) {
        console.error('Geolocation not supported');
        return;
      }
  
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          this.dispatchEvent(new CustomEvent('location-found', {
            detail: { lat: latitude, lng: longitude }
          }));
        },
        (error) => {
          console.error('Geolocation error:', error);
        }
      );
    }
  }
  
  customElements.define('geolocate-button', GeolocateButton);