import * as ChartJS from 'chart.js';

class ColorUtils {

    public static toRGBA ( color: ChartJS.Color, alpha: number = 1 ) : string {
        if ( typeof color === 'string' ) {
            if ( color.startsWith( '#' ) ) {
                const r = parseInt( color.slice( 1, 3 ), 16 );
                const g = parseInt( color.slice( 3, 5 ), 16 );
                const b = parseInt( color.slice( 5, 7 ), 16 );
                return `rgba(${r}, ${g}, ${b}, ${alpha})`;
            } else if ( color.startsWith( 'rgb' ) ) {
                return color.replace( /rgb\(([^)]+)\)/, `rgba($1, ${alpha})` );
            }
            return color;
        }
        return color.toString();
    }

}

declare module 'chart.js' {
    interface ChartTypeRegistry {
        area: {
            chartOptions: ChartJS.LineControllerChartOptions;
            datasetOptions: AreaChartDatasetOptions;
            defaultDataPoint: number | [ number, number ] | null;
            metaExtensions: {};
            parsedDataType: {
                x: number;
                y: number;
            };
            scales: keyof ChartJS.CartesianScaleTypeRegistry;
        };
    }
}

export interface AreaChartDatasetOptions extends ChartJS.LineControllerDatasetOptions {
    color?: ChartJS.Color;
    negativeColor?: ChartJS.Color;
    threshold?: number;
    fillOpacity?: number;
    hoverState?: boolean;
    colorZones?: Array< {
        from: number;
        to: number;
        color: ChartJS.Color;
    } >;
}

export class AreaController extends ChartJS.LineController {

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

ChartJS.registry.addControllers( AreaController );
