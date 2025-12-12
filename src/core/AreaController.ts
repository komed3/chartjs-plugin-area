import { CartesianScaleTypeRegistry, DatasetController, registry } from 'chart.js';
import { ColorUtils } from './ColorUtils';

declare module 'chart.js' {
    interface ChartTypeRegistry {
        area: {
            chartOptions: {};
            datasetOptions: AreaChartDatasetOptions;
            defaultDataPoint: number;
            metaExtensions: {};
            parsedDataType: {
                x: number;
                y: number;
            };
            scales: keyof CartesianScaleTypeRegistry;
        };
    }
}

export interface AreaChartDatasetOptions {}

export class AreaController extends DatasetController {

    static readonly id = 'area';
    static readonly defaults = {
        datasetElementType: 'line',
        dataElementType: 'point',
        fill: 'origin',
        tension: 0.1,
        borderWidth: 2,
        pointRadius: 3,
        pointHoverRadius: 5,
        threshold: 0,
        fillOpacity: 0.6,
        hoverState: false
    };

    public initialize () : void {
        super.initialize();
        const dataset = this.getDataset();

        if ( dataset.color )
    }

}

registry.addControllers( AreaController );
