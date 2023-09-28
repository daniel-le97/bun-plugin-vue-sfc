import dts from 'bun-plugin-dts'

const prod = await Bun.build({
  entrypoints: ['./src/index.ts'],
  outdir: './dist',
  minify: true,
  target: 'bun',
  plugins: [dts()],
  external: ['vue']
})
// console.log(prod);