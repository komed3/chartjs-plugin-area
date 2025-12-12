import { DatasetController, registry } from 'chart.js';

export class AreaController extends DatasetController {

    public static readonly id = 'area';

    public initialize () : void {
        super.initialize();
    }

}

registry.addControllers( AreaController );
