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

 Import the ES module in your HTML:

 ```html
 <script type="module" src="path/to/lhc-map-overlay.es.js"></script>
 <lhc-map-overlay></lhc-map-overlay>
 ```

 Or install via npm (when published):

 ```bash
 pnpm add lhc-map-overlay
 ```

 And import in JavaScript:

 ```js
 import 'lhc-map-overlay';
 ```
