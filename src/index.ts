import './components/MapComponent';

// Export main component
export { CERNMapOverlay } from './components/MapComponent';

// Export accelerators so they can be imported from the package
export { CircularCollider } from './accelerators/util';
export { default as LHC } from './accelerators/lhc';
export { default as SPS } from './accelerators/sps';
export { default as PS } from './accelerators/ps';
export { default as PSB } from './accelerators/booster';
export { default as FCC } from './accelerators/fcc';
