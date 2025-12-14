# Chart.js Area Controller

Area chart controller for Chart.js supporting dual-color thresholds and multi-band color zones.

## Installation

Install via npm:

```bash
npm install chartjs-plugin-area
```

**CommonJS (CJS)**

```js
const { AreaController } = require( 'chartjs-plugin-area' );
```

**UMD (Browser)**

```html
<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
<script src="https://cdn.jsdelivr.net/npm/chartjs-plugin-area/dist/index.umd.min.js"></script>
```

## Usage

```js
const chart = new ChartJS( ctx, {
  type: 'area',
  data: {
    labels: [ 'Jan', 'Feb', 'Mar', ... ],
    datasets: [ {
      label: 'Sales',
      data: [ 10, -5, 20, ... ],
      // Dataset options below
    } ]
  },
  options: {
    // Chart options
  }
} );
```

### Dataset Options

- **`color`** `< ChartJS.Color >` – Color for positive values.
- **`negativeColor`** `< ChartJS.Color >` – Color for negative values.
- **`threshold`** `< number, default: 0 >` – Threshold value to separate positive and negative colors.
- **`fill`** `< boolean, 'origin', 'start', 'end', default: 'origin' >` – Fill area under the line.
- **`fillOpacity`** `< number, 0-1, default: 0.6 >` – Opacity for the fill area.
- **`hoverState`** `< boolean, default: false >` – Enable hover state styling.
- **`hidePoints`** `< boolean, default: false >` – Hide data points on the chart.
- **`colorPointsByValue`** `< boolean, default: true >` – Color points based on their values.
- **`pointOpacity`** `< number, 0-1, default: 1 >` – Opacity for data points.
- **`colorZones`** `< AreaChartColorZone[] >` – Array of color zones for dynamic coloring.
- **`smoothGradient`** `< boolean, default: false >` – Whether to apply smooth gradient transitions between zones.

**AreaChartColorZone**

- **`from`** `< number >` – Starting value of the zone.
- **`to`** `< number >` – Ending value of the zone.
- **`color`** `< ChartJS.Color >` – Color associated with the zone.
- **`opacity`** `< number, optional, 0-1 >` – Opacity for the zone.

### Examples

**Dual-Color Threshold**

```js
datasets: [ {
  data: [ 10, -5, 20 ],
  color: '#4ecdc4',
  negativeColor: '#ff6b6b',
  threshold: 0
} ]
```

**Multi-Band Color Zones**

```js
datasets: [ {
  data: [ 10, 50, 30 ],
  colorZones: [
    { from: 0, to: 20, color: '#4ecdc4' },
    { from: 20, to: 40, color: '#ffdd59' },
    { from: 40, to: 60, color: '#ff6b6b' }
  ]
} ]
```

## License

Source code is licensed unter the **MIT LICENSE**  
Visit project at https://github.com/komed3/chartjs-plugin-area  
**© 2025 Paul Köhler ([komed3](https://github.com/komed3))**
