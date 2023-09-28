# bun-plugin-vue-sfc

building vue 3.x SFC files with bun.


this is a fork of <https://github.com/Bigfish8/esbuild-plugin-vue-next>

this plugin does not yet work as a bun runtime plugin

# Quickstart

- install

```
bun install bun-plugin-vue-sfc

```

- use plugin

```js
// build..mjs
import plugin from 'bun-plugin-vue-sfc'
await Bun.build({
 entrypoints: ['./src/App.vue'],
  outdir: './build',
  minify: true,
  splitting: true,
  target: 'browser',
  plugins: [plugin()],
})
 
```

- run bun

```
bun build.mjs
```

## Options

```js
export interface Options {
	isProduction?: boolean;
	/**
	 * @default 'browser'
	 */
	target: "browser" | "bun";
	script?: Partial<Pick<SFCScriptCompileOptions, "babelParserPlugins" | "globalTypeFiles" | "defineModel" | "propsDestructure" | "fs" | "reactivityTransform" | "hoistStatic">>;
	template?: Partial<Pick<SFCTemplateCompileOptions, "compiler" | "compilerOptions" | "preprocessOptions" | "preprocessLang" | "preprocessCustomRequire" | "transformAssetUrls" | "ssr">>;
	style?: Pick<SFCAsyncStyleCompileOptions, "modulesOptions" | "preprocessLang" | "preprocessOptions" | "postcssOptions" | "postcssPlugins">;
}

```
