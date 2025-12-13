import * as ChartJS from 'chart.js';

/**
 * Utility class for color manipulation and gradient creation in Chart.js plugins.
 */
class ColorUtils {

    /**
     * Converts a color to RGBA format with specified alpha.
     */
    public static toRGBA(color: ChartJS.Color, alpha: number = 1): string {
        if (typeof color !== 'string') return color.toString();

        if (color.startsWith('#')) {
            const [r, g, b] = [1, 3, 5].map(i => parseInt(color.slice(i, i + 2), 16));
            return `rgba(${r}, ${g}, ${b}, ${alpha})`;
        }

        if (color.startsWith('rgb')) {
            return color.replace(/rgba?\(([^)]+)\)/, `rgba($1, ${alpha})`);
        }

        return color;
    }

    /**
     * Normalizes position to 0-1 range within chart area.
     */
    private static normalizePosition(pixel: number, chartArea: ChartJS.ChartArea): number {
        const range = chartArea.bottom - chartArea.top;
        return Math.max(0, Math.min(1, (pixel - chartArea.top) / range));
    }

    /**
     * Creates a multi-band linear gradient based on value zones.
     */
    public static createMultiBandGradient(
        ctx: CanvasRenderingContext2D,
        chartArea: ChartJS.ChartArea,
        scale: ChartJS.Scale,
        zones: Array<{ from: number; to: number; color: ChartJS.Color }>,
        fillOpacity: number = 1
    ): CanvasGradient {
        const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
        const sortedZones = [...zones].sort((a, b) => b.from - a.from);

        sortedZones.forEach(zone => {
            const startPos = this.normalizePosition(scale.getPixelForValue(zone.from), chartArea);
            const endPos = this.normalizePosition(scale.getPixelForValue(zone.to), chartArea);

            const color = this.toRGBA(zone.color, fillOpacity);
            gradient.addColorStop(startPos, color);
            gradient.addColorStop(endPos, color);
        });

        return gradient;
    }

    /**
     * Creates a threshold-based gradient for positive and negative values.
     */
    public static createThresholdGradient(
        ctx: CanvasRenderingContext2D,
        chartArea: ChartJS.ChartArea,
        scale: ChartJS.Scale,
        color: ChartJS.Color,
        negativeColor: ChartJS.Color,
        threshold: number = 0,
        fillOpacity: number = 1
    ): CanvasGradient {
        return this.createMultiBandGradient(ctx, chartArea, scale, [
            { from: +Infinity, to: threshold, color },
            { from: threshold, to: -Infinity, color: negativeColor }
        ], fillOpacity);
    }

    /**
     * Determines the color for a given value based on zones or threshold.
     */
    public static getColorForValue(
        value: number,
        zones?: Array<{ from: number; to: number; color: ChartJS.Color }>,
        color?: ChartJS.Color,
        negativeColor?: ChartJS.Color,
        threshold: number = 0
    ): ChartJS.Color | undefined {
        if (zones) {
            for (const zone of zones) {
                if (value >= zone.from && value <= zone.to) return zone.color;
            }
        }
        return value < threshold ? negativeColor : color;
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
            defaultDataPoint: number | [number, number] | null;
            metaExtensions: {};
            parsedDataType: { x: number; y: number };
            scales: keyof ChartJS.CartesianScaleTypeRegistry;
        };
    }
}

/**
 * Extended dataset options for the Area chart controller.
 */
export interface AreaChartDatasetOptions extends ChartJS.LineControllerDatasetOptions {
    color?: ChartJS.Color;
    negativeColor?: ChartJS.Color;
    threshold?: number;
    fillOpacity?: number;
    hoverState?: boolean;
    colorPointsByValue?: boolean;
    pointOpacity?: number;
    colorZones?: Array<{ from: number; to: number; color: ChartJS.Color }>;
}

/**
 * Controller for rendering area charts with dynamic coloring based on value zones or thresholds.
 */
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
        hoverState: false,
        colorPointsByValue: true,
        pointOpacity: 1
    };

    protected dataset!: AreaChartDatasetOptions;

    public initialize(): void {
        super.initialize();
        this.dataset = {
            ...AreaController.defaults,
            ...this.getDataset()
        } as AreaChartDatasetOptions;
    }

    /**
     * Applies gradient or solid colors to line and background.
     */
    private applyLineColors(
        line: any,
        ctx: CanvasRenderingContext2D,
        chartArea: ChartJS.ChartArea,
        scale: ChartJS.Scale
    ): void {
        const { color, negativeColor, colorZones, fillOpacity = 0.6 } = this.dataset;

        if (colorZones) {
            const gradient = ColorUtils.createMultiBandGradient(ctx, chartArea, scale, colorZones, 1);
            line.options.borderColor = gradient;
            line.options.backgroundColor = ColorUtils.createMultiBandGradient(
                ctx, chartArea, scale, colorZones, fillOpacity
            );
        } else if (color && negativeColor) {
            const gradient = ColorUtils.createThresholdGradient(
                ctx, chartArea, scale, color, negativeColor, this.dataset.threshold || 0, 1
            );
            line.options.borderColor = gradient;
            line.options.backgroundColor = ColorUtils.createThresholdGradient(
                ctx, chartArea, scale, color, negativeColor, this.dataset.threshold || 0, fillOpacity
            );
        } else if (color) {
            line.options.borderColor = color;
            line.options.backgroundColor = ColorUtils.toRGBA(color, fillOpacity);
        }
    }

    /**
     * Creates a color resolver function for points based on their values.
     */
    private createPointColorResolver(
        isBackground: boolean
    ): (ctx: any) => string | undefined {
        const { colorZones, color, negativeColor, threshold = 0, pointOpacity = 1 } = this.dataset;
        const opacity = isBackground ? pointOpacity : 1;

        return (ctx: any) => {
            const y = ctx.parsed?.y;
            if (y == null) return undefined;

            const resolvedColor = ColorUtils.getColorForValue(y, colorZones, color, negativeColor, threshold);
            return resolvedColor ? ColorUtils.toRGBA(resolvedColor, opacity) : undefined;
        };
    }

    /**
     * Applies point coloring based on values.
     */
    private applyPointColors(ds: AreaChartDatasetOptions): void {
        const bgColorResolver = this.createPointColorResolver(true);
        const borderColorResolver = this.createPointColorResolver(false);

        ds.pointBackgroundColor = bgColorResolver;
        ds.pointBorderColor = borderColorResolver;
        ds.pointHoverBackgroundColor = bgColorResolver;
        ds.pointHoverBorderColor = borderColorResolver;
    }

    public update(mode: ChartJS.UpdateMode): void {
        super.update(mode);

        const meta = this.getMeta();
        const yAxisID = meta.yAxisID || 'y';
        const scale = this.getScaleForId(yAxisID);
        const line = meta.dataset;

        if (!scale || !line) return;

        line.options = this.resolveDatasetElementOptions(mode);

        if (this.dataset.showLine === false) {
            line.options.borderWidth = 0;
        }

        // Apply line and background colors
        if (this.dataset.negativeColor || this.dataset.colorZones || this.dataset.color) {
            const { ctx, chartArea } = this.chart;
            this.applyLineColors(line, ctx, chartArea, scale);
        }

        // Apply point colors based on values
        if (this.dataset.colorPointsByValue) {
            const ds = this.getDataset() as AreaChartDatasetOptions;
            this.applyPointColors(ds);
        }
    }
}

/**
 * Register the AreaController with Chart.js
 */
ChartJS.registry.addControllers(AreaController);
