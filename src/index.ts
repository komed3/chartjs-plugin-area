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

    public static createMultiBandGradient (
        ctx: CanvasRenderingContext2D,
        chartArea: ChartJS.ChartArea,
        scale: ChartJS.Scale,
        zones: Array< { from: number; to: number; color: ChartJS.Color } >,
        fillOpacity: number = 1
    ) : CanvasGradient {
        const gradient = ctx.createLinearGradient( 0, chartArea.top, 0, chartArea.bottom );
        const sortedZones = [ ...zones ].sort( ( a, b ) => b.from - a.from );

        sortedZones.forEach( zone => {
            const startY = scale.getPixelForValue( zone.from );
            const endY = scale.getPixelForValue( zone.to );

            const startPosition = Math.max( 0, Math.min( 1,
                ( startY - chartArea.top ) / ( chartArea.bottom - chartArea.top )
            ) );
            const endPosition = Math.max( 0, Math.min( 1,
                ( endY - chartArea.top ) / ( chartArea.bottom - chartArea.top )
            ) );

            gradient.addColorStop( startPosition, this.toRGBA( zone.color, fillOpacity ) );
            gradient.addColorStop( endPosition, this.toRGBA( zone.color, fillOpacity ) );
        } );

        return gradient;
    }

    public static createThresholdGradient (
        ctx: CanvasRenderingContext2D,
        chartArea: ChartJS.ChartArea,
        scale: ChartJS.Scale,
        color: ChartJS.Color,
        negativeColor: ChartJS.Color,
        threshold: number = 0,
        fillOpacity: number = 1
    ) : CanvasGradient {
        return this.createMultiBandGradient( ctx, chartArea, scale, [
            { from: +Infinity, to: threshold, color: color },
            { from: threshold, to: -Infinity, color: negativeColor }
        ], fillOpacity );
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

    public update ( mode: 'default' | 'resize' | 'active' | 'hide' | 'show' | 'none' | 'reset' ) : void {
        super.update( mode );

        const meta = this.getMeta();
        const dataset = this.getDataset() as AreaChartDatasetOptions;
        const yAxisID = meta.yAxisID || 'y';
        const scale = this.getScaleForId( yAxisID );

        if ( ! scale ) return;
    
        const line = meta.dataset;
        if ( line ) {
            line.options = this.resolveDatasetElementOptions( mode );

            if ( dataset.negativeColor || dataset.colorZones ) {
                const chart = this.chart;
                const chartArea = chart.chartArea;
                const ctx = chart.ctx;

                if ( dataset.colorZones ) {
                    line.options.borderColor = ColorUtils.createMultiBandGradient(
                        ctx, chartArea, scale, dataset.colorZones, 1
                    );
                    line.options.backgroundColor = ColorUtils.createMultiBandGradient(
                        ctx, chartArea, scale, dataset.colorZones, dataset.fillOpacity || 0.6
                    );
                } else if ( dataset.color && dataset.negativeColor ) {
                    line.options.borderColor = ColorUtils.createThresholdGradient(
                        ctx, chartArea, scale, dataset.color, dataset.negativeColor,
                        dataset.threshold || 0, 1
                    );
                    line.options.backgroundColor = ColorUtils.createThresholdGradient(
                        ctx, chartArea, scale, dataset.color, dataset.negativeColor,
                        dataset.threshold || 0, dataset.fillOpacity || 0.6
                    );
                }
            }
        }
    }

}

ChartJS.registry.addControllers( AreaController );
