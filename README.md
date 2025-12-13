# Chart.js Area Controller

Area chart controller for Chart.js supporting dual-color thresholds and multi-band color zones.

## Installation

Install via npm:

```bash
npm install chartjs-plugin-area
```

### CommonJS (CJS)

```javascript
const { AreaController } = require('chartjs-plugin-area');
```

### UMD (Browser)

```html
<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
<script src="https://cdn.jsdelivr.net/npm/chartjs-plugin-area/dist/index.umd.js"></script>
```

## Usage

Register the AreaController with Chart.js:

```javascript
import { AreaController } from 'chartjs-plugin-area';
import { Chart as ChartJS } from 'chart.js';

ChartJS.register(AreaController);
```

Create an area chart:

```javascript
const chart = new ChartJS(ctx, {
  type: 'area',
  data: {
    labels: ['Jan', 'Feb', 'Mar'],
    datasets: [{
      label: 'Sales',
      data: [10, -5, 20],
      // Dataset options below
    }]
  },
  options: {
    // Chart options
  }
});
```

### Dataset Options

- `color` (ChartJS.Color): Color for positive values.
- `negativeColor` (ChartJS.Color): Color for negative values.
- `threshold` (number, default: 0): Threshold value to separate positive and negative colors.
- `fillOpacity` (number, 0-1, default: 0.6): Opacity for the fill area.
- `hoverState` (boolean, default: false): Enable hover state styling.
- `colorPointsByValue` (boolean, default: true): Color points based on their values.
- `pointOpacity` (number, 0-1, default: 1): Opacity for data points.
- `colorZones` (Array<AreaChartColorZone>): Array of color zones for dynamic coloring.

#### AreaChartColorZone

- `from` (number): Starting value of the zone.
- `to` (number): Ending value of the zone.
- `color` (ChartJS.Color): Color associated with the zone.
- `opacity` (number, optional, 0-1): Opacity for the zone.

### Examples

#### Dual-Color Threshold

```javascript
datasets: [{
  data: [10, -5, 20],
  color: 'green',
  negativeColor: 'red',
  threshold: 0
}]
```

#### Multi-Band Color Zones

```javascript
datasets: [{
  data: [10, 50, 30],
  colorZones: [
    { from: 0, to: 20, color: 'green' },
    { from: 20, to: 40, color: 'yellow' },
    { from: 40, to: 60, color: 'red' }
  ]
}]
```

## License

MIT LICENSE // © 2025 PAUL KÖHLER (KOMED3)
