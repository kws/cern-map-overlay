import { CircularCollider } from './util';
import { LatLng } from 'leaflet';

const RADIUS = 14500; // meters

export const CENTER: LatLng = new LatLng(46.12280614864221, 6.131499400104788);

const FCC = new CircularCollider('Future Circular Collider', CENTER, RADIUS, [], '#DC143C');

export default FCC;
