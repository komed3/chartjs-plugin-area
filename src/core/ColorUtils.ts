import { Color } from 'chart.js';

export class ColorUtils {

    public static toRGBA ( color: Color, alpha: number = 1 ) : string {
        if ( typeof color === 'string' ) {
            if ( color.startsWith( '#' ) ) {
                const r = parseInt( color.slice( 1, 3 ), 16 );
                const g = parseInt( color.slice( 3, 5 ), 16 );
                const b = parseInt( color.slice( 5, 7 ), 16 );
                return `rgba(${r}, ${g}, ${b}, ${alpha})`;
            } else if ( color.startsWith( 'rgb' ) ) {
                return color.replace( /rgb\(([^)]+)\)/, `rgba($1, ${alpha})` );
            }
            return color;
        }
        return color.toString();
    }

}
