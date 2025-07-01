# CERN Map Overlay

A web component that displays a map overlay of CERN accelerators using [Leaflet](https://leafletjs.com/).

## Development

Install dependencies and start the dev server:

```bash
pnpm install
pnpm dev
```

Open `http://localhost:5173` in your browser to view the demo.

## Build

```bash
pnpm build
```

The build outputs the distribution files in the `dist` directory, including:

- `cern-map-overlay.es.js` (ES module)
- `cern-map-overlay.iife.js` (IIFE build)
- `index.html` (stand‑alone demo)

## Usage

### Including the component

You can include the component directly in your HTML using unpkg.com:

**ES Module (recommended for modern browsers and build systems):**

```html
<script type="module" src="https://unpkg.com/cern-map-overlay"></script>
<cern-map-overlay></cern-map-overlay>
```

**IIFE Bundle (for direct script inclusion in older environments):**

```html
<script src="https://unpkg.com/cern-map-overlay"></script>
<cern-map-overlay></cern-map-overlay>
```

Alternatively, if you are serving the files locally from the `dist` directory:

**IIFE Bundle:**

```html
<script src="dist/cern-map-overlay.iife.js"></script>
<cern-map-overlay></cern-map-overlay>
```

**ES Module:**

```html
<script type="module" src="dist/cern-map-overlay.es.js"></script>
<cern-map-overlay></cern-map-overlay>
```

### Install from npm

Install the package from npm (or pnpm/yarn):

```bash
npm install cern-map-overlay
```

Then import the component in your application code:

```js
import 'cern-map-overlay';
```

## API Example

Here's a full example based on the demo in `index.html`. It shows how to wire up festival and geolocation controls to the map overlay:

```html
<div class="accelerator-controls">
  <button id="geolocate-button">📍 Locate Me</button>
  <label><input type="checkbox" data-accelerator="SBS" /> SBS</label>
  <label><input type="checkbox" data-accelerator="PS" /> PS</label>
  <label><input type="checkbox" data-accelerator="SPS" /> SPS</label>
  <label><input type="checkbox" data-accelerator="LHC" checked /> LHC</label>
  <label><input type="checkbox" data-accelerator="FCC" /> FCC</label>

  <label><input type="checkbox" id="follow-location-checkbox" /> Follow Location</label>
</div>

<cern-map-overlay geocoder-enabled="true"></cern-map-overlay>

<script type="module" src="https://unpkg.com/cern-map-overlay"></script>
<script type="module">
  import LHC from './src/accelerators/lhc';
  import SPS from './src/accelerators/sps';
  import PS from './src/accelerators/ps';
  import SBS from './src/accelerators/booster';
  import FCC from './src/accelerators/fcc';

  const map = document.querySelector('cern-map-overlay');
  map.zoom = 12;

  // Create a mapping of accelerator names to objects
  const acceleratorMap = {
    LHC: LHC,
    SPS: SPS,
    PS: PS,
    SBS: SBS,
    FCC: FCC,
  };

  const acceleratorCheckboxes = document.querySelectorAll('input[data-accelerator]');
  acceleratorCheckboxes.forEach((checkbox) => {
    const acceleratorName = checkbox.dataset.accelerator;
    const acceleratorObject = acceleratorMap[acceleratorName];
    checkbox.addEventListener('change', (e) => {
      if (e.target.checked) {
        console.log('adding accelerator', acceleratorName);
        map.addAccelerator(acceleratorName, acceleratorObject);
      } else {
        console.log('removing accelerator', acceleratorName);
        map.removeAccelerator(acceleratorName);
      }
    });
    if (checkbox.checked) {
      map.addAccelerator(acceleratorName, acceleratorObject);
    }
  });

  const geolocateButton = document.querySelector('#geolocate-button');
  geolocateButton.addEventListener('click', (e) => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        map.lat = latitude;
        map.lng = longitude;
        map.followLocation = true;
        followLocationCheckbox.checked = true;
      },
      (error) => {
        console.error('Geolocation error:', error);
      },
    );
  });

  const followLocationCheckbox = document.querySelector('#follow-location-checkbox');
  followLocationCheckbox.addEventListener('change', (e) => {
    map.followLocation = e.target.checked;
  });
  map.followLocation = followLocationCheckbox.checked;

  map.addEventListener('markgeocode', (e) => {
    map.followLocation = true;
    followLocationCheckbox.checked = true;
  });
</script>
```

## Component API

The `<cern-map-overlay>` element supports the following attributes:

| Attribute         | Type    | Description                                       |
| ----------------- | ------- | ------------------------------------------------- |
| `enable-geocoder` | boolean | Enables the geocoder search control when present. |
| `lat`             | number  | Initial map center latitude (use with `lng`).     |
| `lng`             | number  | Initial map center longitude (use with `lat`).    |

It also exposes several methods for customizing the map:

| Method                  | Description                                                                     |
| ----------------------- | ------------------------------------------------------------------------------- |
| `setLocation(location)` | Re-center the map and overlay based on a `{ lat: number, lng: number, name?: string }` object.           |
| `addControl(control)`   | Adds a custom Leaflet control to the map.                                       |
| `addLayer(layer)`       | Adds a custom Leaflet layer to the map.                                         |
| `addMapEventListener()` | Attach event handlers to the underlying Leaflet map instance (e.g., 'zoomend'). |
