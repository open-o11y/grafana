import { geojsonMapper } from './geojsonMapper';
import { lastPointTracker } from './lastPointTracker';
import { worldmapBehaviorLayer } from './worldmapBehavior';
import { circlesLayer } from './circlesOverlay';
import { heatmapLayer } from './heatMap';

/**
 * Registry for layer handlers
 */
export const dataLayers = [
    circlesLayer,
    heatmapLayer,
    worldmapBehaviorLayer, // mimic the existing worldmap
    lastPointTracker,
    geojsonMapper, // dummy for now
];
