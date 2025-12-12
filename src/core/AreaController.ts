import { DatasetController, registry } from 'chart.js';
import { ColorUtils } from './ColorUtils';

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
    }

}

registry.addControllers( AreaController );
