import cleanup from 'rollup-plugin-cleanup';
import commonjs from '@rollup/plugin-commonjs';
import resolve from '@rollup/plugin-node-resolve';
import prettier from 'rollup-plugin-prettier';
import terser from '@rollup/plugin-terser';
import typescript from '@rollup/plugin-typescript';

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
    }, {
        file: 'dist/index.umd.min.js',
        format: 'umd',
        sourcemap: true,
        name: 'AreaChartController',
        globals: {
            'chart.js': 'Chart'
        },
        plugins: [
            terser( {
                format: { comments: false },
                compress: { passes: 6 }
            } )
        ]
    } ],
    plugins: [
        cleanup( {
            comments: 'istanbul'
        } ),
        commonjs(),
        resolve(),
        typescript( {
            tsconfig: './tsconfig.json'
        } ),
        prettier( {
            parser: 'babel',
            tabWidth: 2,
            bracketSpacing: true,
            bracketSameLine: true,
            singleQuote: true,
            jsxSingleQuote: true,
            trailingComma: 'none',
            objectWrap: 'collapse'
        } )
    ]
};
