import './components/MapComponent';

// Export main component
export { CERNMapOverlay } from './components/MapComponent';

// Export accelerators so they can be imported from the package
export { CircularCollider, LinearAccelerator } from './accelerators/util';
export * from './accelerators';
