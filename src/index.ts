// import { Plugin } from 'esbuild'
// import fs from 'fs'
import { parse } from 'querystring'
import { loadEntry } from './entry'
import { resolvePath, transpileTS, validateDenpendency } from './util';
import { resolveScript } from './script'
import { resolveTemplate } from './template'
import { resolveStyle } from './style'
import { SFCTemplateCompileOptions, SFCScriptCompileOptions, SFCAsyncStyleCompileOptions } from 'vue/compiler-sfc'
import { BunPlugin } from 'bun';

export interface Options {
    // include?: string | RegExp | ( string | RegExp )[];
    // exclude?: string | RegExp | ( string | RegExp )[]

    isProduction?: boolean
    /**
     * @default 'browser'
     */
    target: 'browser' | 'bun'

    // options to pass on to vue/compiler-sfc
    script?: Partial<
        Pick<
            SFCScriptCompileOptions,
            | 'babelParserPlugins'
            | 'globalTypeFiles'
            | 'defineModel'
            | 'propsDestructure'
            | 'fs'
            | 'reactivityTransform'
            | 'hoistStatic'
        >
    >;
    template?: Partial<
        Pick<
            SFCTemplateCompileOptions,
            | 'compiler'
            | 'compilerOptions'
            | 'preprocessOptions'
            | 'preprocessLang'
            | 'preprocessCustomRequire'
            | 'transformAssetUrls'
            | 'ssr'
        >
    >;
    style?: Pick<
        SFCAsyncStyleCompileOptions,
        'modulesOptions' | 'preprocessLang' | 'preprocessOptions' | 'postcssOptions' | 'postcssPlugins'
    >
}


export function plugin ( options: Options = { target: 'browser'} ): BunPlugin {
    validateDenpendency()


    const { script, style, template, isProduction, target } = options
 

    return {
        name: 'vue',
        setup(build) {
            const sourcemap = false
            const isProd = isProduction ?? process.env.NODE_ENV === 'production'
              
            build.onLoad(
                {
                    filter: /\.vue$/
                },
                async args => {
                    const filename = args.path
                    const source = await Bun.file( filename ).text()
                    const { code, errors } = loadEntry(source, filename, !!sourcemap, target!)
                    return {
                        contents: code,
                        errors
                    }
                }
            )

            build.onResolve(
                {
                    filter: /\.vue\?type=script/
                },
                args => {
                    return {
                        path: args.path,
                        // namespace: 'vue-script'
                    }
                }
            )

            build.onLoad(
                {
                    filter: /\.vue\?type=script/
                    // namespace: 'vue-script'
                },
                args => {
                    const [filename] = resolvePath(args.path)
                    const { code, isTs } = resolveScript(
                        filename,
                        script,
                        template,
                        isProd,
                        !!sourcemap,
                        target
                    )
                    return {
                        contents: code,
                        loader: isTs ? 'ts' : 'js'
                    }
                }
            )

            build.onResolve(
                {
                    filter: /\.vue\?type=template/
                },
                args => {
                    return {
                        path: args.path,
                        // namespace: 'vue-template'
                    }
                }
            )

            build.onLoad(
                {
                    filter: /\.vue\?type=template/,
                    // namespace: 'vue-template'
                },
                args => {
                    const [filename, dirname] = resolvePath(args.path)
                    const { code, errors } = resolveTemplate( filename, template, isProd, target! )
                    return {
                        contents: code,
                        errors,
                        resolveDir: dirname
                    }
                }
            )

            build.onResolve(
                {
                    filter: /\.vue\?type=style/
                },
                args => {
                    return {
                        path: args.path,
                        // namespace: 'vue-style'
                    }
                }
            )

            build.onLoad(
                {
                    filter: /\.vue\?type=style/
                    // namespace: 'vue-style'
                },
                async args => {
                    const [filename, query] = resolvePath(args.path)
                    const { index, isModule, isNameImport } = parse(query)
                    const moduleWithNameImport = !!(isModule && isNameImport)
                    const { styleCode} = await resolveStyle(
                        filename,
                        style,
                        Number(index),
                        !!isModule,
                        moduleWithNameImport,
                        isProd
                    )
                    // console.log( styleCode );
                    const code = ( content: string ) => `
                    let head = document.head;
                    let style = document.createElement("style");
                    head.appendChild(style);
                    style.type = "text/css";
                    style.appendChild(document.createTextNode(\`${ content }\`))`;
                    return {
                        contents: moduleWithNameImport ? styleCode : target === 'bun' ? '': transpileTS( code( styleCode ) ),
                        loader: moduleWithNameImport ? 'json' : 'js'
                    }
                }
            )
        }
    }
}




export default plugin