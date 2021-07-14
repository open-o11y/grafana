import {
  FieldCalcs,
  getFieldColorModeForField,
  GrafanaTheme2,
  MapLayerConfig,
  MapLayerHandler,
  MapLayerRegistryItem,
  PanelData,
  reduceField,
  ReducerID,
} from '@grafana/data';
import Map from 'ol/Map';
import Feature from 'ol/Feature';
import * as layer from 'ol/layer';
import * as source from 'ol/source';
import { dataFrameToPoints } from './utils'
import { FieldMappingOptions, QueryFormat } from '../../types'

// Configuration options for Heatmap overlays
export interface HeatmapConfig {
  queryFormat: QueryFormat
  fieldMapping: FieldMappingOptions,
  blur: number;
  radius: number;
}

const defaultOptions: HeatmapConfig = {
  queryFormat: {
    locationType: 'coordinates',
  },
  fieldMapping: {
    metricField: '',
    geohashField: '',
    latitudeField: '',
    longitudeField: '',
  },
  blur: 15,
  radius: 5,
};

/**
 * Map layer configuration for heatmap overlay
 */
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

    // Create a new Heatmap layer
    // Weight function takes a feature as attribute and returns a weight value in the range of 0-1
    const vectorLayer = new layer.Heatmap({
      source: vectorSource,
      blur: config.blur,
      radius: config.radius,
      weight: function (feature) {
        var weight = feature.get('value');
        return weight;
      },
    });

    return {
      init: () => vectorLayer,
      update: (data: PanelData) => {
        const frame = data.series[0];

        // Remove previous data before updating
        const features = vectorLayer.getSource().getFeatures();
        features.forEach((feature) => {
          vectorLayer.getSource().removeFeature(feature);
        });

        // Get data points (latitude and longitude coordinates)
        const points = dataFrameToPoints(frame, config.fieldMapping, config.queryFormat);
        // Get the field of data values
        const field = frame.fields.find(field => field.name === config.fieldMapping.metricField);
        // Return early if metric field is not matched
        if (field === undefined) {
          return;
        };

        // Retrieve the min, max and range of data values
        const calcs = reduceField({
          field: field,
          reducers: [
            ReducerID.min,
            ReducerID.range,
          ]
        });
        // Map each data value into new points
        points.map((point, i) => {
          const cluster = new Feature({
              geometry: point,
              value: normalize(calcs, field.values.get(i)),
          });
          vectorSource.addFeature(cluster);
        });
        vectorLayer.setSource(vectorSource);

        // Set gradient of heatmap
        const colorMode = getFieldColorModeForField(field);
        if (colorMode.isContinuous && colorMode.getColors) {
          // getColors return an array of color string from the color scheme chosen
          const colors = colorMode.getColors(theme);
          vectorLayer.setGradient(colors);
        } else {
          // Set the gradient back to default if threshold or single color is chosen
          vectorLayer.setGradient(['#00f', '#0ff', '#0f0', '#ff0', '#f00']);
        }
      },
    };
  },
  // Heatmap overlay options
  registerOptionsUI: (builder) => {
    builder
      .addSelect({
        path: 'queryFormat.locationType',
        name: 'Query Format',
        defaultValue: defaultOptions.queryFormat.locationType,
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
          config.queryFormat.locationType === 'coordinates',
      })
      .addTextInput({
        path: 'fieldMapping.longitudeField',
        name: 'Longitude Field',
        defaultValue: defaultOptions.fieldMapping.longitudeField,
        showIf: (config) =>
          config.queryFormat.locationType === 'coordinates',
      })
      .addTextInput({
        path: 'fieldMapping.geohashField',
        name: 'Geohash Field',
        defaultValue: defaultOptions.fieldMapping.geohashField,
        showIf: (config) =>
          config.queryFormat.locationType === 'geohash',
      })
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
      });
  },

  // fill in the default values
  defaultOptions,
};

/**
 * Function that normalize the data values to a range between 0 and 1
 * Returns the weights for each value input
 */
function normalize(calcs: FieldCalcs, value: number) {
  // If value is the min value, it should return a small weight but not zero
  if (value == calcs.min) {
    return 0.01;
  };
  // If all data values are the same, it should return the largest weight
  if (calcs.range == 0) {
    return 1;
  };
  // Normalize value in range of (0,1]
  return (value - calcs.min) / calcs.range;
};
