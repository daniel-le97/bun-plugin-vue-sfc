
import { createSSRApp} from 'vue';


export async function createApp (path: string) {

    const home = await import( path )
    // add vue plugins here
    const app = createSSRApp( home.default);
    
    
    return {app}

}