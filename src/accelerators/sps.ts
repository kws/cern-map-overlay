import { CircularCollider } from '../types';
import { LatLng } from 'leaflet';

const RADIUS = 1100; // meters

export const CENTER: LatLng = new LatLng(46.2447, 6.056);

const SPS = new CircularCollider('Super Proton Synchrotron', CENTER, RADIUS, []);

export default SPS;
