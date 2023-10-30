import { RequestContext } from '@vercel/edge';
import { ImageResponse } from '@vercel/og';

/**
 * Configures the vercel deployment to use the edge runtime. 
 */
export const config = {
  runtime: 'edge',
};
export const runtime = 'edge'

/** 
 * Handler for the /api/events route.
 * 
 * This route is called by slack when any event happens.
 *  */
export default async function social(request: Request, context: RequestContext) {
  try {
    const { searchParams } = new URL(request.url);
 
    const title = searchParams.get('title') ?? 'Some Title'
    const subtitle = searchParams.get('subtitle') ?? 'Some Subtitle'
    const logoPosition = searchParams.get('logoPosition') ?? 'top'
    const titleColor = searchParams.get('titleColor') ?? 'white'
    const titleAlignment = searchParams.get('titleAlignment') ?? 'left'
 
    const [
      mmLogo,
      utumLogo,
      workSansRegular,
      workSansBold,
    ] = await Promise.all([
      fetch(new URL('../assets/mm_logo.png', import.meta.url)).then((res) => res.arrayBuffer()),
      fetch(new URL('../assets/utum_logo.png', import.meta.url)).then((res) => res.arrayBuffer()),
      fetch(new URL('../assets/fonts/WorkSans-Regular.ttf', import.meta.url)).then((res) => res.arrayBuffer()),
      fetch(new URL('../assets/fonts/WorkSans-Bold.ttf', import.meta.url)).then((res) => res.arrayBuffer()),
    ])

    return new ImageResponse(
      {
        type: 'div',
        key: null,
        props: {
          style: {
            height: '100%',
            width: '100%',
            display: 'flex',
            alignItems: 'stretch',
            justifyContent: 'space-between',
            flexDirection: logoPosition == 'top' ? 'column' : 'column-reverse',
            flexWrap: 'nowrap',
          },
          children: [
            {
              type: 'img',
              key: null,
              props: {
                style: {position: 'absolute', top: 0, left: 0},
                width: 1000,
                height: 1000,
                src: "https://media.canva.com/1/image-resize/1/800_800_92_JPG_F/czM6Ly9tZWRpYS1wcml2YXRlLmNhbnZhLmNvbS96aDkxZy9NQUVzeTJ6aDkxZy8xL3AuanBn?osig=AAAAAAAAAAAAAAAAAAAAAOFgTM2lQmdqIz8uP1RdqKMkzj9AJPLPijwrfmihuTIR&exp=1698687117&x-canva-quality=screen&csig=AAAAAAAAAAAAAAAAAAAAAO9yfE8v6A3NQ8sWPPLuEx_intF6p0WNIZYxOyR0HdlA",

              }
            },
            {
              type: 'div',
              key: null,
              props: {
                style: {
                  display: 'flex',
                  flexDirection: 'row',
                  flexWrap: 'nowrap',
                  justifyContent: 'space-between',
                  alignItems: logoPosition == 'top' ? 'flex-start' : 'flex-end',
                  padding: 40,
                },
                children: [
                  {type: 'img', key: null, props: {height: 60, src: mmLogo}},
                  {type: 'img', key: null, props: {height: 90, src: utumLogo}}
                ]
              }
            },
            {
              type: 'div',
              key: null,
              props: {
                style: {
                  display: 'flex',
                  flexDirection: 'column',
                  flexWrap: 'nowrap',
                  alignItems: titleAlignment == 'left' ? 'flex-start' : 'flex-end',
                  fontFamily: 'WorkSans',
                  color: 'white',
                  textAlign: titleAlignment,
                  padding: 40,
                },
                children: [
                  {
                    type: 'div', 
                    key: null, 
                    props: {
                      style: {
                        fontSize: 130,
                        fontWeight: 800,
                        lineHeight: 0.9,
                        whiteSpace: 'pre-wrap',
                        color: titleColor,
                      }, 
                      children: title
                    },
                  },
                  {
                    type: 'div', 
                    key: null, 
                    props: {
                      style: {
                        marginTop: 10,
                        fontSize: 50,
                        fontWeight: 500,
                        whiteSpace: 'nowrap',
                      }, 
                      children: subtitle
                    }
                  }
                ]
              }
            },
          ] 
        }
      },
      {
        width: 1000,
        height: 1000,
        fonts: [
          {
            name: 'WorkSans',
            data: workSansRegular,
            weight: 500,
            style: 'normal',
          },
          {
            name: 'WorkSans',
            data: workSansBold,
            weight: 800,
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
