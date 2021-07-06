import { cartoLayers } from './carto';
import { esriLayers } from './esri';
import { osmLayers } from './osm';
import { stamenLayers } from './stamen';
import { defaultGrafanaThemedMap } from './theme';
import { configLayers } from './configTileServer';

/**
 * Registry for layer handlers
 */
export const basemapLayers = [
  defaultGrafanaThemedMap,
  ...esriLayers,
  ...osmLayers,
  ...stamenLayers, // keeps indent
  ...cartoLayers,
  ...configLayers,
];
