import { ColorUtils } from './ColorUtils';
import {
    CartesianScaleTypeRegistry, Color, LineController, LineControllerChartOptions,
    LineControllerDatasetOptions, registry
} from 'chart.js';

declare module 'chart.js' {
    interface ChartTypeRegistry {
        area: {
            chartOptions: LineControllerChartOptions;
            datasetOptions: AreaChartDatasetOptions;
            defaultDataPoint: number | [ number, number ] | null;
            metaExtensions: {};
            parsedDataType: {
                x: number;
                y: number;
            };
            scales: keyof CartesianScaleTypeRegistry;
        };
    }
}

export interface AreaChartDatasetOptions extends LineControllerDatasetOptions {
    color?: Color;
    negativeColor?: Color;
    threshold?: number;
    fillOpacity?: number;
    hoverState?: boolean;
    colorZones?: Array< {
        from: number;
        to: number;
        color: Color;
    } >;
}

export class AreaController extends LineController {

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
        showLine: true,
        fillOpacity: 0.6,
        hoverState: false
    };

    public initialize () : void {
        super.initialize();
        const dataset = this.getDataset() as AreaChartDatasetOptions;

        if ( dataset.color ) {
            dataset.borderColor ||= dataset.color;
            dataset.backgroundColor ||= ColorUtils.toRGBA(
                dataset.color, dataset.fillOpacity ||= 0.6
            );

            if ( ! dataset.hoverState ) {
                dataset.hoverBorderColor ||= dataset.borderColor;
                dataset.hoverBackgroundColor ||= dataset.backgroundColor;
            }
        }
    }

}

registry.addControllers( AreaController );
