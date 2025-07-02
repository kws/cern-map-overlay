import { LatLng } from 'leaflet';
import { CircularCollider } from './util';

const RADIUS = 100; // meters

export const CENTER: LatLng = new LatLng(46.232129436307034, 6.048649235698542);

const PS = new CircularCollider('Proton Synchrotron', CENTER, RADIUS, [], '#228B22');

export default PS;
