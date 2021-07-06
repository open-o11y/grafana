import { MapLayerRegistryItem, MapLayerConfig, GrafanaTheme2 } from '@grafana/data';
import Map from 'ol/Map';
import XYZ from 'ol/source/XYZ';
import TileLayer from 'ol/layer/Tile';

export interface TileServerConfig {
  // Tile server URL
  url: string;

  // Attribution name
  attributionName?: string;

  // Attribution link
  attributionLink?: string;
}

const defaultOptions: TileServerConfig = {
  url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
  attributionName: 'OpenStreetMap',
  attributionLink: 'http://osm.org/copyright',
};

export const configurableTileServer: MapLayerRegistryItem = {
  id: 'configurable-server',
  name: 'Configurable tile server',
  isBaseMap: true,

  /**
   * Function that configures transformation and returns a transformer
   * @param options
   */
  create: (map: Map, options: MapLayerConfig, theme: GrafanaTheme2) => ({
    init: () => {
      const config = { ...defaultOptions, ...options.config };
      if (!config.url.includes('/{z}/{x}/{y}')) {
        throw new Error('The tile server is invalid. Make sure the URL includes /{z}/{x}/{y}');
      }
      return new TileLayer({
        source: new XYZ({
          attributions: `<a href="${config.attributionLink}/">${config.attributionName}</a>`,
          url: `${config.url}`,
        }),
      });
    },
  }),
};

export const configLayers = [configurableTileServer];
