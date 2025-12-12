import typescript from '@rollup/plugin-typescript';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';

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
    } ],
    plugins: [
        resolve(), commonjs(),
        typescript( { tsconfig: './tsconfig.json' } )
    ]
};
