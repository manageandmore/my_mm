import { ImageResponse } from '@vercel/og';
import { RequestContext } from '@vercel/edge';

/**
 * Configures the vercel deployment to use the edge runtime. 
 */
export const config = {
  runtime: 'edge',
};

/** 
 * Handler for the /api/events route.
 * 
 * This route is called by slack when any event happens.
 *  */
export default async function social(request: Request, context: RequestContext) {
  try {
    const { searchParams } = new URL(request.url);

    const [mmLogo, utumLogo, workSans] = [1,2,3]
    // const [
    //   mmLogo,
    //   utumLogo,
    //   workSans,
    // ] = await Promise.all([
    //   fetch(new URL('../assets/mm_logo.png', import.meta.url)).then((res) => res.arrayBuffer()),
    //   fetch(new URL('../assets/utum_logo.png', import.meta.url)).then((res) => res.arrayBuffer()),
    //   fetch(new URL('../assets/fonts/WorkSans-Variable.ttf', import.meta.url)).then((res) => res.arrayBuffer()),
    // ])
 
    const title = searchParams.get('title') ?? 'Some Title'
    const subtitle = searchParams.get('subtitle') ?? 'Some Subtitle'
 
    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            textAlign: 'center',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
            flexWrap: 'nowrap',
            padding: 80,
          }}
        >
          {/* <img
            style={{position: 'absolute', top: 0, left: 0}}
            width="1200"
            height="1200"
            src="https://media.canva.com/1/image-resize/1/800_800_92_JPG_F/czM6Ly9tZWRpYS1wcml2YXRlLmNhbnZhLmNvbS96aDkxZy9NQUVzeTJ6aDkxZy8xL3AuanBn?osig=AAAAAAAAAAAAAAAAAAAAAOFgTM2lQmdqIz8uP1RdqKMkzj9AJPLPijwrfmihuTIR&exp=1698687117&x-canva-quality=screen&csig=AAAAAAAAAAAAAAAAAAAAAO9yfE8v6A3NQ8sWPPLuEx_intF6p0WNIZYxOyR0HdlA"
          />
          <div
            style={{
              display: 'flex',
              flexDirection: 'row',
              flexWrap: 'nowrap',
              justifyContent: 'space-between',
              alignItems: 'start',
            }}
          >
            <img height="200" src={mmLogo as any} />
            <img height="300" src={utumLogo as any} />
          </div>
          <div style={{flexGrow: 1}}></div>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              flexWrap: 'nowrap',
              alignItems: 'start',
              fontFamily: 'WorkSans',
              color: 'white',
              textAlign: 'left',
            }}
          >
            <div
              style={{
                fontSize: 60,
                fontWeight: 600,
                lineHeight: 1.4,
                whiteSpace: 'pre-wrap',
              }}
            >{title}</div>
            <div
              style={{
                fontSize: 20,
                fontWeight: 400,
                whiteSpace: 'nowrap',
              }}
            >{subtitle}</div>
          </div> */}
        </div>
      ),
      {
        width: 1200,
        height: 1200,
        fonts: [
          {
            name: 'WorkSans',
            data: workSans as any,
            style: 'normal',
          },
        ],
      },
    );
  } catch (e: any) {
    console.log(`ERROR: ${e.message}`);
    return new Response(`Failed to generate the image`, {
      status: 500,
    });
  }
}
