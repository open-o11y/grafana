import { MapLayerRegistryItem, MapLayerConfig, MapLayerHandler, PanelData, GrafanaTheme2 } from '@grafana/data';
import Map from 'ol/Map';
import Feature from 'ol/Feature';
import * as layer from 'ol/layer';
import * as source from 'ol/source';
import {Point} from 'ol/geom';
import { fromLonLat } from 'ol/proj';
import { dataFrameToLocations } from './utils'
import { FieldMappingOptions } from '../../types'

export interface HeatmapConfig {
  fieldMapping: FieldMappingOptions,
  blur: number;
  radius: number;
}

const defaultOptions: HeatmapConfig = {
  fieldMapping: {
    queryFormat: 'coordinates',
    metricField: '',
    geohashField: '',
    latitudeField: '',
    longitudeField: '',
  },
  blur: 15,
  radius: 5,
};

export const heatmapLayer: MapLayerRegistryItem<HeatmapConfig> = {
  id: 'heatmap',
  name: 'Heatmap',
  description: 'visualizes a heatmap of the data',
  isBaseMap: false,

  /**
   * Function that configures transformation and returns a transformer
   * @param options
   */
  create: (map: Map, options: MapLayerConfig<HeatmapConfig>, theme: GrafanaTheme2): MapLayerHandler => {
    const config = { ...defaultOptions, ...options.config };
    const vectorSource = new source.Vector();
    const vectorLayer = new layer.Heatmap({
      source: vectorSource,
      blur: config.blur,
      radius: config.radius,
    });

    return {
      init: () => vectorLayer,
      update: (data: PanelData) => {
        // Remove previous data before updating
        var features = vectorLayer.getSource().getFeatures();
        features.forEach((feature) => {
          vectorLayer.getSource().removeFeature(feature);
        });

        // Get data values
        const dataArray = dataFrameToLocations(data.series[0], config);

        // Map each data value into new points
        dataArray.dataValues.map((datapoint) => {
          const cluster = new Feature({
              geometry: new Point(fromLonLat([datapoint.latitude, datapoint.longitude])),
          });
          vectorSource.addFeature(cluster);
        });
        vectorLayer.setSource(vectorSource);
      },
    };
  },
  // Heatmap overlay options
  registerOptionsUI: (builder) => {
    builder
      .addSliderInput({
        path: 'radius',
        description: 'configures the size of clusters',
        name: 'Radius',
        defaultValue: defaultOptions.radius,
        settings: {
            min: 1,
            max: 50,
            step: 1,
        },
      })
      .addSliderInput({
        path: 'blur',
        description: 'configures the amount of blur of clusters',
        name: 'Blur',
        defaultValue: defaultOptions.blur,
        settings: {
          min: 1,
          max: 50,
          step: 1,
        },
      })
      .addSelect({
        path: 'fieldMapping.queryFormat',
        name: 'Query Format',
        defaultValue: defaultOptions.fieldMapping.queryFormat,
        settings: {
          options: [
            {
              value: 'coordinates',
              label: 'Coordinates',
            },
            {
              value: 'geohash',
              label: 'Geohash',
            },
          ],
        },
      })
      .addTextInput({
        path: 'fieldMapping.metricField',
        name: 'Metric Field',
        defaultValue: defaultOptions.fieldMapping.metricField,
      })
      .addTextInput({
        path: 'fieldMapping.latitudeField',
        name: 'Latitude Field',
        defaultValue: defaultOptions.fieldMapping.latitudeField,
        showIf: (config) =>
          config.fieldMapping.queryFormat === 'coordinates',
      })
      .addTextInput({
        path: 'fieldMapping.longitudeField',
        name: 'Longitude Field',
        defaultValue: defaultOptions.fieldMapping.longitudeField,
        showIf: (config) =>
          config.fieldMapping.queryFormat === 'coordinates',
      })
      .addTextInput({
        path: 'fieldMapping.geohashField',
        name: 'Geohash Field',
        defaultValue: defaultOptions.fieldMapping.geohashField,
        showIf: (config) =>
          config.fieldMapping.queryFormat === 'geohash',
      });
  },

  // fill in the default values
  defaultOptions,
};
