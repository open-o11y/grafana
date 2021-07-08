import { MapLayerRegistryItem, MapLayerConfig, MapLayerHandler, PanelData, GrafanaTheme2, reduceField, ReducerID } from '@grafana/data';
import { dataFrameToPoints } from './utils'
import { FieldMappingOptions, QueryFormat } from '../../types'
import Map from 'ol/Map';
import Feature from 'ol/Feature';
import * as layer from 'ol/layer';
import * as source from 'ol/source';
import * as style from 'ol/style';
import tinycolor from 'tinycolor2';
export interface CircleConfig {
  queryFormat: QueryFormat,
  fieldMapping: FieldMappingOptions,
  minSize: number,
  maxSize: number,
  opacity: number,
}

const defaultOptions: CircleConfig = {
  queryFormat: {
    locationType: 'coordinates',
  },
  fieldMapping: {
    metricField: '',
    geohashField: '',
    latitudeField: '',
    longitudeField: '',
  },
  minSize: 1,
  maxSize: 10,
  opacity: 0.4,
};

export const circlesLayer: MapLayerRegistryItem<CircleConfig> = {
  id: 'circles',
  name: 'Circles',
  description: 'creates circle overlays for data values',
  isBaseMap: false,

  /**
   * Function that configures transformation and returns a transformer
   * @param options
   */
  create: (map: Map, options: MapLayerConfig<CircleConfig>, theme: GrafanaTheme2): MapLayerHandler => {
    const config = { ...defaultOptions, ...options.config };

    const vectorLayer = new layer.Vector({});
    return {
      init: () => vectorLayer,
      update: (data: PanelData) => {
        const features: Feature[] = [];
        const dataFrame = data.series[0];
        // Get data values
        const points = dataFrameToPoints(dataFrame, config);

        // TODO: Find better way to find value field
        const values = dataFrame.fields.find(a => a.name === config.fieldMapping.metricField);
        const calcs = reduceField({
          field: values!,
          reducers: [
            ReducerID.min,
            ReducerID.max,
            ReducerID.range,
          ]
        });

        // TODO: don't directly use buffer
        // Map each data value into new points
        values!.values.buffer.map((val: any, i: any) => {
          // Get the circle color for a specific data value depending on color scheme
          const color = dataFrame.fields[0].display!(val).color;
          // Set the opacity determined from user configuration
          var fillColor = tinycolor(color).toRgb();
          fillColor.a = config.opacity;

          // Get circle size from user configuration
          const radius = calcCircleSize(calcs, val, config.minSize, config.maxSize);
          
          const dot = new Feature({
              geometry: points[i],
          });
          dot.setStyle(new style.Style({
            image: new style.Circle({
              stroke: new style.Stroke({
                color: color,
              }),
              fill: new style.Fill({
                color: tinycolor(fillColor).toString(),
              }),
              radius: radius,
            })
          }));
          features.push(dot);
        });

        const vectorSource = new source.Vector({ features });
        vectorLayer.setSource(vectorSource);
      },
    };
  },
  // Circle overlay options
  registerOptionsUI: (builder) => {
    builder
      .addNumberInput({
        path: 'minSize',
        description: 'configures the min circle size',
        name: 'Min Size',
        defaultValue: defaultOptions.minSize,
      })
      .addNumberInput({
        path: 'maxSize',
        description: 'configures the max circle size',
        name: 'Max Size',
        defaultValue: defaultOptions.maxSize,
      })
      .addSliderInput({
        path: 'opacity',
        description: 'configures the amount of transparency',
        name: 'Opacity',
        defaultValue: defaultOptions.opacity,
        settings: {
          min: 0,
          max: 1,
          step: 0.1,
        },
      })
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
      });
  },
  // fill in the default values
  defaultOptions,
};

// Scales the circle size depending on the current data and user defined configurations
function calcCircleSize(calcs: any, value: number, minSize: number, maxSize: number) {
  if (calcs.range === 0) {
    return maxSize;
  }

  const dataFactor = (value - calcs.min) / calcs.max;
  const circleSizeRange = maxSize - minSize;
  return circleSizeRange * dataFactor + minSize;
};
