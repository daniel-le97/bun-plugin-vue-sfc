import { getDesCache, getId } from './cache'
import { compileTemplate, SFCDescriptor, SFCTemplateCompileOptions } from 'vue/compiler-sfc'
import { Options } from './index'
import convert from 'convert-source-map'

export function resolveTemplate(filename: string, options: Options['template'] = {}, isProd: boolean, target: 'browser' | 'bun') {
    const descriptor = getDesCache(filename)
    // const option: Partial<Options['template']> = {
    //     ssr: target === 'bun' ? true : false,
    //     ...options
    // }
    let { code, errors, map } = compileTemplate(getTemplateOptions(descriptor, options, isProd, target))

    if (map) {
        code += convert.fromObject(map).toComment()
    }

    const convertedErrors = errors.map(e => {
        if (typeof e === 'string') {
            return {
                text: e
            }
        } else {
            return {
                text: e.message
            }
        }
    })

    return {
        code,
        errors: convertedErrors
    }
}

export function getTemplateOptions(
    descriptor: SFCDescriptor,
    options: Options['template'],
    isProd: boolean,
    target: 'browser' | 'bun'
): SFCTemplateCompileOptions {
    const filename = descriptor.filename
    const scopeId = getId(filename)

    return {
        source: descriptor.template!.content,
        filename,
        id: scopeId,
        scoped: descriptor.styles.some(s => s.scoped),
        isProd,
        ssr: target === 'bun' ? true : false,
        ssrCssVars : target === 'bun' ? [] : undefined,
        inMap: descriptor.template!.map,
        compiler: options?.compiler,
        preprocessLang: descriptor.template?.lang ?? options?.preprocessLang,
        preprocessOptions: options?.preprocessOptions,
        compilerOptions: {
            ...options?.compilerOptions,
            scopeId
        },
        transformAssetUrls: options?.transformAssetUrls
    }
}
