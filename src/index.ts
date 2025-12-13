import * as ChartJS from 'chart.js';

/**
 * Utility class for color manipulation and gradient creation in Chart.js plugins.
 */
class ColorUtils {

    /**
     * Converts a color to RGBA format with specified alpha.
     * @param color - The input color (string or Chart.js Color object)
     * @param alpha - The alpha value (0-1)
     * @returns The color in RGBA string format
     */
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

    /**
     * Creates a multi-band linear gradient based on value zones.
     * @param ctx - The canvas rendering context
     * @param chartArea - The chart area dimensions
     * @param scale - The scale used for value-to-pixel conversion
     * @param zones - Array of zones with from, to, and color
     * @param fillOpacity - Opacity for the fill (0-1)
     * @returns The created linear gradient
     */
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

    /**
     * Creates a threshold-based gradient for positive and negative values.
     * @param ctx - The canvas rendering context
     * @param chartArea - The chart area dimensions
     * @param scale - The scale used for value-to-pixel conversion
     * @param color - Color for positive values
     * @param negativeColor - Color for negative values
     * @param threshold - The threshold value
     * @param fillOpacity - Opacity for the fill (0-1)
     * @returns The created linear gradient
     */
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

    /**
     * Determines the color for a given value based on zones or threshold.
     * @param value - The value to check
     * @param zones - Array of color zones
     * @param color - Default positive color
     * @param negativeColor - Default negative color
     * @param threshold - Threshold for positive/negative
     * @returns The appropriate color
     */
    public static getColorForValue (
        value: number,
        zones?: Array< { from: number; to: number; color: ChartJS.Color } >,
        color?: ChartJS.Color,
        negativeColor?: ChartJS.Color,
        threshold: number = 0
    ) : ChartJS.Color | undefined {
        if ( zones ) { for ( const zone of zones ) {
            if ( value >= zone.from && value <= zone.to ) return zone.color;
        } }
        return negativeColor && value < threshold ? negativeColor : color;
    }

}

/**
 * Declare the Area chart type in Chart.js registry.
 */
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

/**
 * Extended dataset options for the Area chart controller.
 * Supports color zones, thresholds, and point coloring based on values.
 */
export interface AreaChartDatasetOptions extends ChartJS.LineControllerDatasetOptions {
    /** Default color for positive values or zones */
    color?: ChartJS.Color;
    /** Color for negative values when using threshold mode */
    negativeColor?: ChartJS.Color;
    /** Threshold value for positive/negative coloring */
    threshold?: number;
    /** Opacity for the fill area (0-1) */
    fillOpacity?: number;
    /** Whether to apply hover state colors */
    hoverState?: boolean;
    /** Whether to color points based on their value */
    colorPointsByValue?: boolean;
    /** Opacity for point colors (0-1) */
    pointOpacity?: number;
    /** Array of color zones for multi-band coloring */
    colorZones?: Array< {
        from: number;
        to: number;
        color: ChartJS.Color;
    } >;
}

/**
 * Controller for rendering area charts with dynamic coloring based on value zones or thresholds.
 * Extends the LineController to provide filled areas with gradient colors.
 */
export class AreaController extends ChartJS.LineController {

    /** Unique identifier for the Area chart controller. */
    static readonly id = 'area';

    /** Default dataset options for the Area chart controller. */
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
        hoverState: false,
        colorPointsByValue: true,
        pointOpacity: 1
    };

    /** Dataset options specific to the Area chart controller. */
    protected dataset!: AreaChartDatasetOptions;

    /**
     * Initializes the controller and sets up default colors.
     */
    public initialize () : void {
        super.initialize();

        this.dataset = {
            ...AreaController.defaults,
            ...this.getDataset()
        } as AreaChartDatasetOptions;

        if ( this.dataset.showLine === false ) this.dataset.borderWidth = 0;
        if ( this.dataset.color ) {
            this.dataset.borderColor ||= this.dataset.color;
            this.dataset.backgroundColor ||= ColorUtils.toRGBA(
                this.dataset.color, this.dataset.fillOpacity ||= 0.6
            );

            if ( ! this.dataset.hoverState ) {
                this.dataset.hoverBorderColor ||= this.dataset.borderColor;
                this.dataset.hoverBackgroundColor ||= this.dataset.backgroundColor;
            }
        }
    }

    /**
     * Updates the chart elements, applying gradients and point colors.
     * @param mode - The update mode
     */
    public update ( mode: 'default' | 'resize' | 'active' | 'hide' | 'show' | 'none' | 'reset' ) : void {
        super.update( mode );

        const meta = this.getMeta();
        const yAxisID = meta.yAxisID || 'y';
        const scale = this.getScaleForId( yAxisID );

        if ( ! scale ) return;
    
        const line = meta.dataset;
        if ( line ) {
            line.options = this.resolveDatasetElementOptions( mode );

            if ( this.dataset.negativeColor || this.dataset.colorZones ) {
                const chart = this.chart;
                const chartArea = chart.chartArea;
                const ctx = chart.ctx;

                if ( this.dataset.colorZones ) {
                    line.options.borderColor = ColorUtils.createMultiBandGradient(
                        ctx, chartArea, scale, this.dataset.colorZones, 1
                    );
                    line.options.backgroundColor = ColorUtils.createMultiBandGradient(
                        ctx, chartArea, scale, this.dataset.colorZones, this.dataset.fillOpacity || 0.6
                    );
                } else if ( this.dataset.color && this.dataset.negativeColor ) {
                    line.options.borderColor = ColorUtils.createThresholdGradient(
                        ctx, chartArea, scale, this.dataset.color, this.dataset.negativeColor,
                        this.dataset.threshold || 0, 1
                    );
                    line.options.backgroundColor = ColorUtils.createThresholdGradient(
                        ctx, chartArea, scale, this.dataset.color, this.dataset.negativeColor,
                        this.dataset.threshold || 0, this.dataset.fillOpacity || 0.6
                    );
                }
            }
        }

        meta.data.forEach( ( point: any, index ) => {
            point.options = this.resolveDataElementOptions( index, mode );

            if ( this.dataset.colorPointsByValue ) {
                const parsed = this.getParsed( index ) as { y: number };
                const pointColor = ColorUtils.getColorForValue(
                    parsed.y, this.dataset.colorZones, this.dataset.color,
                    this.dataset.negativeColor, this.dataset.threshold || 0
                );

                if ( pointColor ) {
                    const rgbaColor = ColorUtils.toRGBA( pointColor, this.dataset.pointOpacity || 1 );
                    const rgbaBorder = ColorUtils.toRGBA( pointColor, 1 );

                    point.options = { ...point.options,
                        backgroundColor: rgbaColor, borderColor: rgbaBorder,
                        hoverBackgroundColor: this.dataset.hoverState
                            ? point.options.hoverBackgroundColor : rgbaColor,
                        hoverBorderColor: this.dataset.hoverState
                            ? point.options.hoverBorderColor : rgbaBorder
                    };
                }
            }
        } );
    }

}

/**
 * Register the AreaController with Chart.js
 */
ChartJS.registry.addControllers( AreaController );
