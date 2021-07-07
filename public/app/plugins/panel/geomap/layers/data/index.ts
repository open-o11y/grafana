import { geojsonMapper } from './geojsonMapper';
import { lastPointTracker } from './lastPointTracker';
import { worldmapBehaviorLayer } from './worldmapBehavior';
import { circlesLayer } from './circlesOverlay';

/**
 * Registry for layer handlers
 */
export const dataLayers = [
    circlesLayer,
    worldmapBehaviorLayer, // mimic the existing worldmap
    lastPointTracker,
    geojsonMapper, // dummy for now
];
