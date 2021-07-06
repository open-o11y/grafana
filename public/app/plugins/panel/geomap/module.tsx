import { PanelPlugin } from '@grafana/data';
import { BaseLayerEditor } from './editor/BaseLayerEditor';
import { DataLayersEditor } from './editor/DataLayersEditor';
import { GeomapPanel } from './GeomapPanel';
import { MapViewEditor } from './MapViewEditor';
import { GeomapPanelOptions } from './types';

export const plugin = new PanelPlugin<GeomapPanelOptions>(GeomapPanel)
  .setNoPadding()
  .useFieldConfig()
  .setPanelOptions((builder) => {
    // Nested
    builder.addCustomEditor({
      category: ['Map View'],
      id: 'view',
      path: 'view',
      name: 'Map View',
      editor: MapViewEditor,
    });
    let category = ['Base Layer'];
    builder
      .addCustomEditor({
        category,
        id: 'basemap',
        path: 'basemap',
        name: 'Base Layer',
        editor: BaseLayerEditor,
      })
      .addTextInput({
        category,
        path: 'basemap.config.url',
        name: 'Custom map tile server',
        showIf: (config) => config.basemap.type === 'configurable-server',
      })
      .addTextInput({
        category,
        path: 'basemap.config.attributionName',
        name: 'Custom map tile attritbution name',
        showIf: (config) => config.basemap.type === 'configurable-server',
      })
      .addTextInput({
        category,
        path: 'basemap.config.attributionLink',
        name: 'Custom map tile attritbution link',
        showIf: (config) => config.basemap.type === 'configurable-server',
      });

    category = ['Data Layer'];
    builder
      .addCustomEditor({
        category,
        id: 'layers',
        path: 'layers',
        name: 'Data Layer',
        editor: DataLayersEditor,
      })
      .addNumberInput({
        category,
        path: 'layers[0].config.minSize',
        description: 'configures the min circle size',
        name: 'Min Size',
        defaultValue: 1,
        // TODO: Change to read current layer
        // Currently only allowed one layer and will always be [0]
        showIf: (config) => config.layers[0].type === 'circles',
      })
      .addNumberInput({
        category,
        path: 'layers[0].config.maxSize',
        description: 'configures the max circle size',
        name: 'Max Size',
        defaultValue: 10,
        // TODO: Change to read current layer
        // Currently only allowed one layer and will always be [0]
        showIf: (config) => config.layers[0].type === 'circles',
      })
      .addSliderInput({
        category,
        path: 'layers[0].config.opacity',
        description: 'configures the amount of transparency',
        name: 'Opacity',
        defaultValue: 0.4,
        settings: {
          min: 0,
          max: 1,
          step: 0.1,
        },
        // TODO: Change to read current layer
        // Currently only allowed one layer and will always be [0]
        showIf: (config) => config.layers[0].type === 'circles',
      })
      .addSliderInput({
        category,
        path: 'layers[0].config.radius',
        description: 'configures the cluster size',
        name: 'Radius',
        defaultValue: 10,
        settings: {
          min: 0,
          max: 30,
          step: 1,
        },
        // TODO: Change to read current layer
        // Currently only allowed one layer and will always be [0]
        showIf: (config) => config.layers[0].type === 'heatmap',
      })
      .addSliderInput({
        category,
        path: 'layers[0].config.blur',
        description: 'configures the amount of blur',
        name: 'Blur',
        defaultValue: 20,
        settings: {
          min: 0,
          max: 50,
          step: 1,
        },
        // TODO: Change to read current layer
        // Currently only allowed one layer and will always be [0]
        showIf: (config) => config.layers[0].type === 'heatmap',
      });

    // The controls section
    category = ['Map Controls'];
    builder
      .addBooleanSwitch({
        category,
        path: 'controls.showZoom',
        description: 'show buttons in the upper left',
        name: 'Show zoom control',
        defaultValue: true,
      })
      .addBooleanSwitch({
        category,
        path: 'controls.showAttribution',
        name: 'Show attribution',
        description: 'Show the map source attribution info in the lower right',
        defaultValue: true,
      })
      .addBooleanSwitch({
        category,
        path: 'controls.showScale',
        name: 'Show scale',
        description: 'Indicate map scale',
        defaultValue: false,
      })
      .addBooleanSwitch({
        category,
        path: 'controls.showDebug',
        name: 'Show debug',
        description: 'show map info',
        defaultValue: false,
      });
  });
