import { existsSync, rmSync, statSync } from 'node:fs';
import pluginVue from '../src';
import * as path from 'path';
import { renderToString } from 'vue/server-renderer';
import { ServeOptions } from 'bun';
import { createApp } from './entry/index.js';
Bun.plugin( pluginVue( { target: 'bun' } ) );

const PROJECT_ROOT = import.meta.dir;
// const PUBLIC_DIR = path.resolve( PROJECT_ROOT, "public" );
const BUILD_DIR = path.resolve( PROJECT_ROOT, ".build" );

const router = new Bun.FileSystemRouter( {
  style: 'nextjs',
  dir: './playground/examples',
  fileExtensions: [ '.vue' ]
} );
// console.log(router);
// const entrypoints = compileDirList.map(dir => `${testDir}/${dir}/App.vue`)
// console.log(entrypoints);

if ( existsSync( BUILD_DIR ) )
{
  rmSync( BUILD_DIR, { recursive: true, force: true } );
}

// bundle client for browser side hydration
const buildOne = await Bun.build( {
  entrypoints: [ ...Object.values( router.routes ), import.meta.dir + '/entry/entry-client.ts' ],
  outdir: './.build/client',
  plugins: [ pluginVue() ],
  target: 'browser',
  define: {
    __VUE_OPTIONS_API__: "true",
    __VUE_PROD_DEVTOOLS__: "true"
  },
  splitting: true
} );

// bundle client for server side rendering
const build = await Bun.build( {
  entrypoints: [ ...Object.values( router.routes ) ],
  outdir: './.build/server',
  plugins: [ pluginVue( { target: 'bun' } ) ],
  target: 'bun',
  splitting: true
} );

console.log( buildOne.success, build.success );

const clientRouter = new Bun.FileSystemRouter( {
  style: 'nextjs',
  dir: './.build/client/playground/examples'
} );
const serverRouter = new Bun.FileSystemRouter( {
  style: 'nextjs',
  dir: './.build/server/playground/examples'
} );
console.log( { clientRouter, serverRouter } );

// const vueImport = await import('./dist/normal-sfc/App')
// const app = createSSRApp(vueImport.default)
// const appString = await renderToString(app)
// console.log(appString);


function serveFromDir (
  serveDirectories: string[],
  reqPath: string
): Response | null {
  for ( const dir of serveDirectories )
  {
    try
    {
      let pathWithSuffix = path.join( dir, reqPath );
      const stat = statSync( pathWithSuffix );

      if ( stat && stat.isFile() )
      {

        return new Response( Bun.file( pathWithSuffix ) );
      }
      continue;
    } catch ( error )
    {
      //do something here if the file should have been found from the directory
    }
  }
  return null;
}

// helper function to update our html and send it
async function serveFromRouter ( request: Request ) {
  try
  {
    const match = router.match( request );

    if ( match )
    {
      const clientMatch = clientRouter.match( request );

      if ( !clientMatch )
      {
        return new Response( "clientMatch not found", { status: 500 } );
      }
      const serverMatch = serverRouter.match( request );

      if ( !serverMatch )
      {
        return new Response( "clientMatch not found", { status: 500 } );
      }

      let html = await Bun.file( './playground/index.html' ).text();
      // const css = (await import(BUILD_DIR + '/client/assets/main.js')).default

      const page = await createApp( serverMatch.filePath );


      const stream = await renderToString( page.app );

      // set the page javascript we want to fetch for client
      html = html.replace( '{{ dynamicPath }}', '/playground/examples/' + clientMatch.src )
        // add the server side html to the html markup
        .replace( '<!--htmlIndex-->', stream );
      // inline the css, i dont know if this is bad or not
      //  .replace( '<!--html-head-->', `<style type="text/css">${ css }</style>`);

      // send the finalized html
      return new Response( html, {
        headers: { "Content-Type": "text/html;charset=utf-8" },
      } );
    }
  } catch ( error )
  {
    // do something here if the request should have been processed
  }

}


// basic Bun native server to serve our app
export default {
  port: 3007,
  async fetch ( request ) {
    console.log( request.url );

    const routerResponse = await serveFromRouter( request );
    console.log(routerResponse);
    
    if ( routerResponse )
    {
      return routerResponse;
    }
    let reqPath = new URL( request.url ).pathname;
    if ( reqPath === "/" )
    {
      reqPath = "/index.html";
    }

    const serveDirectory = serveFromDir( [ path.resolve( process.cwd(), '.build/client/playground' ), path.resolve( process.cwd(), '.build/client/' )], reqPath );
    if ( serveDirectory )
    {
      return serveDirectory;
    }

    return new Response( "File not found", {
      status: 404,
    } );
  },
} satisfies ServeOptions;

console.log( `http://localhost:${ 3007 }` );
