import { PanelPlugin } from '@grafana/data';
import { BaseLayerEditor } from './editor/BaseLayerEditor';
import { DataLayersEditor } from './editor/DataLayersEditor';
import { GeomapPanel } from './GeomapPanel';
import { MapCenterEditor } from './editor/MapCenterEditor';
import { defaultView, GeomapPanelOptions } from './types';
import { MapZoomEditor } from './editor/MapZoomEditor';
import { mapPanelChangedHandler } from './migrations';

export const plugin = new PanelPlugin<GeomapPanelOptions>(GeomapPanel)
  .setNoPadding()
  .setPanelChangeHandler(mapPanelChangedHandler)
  .useFieldConfig()
  .setPanelOptions((builder) => {
    let category = ['Map View'];
    builder.addCustomEditor({
      category,
      id: 'view.center',
      path: 'view.center',
      name: 'Center',
      editor: MapCenterEditor,
      defaultValue: defaultView.center,
    });

    builder.addCustomEditor({
      category,
      id: 'view.zoom',
      path: 'view.zoom',
      name: 'Initial zoom',
      editor: MapZoomEditor,
      defaultValue: defaultView.zoom,
    });

    builder.addBooleanSwitch({
      category,
      path: 'view.shared',
      description: 'Use the same view across multiple panels.  Note: this may require a dashboard reload.',
      name: 'Share view',
      defaultValue: defaultView.shared,
    });

    // Nested
    builder.addCustomEditor({
      category: ['Base Layer'],
      id: 'basemap',
      path: 'basemap',
      name: 'Base Layer',
      editor: BaseLayerEditor,
    });

    // Data layer section
    category = ['Data Layer'];
    builder
      .addCustomEditor({
        category,
        id: 'layers',
        path: 'layers',
        name: 'Data Layer',
        editor: DataLayersEditor,
      })
      .addSelect({
        category,
        path: 'layers[0].config.fieldMapping.queryFormat',
        name: 'Query Format',
        defaultValue: 'coordinates',
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
        showIf: (config) => config.layers[0].type === 'circles',
      })
      .addTextInput({
        category,
        path: 'layers[0].config.fieldMapping.metricField',
        name: 'Metric Field',
        defaultValue: '',
        showIf: (config) => config.layers[0].type === 'circles',
      })
      .addTextInput({
        category,
        path: 'layers[0].config.fieldMapping.latitudeField',
        name: 'Latitude Field',
        defaultValue: '',
        showIf: (config) =>
          config.layers[0].config?.fieldMapping.queryFormat === 'coordinates' && config.layers[0].type === 'circles',
      })
      .addTextInput({
        category,
        path: 'layers[0].config.fieldMapping.longitudeField',
        name: 'Longitude Field',
        defaultValue: '',
        showIf: (config) =>
          config.layers[0].config?.fieldMapping.queryFormat === 'coordinates' && config.layers[0].type === 'circles',
      })
      .addTextInput({
        category,
        path: 'layers[0].config.fieldMapping.geohashField',
        name: 'Geohash Field',
        defaultValue: '',
        showIf: (config) =>
          config.layers[0].config?.fieldMapping.queryFormat === 'geohash' && config.layers[0].type === 'circles',
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
        path: 'controls.mouseWheelZoom',
        name: 'Mouse wheel zoom',
        defaultValue: true,
      })
      .addBooleanSwitch({
        category,
        path: 'controls.showLegend',
        name: 'Show legend',
        description: 'Show legend',
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
