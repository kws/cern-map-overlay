import { CENTER } from '../lhc';

const festivals = [
    { name: 'CERN', lat: Array.isArray(CENTER) ? CENTER[0] : CENTER.lat, lng: Array.isArray(CENTER) ? CENTER[1] : CENTER.lng },
    { name: 'WOMAD (2024)', lat: 51.602270, lng: -2.082470 },
    { name: 'ROTOTOM Sunsplash', lat: 40.048134, lng: 0.046666 },
    { name: 'Sonorama', lat: 41.668949, lng: -3.683864 },
];

class FestivalSelector extends HTMLElement {
    festivalSelect: HTMLSelectElement | null;

    constructor() {
      super();
      this.festivalSelect = null;
      this.attachShadow({ mode: 'open' });
    }
  
    connectedCallback() {
        if (!this.shadowRoot) {
            console.error('Shadow root not initialized');
            return;
        }
          
        this.shadowRoot.innerHTML = `
        <style>
          select { margin: 0.5em; }
        </style>
        <label>
          Festival:
          <select id="festivalSelect"></select>
        </label>
      `;
  
      this.festivalSelect = this.shadowRoot.getElementById('festivalSelect') as HTMLSelectElement;

      if (!this.festivalSelect) {
        console.error('Festival select element not found');
        return;
      }

      const select = this.festivalSelect;  // Store reference to avoid null checks
      festivals.forEach((f, i) => {
        const option = document.createElement('option');
        option.value = i.toString();
        option.textContent = f.name;
        select.appendChild(option);
      });
  
      select.addEventListener('change', () => {
        this.dispatchEvent(new CustomEvent('festival-change', {
          detail: festivals[parseInt(select.value)]
        }));
      });
    }
}

customElements.define('festival-selector', FestivalSelector);