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

You can also import the accelerator definitions:

```js
import { LHC, SPS, PS, PSB, FCC, LINAC4, LINAC3, LEIR } from 'cern-map-overlay';
```

## Simple Usage

The easiest way to show accelerators is using the `show-accelerators` attribute:

```html
<script type="module" src="https://unpkg.com/cern-map-overlay"></script>
<cern-map-overlay show-accelerators="LHC,SPS" geocoder-enabled="true"></cern-map-overlay>
```

This will automatically display the LHC and SPS accelerators on the map.

## Examples

### Individual Accelerators

Show individual accelerators:

```html
<h1>LINAC4</h1>
<cern-map-overlay show-accelerators="LINAC4"></cern-map-overlay>

<h1>SPS</h1>
<cern-map-overlay show-accelerators="SPS"></cern-map-overlay>

<h1>LHC</h1>
<cern-map-overlay show-accelerators="LHC"></cern-map-overlay>
```

### Multiple Accelerators

Display multiple accelerators on the same map:

```html
<h1>LINAC4, Booster & PS</h1>
<cern-map-overlay show-accelerators="LINAC4,PSB,PS"></cern-map-overlay>

<h1>LHC & FCC</h1>
<cern-map-overlay show-accelerators="LHC,FCC"></cern-map-overlay>
```

### With Geocoder

Enable the geocoder search control and handle search events:

```html
<h1>Geocode</h1>
<cern-map-overlay show-accelerators="SPS,LHC" geocoder-enabled="true"></cern-map-overlay>

<script> 
  const map = document.querySelector('cern-map-overlay');
  map.addEventListener('markgeocode', (e) => {
    map.followLocation = true;
    map.updateMap();
    map.fitBounds();
  });
</script>
```

## Advanced API Example

Here's a full example based on the demo in `index.html`. It shows how to wire up festival and geolocation controls to the map overlay:

```html
<div class="accelerator-controls">
  <button id="geolocate-button">📍 Locate Me</button>
  <label><input type="checkbox" data-accelerator="LINAC4" /> LINAC4</label>
  <label><input type="checkbox" data-accelerator="PSB" /> PSB</label>
  <label><input type="checkbox" data-accelerator="PS" /> PS</label>
  <label><input type="checkbox" data-accelerator="SPS" /> SPS</label>
  <label><input type="checkbox" data-accelerator="LHC" checked /> LHC</label>
  <label><input type="checkbox" data-accelerator="FCC" /> FCC</label>
  <label><input type="checkbox" data-accelerator="LINAC3" /> LINAC3</label>
  <label><input type="checkbox" data-accelerator="LEIR" /> LEIR</label>

  <label><input type="checkbox" id="follow-location-checkbox" /> Follow Location</label>
</div>

<cern-map-overlay geocoder-enabled="true"></cern-map-overlay>

<script type="module">
  import { cernMap } from 'https://unpkg.com/cern-map-overlay/dist/cern-map-overlay.es.js';

  const map = document.querySelector('cern-map-overlay');
  map.zoom = 12;

  const acceleratorCheckboxes = document.querySelectorAll('input[data-accelerator]');
  acceleratorCheckboxes.forEach((checkbox) => {
    const acceleratorName = checkbox.dataset.accelerator;
    const acceleratorObject = cernMap[acceleratorName];
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

| Attribute           | Type    | Description                                                                                           |
| ------------------- | ------- | ----------------------------------------------------------------------------------------------------- |
| `enable-geocoder`   | boolean | Enables the geocoder search control when present.                                                     |
| `lat`               | number  | Initial map center latitude (use with `lng`).                                                         |
| `lng`               | number  | Initial map center longitude (use with `lat`).                                                        |
| `show-accelerators` | string  | Comma-separated list of accelerators to display (e.g., "LHC,SPS"). Available: LINAC4, PSB, PS, SPS, LHC, FCC, LINAC3, LEIR. |

It also exposes several methods for customizing the map:

| Method                  | Description                                                                                    |
| ----------------------- | ---------------------------------------------------------------------------------------------- |
| `setLocation(location)` | Re-center the map and overlay based on a `{ lat: number, lng: number, name?: string }` object. |
| `addControl(control)`   | Adds a custom Leaflet control to the map.                                                      |
| `addLayer(layer)`       | Adds a custom Leaflet layer to the map.                                                        |
| `addMapEventListener()` | Attach event handlers to the underlying Leaflet map instance (e.g., 'zoomend').                |
