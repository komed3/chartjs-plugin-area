export default {
    input: 'src/index.ts',
    external: [ 'chart.js' ],
    output: [ {
        file: 'dist/index.js',
        format: 'es',
        sourcemap: true
    }, {
        file: 'dist/index.umd.js',
        format: 'umd',
        sourcemap: true,
        name: 'AreaChartController',
        globals: {
            'chart.js': 'Chart'
        }
    } ]
};
