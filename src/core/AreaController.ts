import { DatasetController, registry } from 'chart.js';
import { ColorUtils } from './ColorUtils';

export class AreaController extends DatasetController {

    public static readonly id = 'area';

    public initialize () : void {
        super.initialize();
    }

}

registry.addControllers( AreaController );
