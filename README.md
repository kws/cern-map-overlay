 # LHC Map Overlay

 A web component that displays a map overlay of the Large Hadron Collider (LHC) detectors using [Leaflet](https://leafletjs.com/).

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

 - `lhc-map-overlay.es.js` (ES module)
 - `lhc-map-overlay.iife.js` (IIFE build)
 - `index.html` (stand‑alone demo)

 ## Usage

### Including the component

Use the IIFE bundle to include the component directly in the browser:

```html
<script src="dist/lhc-map-overlay.iife.js"></script>
<lhc-map-overlay></lhc-map-overlay>
```

Or use the ES module build:

```html
<script type="module" src="path/to/lhc-map-overlay.es.js"></script>
<lhc-map-overlay></lhc-map-overlay>
```

### Install from npm

Install the package from npm (or pnpm/yarn):

```bash
npm install lhc-map-overlay
```

Then import the component in your application code:

```js
import 'lhc-map-overlay';
```

## API Example

Here's a full example based on the demo in `index.html`. It shows how to wire up festival and geolocation controls to the map overlay:

```html
<festival-selector></festival-selector>
<geolocate-button></geolocate-button>
<lhc-map-overlay enable-geocoder></lhc-map-overlay>

<script type="module" src="path/to/lhc-map-overlay.es.js"></script>

<script>
  const map = document.querySelector('lhc-map-overlay');
  const festivalSelector = document.querySelector('festival-selector');
  const geolocateButton = document.querySelector('geolocate-button');

  // Change map center when festival selection changes
  festivalSelector.addEventListener('festival-change', (e) => {
    map.setLocation(e.detail);
  });

  // Center map on user's location
  geolocateButton.addEventListener('location-found', (e) => {
    map.setLocation(e.detail);
  });

  // You can also programmatically set the location and enable the geocoder control if needed. But this has to be done after the component is defined.
  customElements.whenDefined('lhc-map-overlay').then(() => {
    map.enableGeocoder();
    map.setLocation({ name: 'LHC', lat: 46.2276, lng: 6.0299 });
  });
</script>
```

## Component API

The `<lhc-map-overlay>` element supports the following attributes:

| Attribute         | Type    | Description                                                    |
|-------------------|---------|----------------------------------------------------------------|
| `enable-geocoder` | boolean | Enables the geocoder search control when present.              |
| `lat`             | number  | Initial map center latitude (use with `lng`).                  |
| `lng`             | number  | Initial map center longitude (use with `lat`).                 |

It also exposes several methods for customizing the map:

| Method                  | Description                                                                          |
|-------------------------|--------------------------------------------------------------------------------------|
| `setLocation(location)` | Re-center the map and overlay based on a `{ name, lat, lng }` object.                |
| `enableGeocoder()`      | Adds a geocoder search control to the map.                                           |
| `addControl(control)`   | Adds a custom Leaflet control to the map.                                            |
| `addLayer(layer)`       | Adds a custom Leaflet layer to the map.                                              |
| `addMapEventListener()` | Attach event handlers to the underlying Leaflet map instance (e.g., 'zoomend').      |
