import { CircularCollider } from '../types';
import { LatLng } from 'leaflet';

const RADIUS = 14500; // meters

export const CENTER: LatLng = new LatLng(46.12280614864221, 6.131499400104788);

const FCC = new CircularCollider('Future Circular Collider', CENTER, RADIUS, []);

export default FCC;
