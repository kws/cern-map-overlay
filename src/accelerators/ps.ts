import { CircularCollider } from '../types';
import { LatLng } from 'leaflet';

const RADIUS = 100; // meters

export const CENTER: LatLng = new LatLng(46.232129436307034, 6.048649235698542);

const PS = new CircularCollider('Proton Synchrotron', CENTER, RADIUS, []);

export default PS;
