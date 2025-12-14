import * as ChartJS from 'chart.js';

/**
 * Defines a color zone for the Area chart.
 */
export interface AreaChartColorZone {
    /** Starting value of the zone */
    from: number;
    /** Ending value of the zone */
    to: number;
    /** Color associated with the zone */
    color: ChartJS.Color;
    /** Optional opacity for the zone (0-1) */
    opacity?: number;
}

/**
 * Extended dataset options for the Area chart controller.
 */
export interface AreaChartDatasetOptions extends ChartJS.LineControllerDatasetOptions {
    /** Color for positive values */
    color?: ChartJS.Color;
    /** Color for negative values */
    negativeColor?: ChartJS.Color;
    /** Threshold value to separate positive and negative colors (default: 0) */
    threshold?: number;
    /** Opacity for the fill area (0-1, default: 0.6) */
    fillOpacity?: number;
    /** Whether to enable hover state styling (default: false) */
    hoverState?: boolean;
    /** Whether to color points based on their values (default: true) */
    colorPointsByValue?: boolean;
    /** Opacity for the data points (0-1, default: 1) */
    pointOpacity?: number;
    /** Array of color zones for dynamic coloring */
    colorZones?: Array< AreaChartColorZone >;
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
            parsedDataType: { x: number; y: number };
            scales: keyof ChartJS.CartesianScaleTypeRegistry;
        };
    }
}

/**
 * Utility class for color manipulation and gradient creation in Chart.js plugins.
 */
class ColorUtils {

    /** Regular expressions for color formats */
    private static readonly RGB = /^rgba?\(\s*(\d{1,3}(?:\.\d+)?)\s*(?:,\s*|\s+)\s*(\d{1,3}(?:\.\d+)?)\s*(?:,\s*|\s+)\s*(\d{1,3}(?:\.\d+)?)\s*(?:,\s*|\s+)?(?:\s*\/?\s*([\d.]+%?)\s*)?\)$/i;
    private static readonly HSL = /^hsla?\(\s*([-+]?\d{1,3}(?:\.\d+)?)(deg|grad|rad)?\s*(?:,\s*|\s+)\s*([-+]?\d{1,3}(?:\.\d+)?)%\s*(?:,\s*|\s+)\s*([-+]?\d{1,3}(?:\.\d+)?)%\s*(?:,\s*|\s+)?(?:\s*\/?\s*([\d.]+%?)\s*)?\)$/i;
    private static readonly HEX34 = /^#([a-f\d])([a-f\d])([a-f\d])([a-f\d])?$/i;
    private static readonly HEX68 = /^#([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})?$/i;

    /**
     * Parse colors and injects alpha channel into RGB(A) or HSL(A) color strings.
     * @param color - The input color string
     * @param as - The output format ('rgba' or 'hsla')
     * @param re - The regular expression to match the color format
     * @param alpha - The alpha value to inject (0-1)
     * @param isHex - Whether the color components are in hexadecimal format
     * @returns The color string with injected alpha or undefined if no match
     */
    private static parseColor (
        color: string,
        as: 'rgba' | 'hsla',
        re: RegExp,
        alpha: number = 1,
        isHex: boolean = false
    ) : string | undefined {
        const match = color.trim().match( re );
        if ( match ) return `${as}(${ match.slice( 1, 4 ).map(
            v => isHex ? parseInt( v.length === 1 ? v + v : v, 16 ) : v
        ).join( ',' ) },${ match.slice( 4, 5 )[ 0 ] ?? alpha })`;
    }

    /**
     * Normalizes position to 0-1 range within chart area.
     * @param y - The data value
     * @param scale - The chart scale
     * @param chartArea - The chart area
     * @returns Normalized position (0-1)
     */
    private static normalizePosition (
        y: number,
        scale: ChartJS.Scale,
        chartArea: ChartJS.ChartArea
    ) : number {
        const range = chartArea.bottom - chartArea.top;
        return range <= 0 ? 0 : Math.max( 0, Math.min( 1,
            ( scale.getPixelForValue( y ) - chartArea.top ) / range
        ) );
    }

    /**
     * Converts a color to RGBA/HSLA format with specified alpha.
     * @param color - The input color (string or Chart.js Color object)
     * @param alpha - The alpha value (0-1)
     * @returns The color in RGBA/HSLA string format
     */
    public static color (
        color: ChartJS.Color,
        alpha: number = 1
    ) : string {
        if ( typeof color !== 'string' ) return String( color );
        let res: string | undefined;
        if ( res = ColorUtils.parseColor( color, 'rgba', ColorUtils.RGB, alpha ) ) return res;
        if ( res = ColorUtils.parseColor( color, 'hsla', ColorUtils.HSL, alpha ) ) return res;
        if ( res = ColorUtils.parseColor( color, 'rgba', ColorUtils.HEX34, alpha, true ) ) return res;
        if ( res = ColorUtils.parseColor( color, 'rgba', ColorUtils.HEX68, alpha, true ) ) return res;
        return color;
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
        zones: Array< AreaChartColorZone >,
        fillOpacity: number = 1
    ) : CanvasGradient {
        const gradient = ctx.createLinearGradient( 0, chartArea.top, 0, chartArea.bottom );
        const sortedZones = [ ...zones ].sort( ( a, b ) => b.from - a.from );

        sortedZones.forEach( zone => {
            const start = ColorUtils.normalizePosition( zone.from, scale, chartArea );
            const end = ColorUtils.normalizePosition( zone.to, scale, chartArea );
            if ( start === end ) return;

            const color = ColorUtils.color( zone.color, zone.opacity ?? fillOpacity );
            gradient.addColorStop( start, color );
            gradient.addColorStop( end, color );
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
        return ColorUtils.createMultiBandGradient( ctx, chartArea, scale, [
            { from: +Infinity, to: threshold, color },
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
        zones?: Array< AreaChartColorZone >,
        color?: ChartJS.Color,
        negativeColor?: ChartJS.Color,
        threshold: number = 0
    ) : ChartJS.Color | undefined {
        for ( const z of zones ?? [] ) if ( value >= z.from && value <= z.to ) return z.color;
        return value < threshold && negativeColor ? negativeColor : color;
    }

}

/**
 * Controller for rendering area charts with dynamic coloring based on value zones or thresholds.
 */
export class AreaController extends ChartJS.LineController {

    /** Chart.js controller identifier */
    static readonly id = 'area';

    /** Default dataset options for the Area chart */
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

    /** Extended dataset options specific to Area chart */
    protected dataset!: AreaChartDatasetOptions;

    /**
     * Initializes the controller and merges dataset options.
     */
    public initialize() : void {
        super.initialize();
        this.dataset = {
            ...AreaController.defaults,
            ...this.getDataset()
        } as AreaChartDatasetOptions;
    }

    /**
     * Applies gradient or solid colors to line and background.
     * Allows for user overrides for borderColor and backgroundColor.
     * @param line - The line element
     * @param ctx - The canvas rendering context
     * @param chartArea - The chart area dimensions
     * @param scale - The scale used for value-to-pixel conversion
     */
    private applyLineColors (
        line: any,
        ctx: CanvasRenderingContext2D,
        chartArea: ChartJS.ChartArea,
        scale: ChartJS.Scale
    ) : void {
        const { color, negativeColor, colorZones, fillOpacity = 0.6, threshold = 0 } = this.dataset;
        const set = ( key: 'borderColor' | 'backgroundColor', fn: Function, ...args: any[] ) => {
            if ( this.dataset[ key ] == null ) line.options[ key ] = fn( ...args );
        };

        if ( colorZones ) {
            const args = [ ctx, chartArea, scale, colorZones ];
            set( 'borderColor', ColorUtils.createMultiBandGradient, ...args, 1 );
            set( 'backgroundColor', ColorUtils.createMultiBandGradient, ...args, fillOpacity );
        }
        else if ( color && negativeColor ) {
            const args = [ ctx, chartArea, scale, color, negativeColor, threshold ];
            set( 'borderColor', ColorUtils.createThresholdGradient, ...args, 1 );
            set( 'backgroundColor', ColorUtils.createThresholdGradient, ...args, fillOpacity );
        }
        else if ( color ) {
            set( 'borderColor', ColorUtils.color, color );
            set( 'backgroundColor', ColorUtils.color, color, fillOpacity );
        }
    }

    /**
     * Creates a color resolver function for points based on their values.
     * @param isBackground - Whether to resolve background color (true) or border color (false)
     * @returns A function that resolves color based on point context
     */
    private createPointColorResolver (
        isBackground: boolean
    ) : ( ctx: any ) => string | undefined {
        const { colorZones, color, negativeColor, threshold = 0, pointOpacity = 1 } = this.dataset;
        const opacity = isBackground ? pointOpacity : 1;

        return ( ctx: any ) => {
            const y = ctx.parsed?.y;
            if ( y == null ) return undefined;
            const resolvedColor = ColorUtils.getColorForValue( y, colorZones, color, negativeColor, threshold );
            return resolvedColor ? ColorUtils.color( resolvedColor, opacity ) : undefined;
        };
    }

    /**
     * Applies point coloring based on values.
     */
    private applyPointColors () : void {
        const ds = this.getDataset() as AreaChartDatasetOptions;
        const bgColorResolver = this.createPointColorResolver( true );
        const borderColorResolver = this.createPointColorResolver( false );

        ds.pointBackgroundColor = bgColorResolver;
        ds.pointBorderColor = borderColorResolver;
        ds.pointHoverBackgroundColor = bgColorResolver;
        ds.pointHoverBorderColor = borderColorResolver;
    }

    public update ( mode: ChartJS.UpdateMode ) : void {
        super.update( mode );

        const meta = this.getMeta();
        const yAxisID = meta.yAxisID || 'y';
        const scale = this.getScaleForId( yAxisID );
        const line = meta.dataset;

        if ( ! scale || ! line ) return;

        line.options = this.resolveDatasetElementOptions( mode );

        // Hide line if showLine is false
        if ( this.dataset.showLine === false ) line.options.borderWidth = 0;

        // Apply line and background colors
        if ( this.dataset.negativeColor || this.dataset.colorZones || this.dataset.color ) {
            const { ctx, chartArea } = this.chart;
            this.applyLineColors( line, ctx, chartArea, scale );
        }

        // Apply point colors based on values
        if ( this.dataset.colorPointsByValue ) this.applyPointColors();
    }
}

/**
 * Register the AreaController with Chart.js
 */
ChartJS.registry.addControllers( AreaController );
