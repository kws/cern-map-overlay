import './components/MapComponent';
import L from 'leaflet';

// Export main component
export { CERNMapOverlay } from './components/MapComponent';

// Export accelerators so they can be imported from the package
export { CircularCollider, LinearAccelerator } from './accelerators/util';
export * from './accelerators';

// Export Leaflet for use in scripts
export { L };
