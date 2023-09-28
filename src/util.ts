import path from 'path'
// import { Message } from 'esbuild'
import { parse } from 'vue/compiler-sfc'

export function resolvePath(filePath: string) {
    const [filename, query] = filePath.split('?', 2)
    const dirname = path.dirname(filename)
    return [filename, dirname, query]
}

type ParseErrors = ReturnType<typeof parse>['errors']
export function convertErrors(errors: ParseErrors, filename: string) {
    const convert = (e: ParseErrors[number]) => {
        let location = null
        if ('loc' in e && Object.prototype.hasOwnProperty.call(e, 'loc')) {
            const start = e.loc!.start
            const lineText = e.loc!.source
            location = {
                file: filename,
                namespace: '',
                line: start.line + 1,
                column: start.column,
                length: lineText.length,
                lineText: e.loc!.source,
                suggestion: ''
            }
        }
        return {
            pluginName: 'vue',
            text: e.message,
            location: location,
            notes: [],
            detail: ''
        }
    }
    return errors.map(e => convert(e))
}

export function validateDenpendency() {
    try {
        require.resolve('vue/compiler-sfc')
    } catch {
        throw new Error('vue/compiler-sfc has not been installed')
    }
}

export const transpileTS = ( code: string, loader: 'ts' | 'js' = 'ts' ) => {
    const transpiler = new Bun.Transpiler( { loader } );
    const content = transpiler.transformSync( code );
    return content;
};