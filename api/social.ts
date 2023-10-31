import { search } from '@notionhq/client/build/src/api-endpoints';
import { RequestContext } from '@vercel/edge';
import { kv } from '@vercel/kv';
import { ImageResponse } from '@vercel/og';
import { slackBotToken } from '../src/constants';
import { slack } from '../src/slack';

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
    let params = Object.fromEntries(searchParams.entries())

    if (params["d"] != null) {
      params = Object.assign(JSON.parse(atob(params["d"])), params)
    }
 
    const size = Number(params['size'] ?? '800')
    let image: string | ArrayBuffer = params['image'] ?? `https://placehold.co/${size}x${size}/19A5CE/4DB8D6/png?text=Background\\nImage`
    const title = params['title'] ?? ''
    const subtitle = params['subtitle'] ?? ''
    const logoPosition = params['logoPosition'] ?? 'top'
    const titleColor = params['titleColor'] ?? 'white'
    const titleAlignment = params['titleAlignment'] ?? 'left'

    const file = params['file']
    if (file != null) {
      const response = await slack.client.files.info({file: file})
      const imageUrl = response.file?.url_private

      if (imageUrl != null) {
        image = await fetch(response.file!.url_private!, {headers: {'Authorization': `Bearer ${slackBotToken}`}}).then((res) => res.arrayBuffer())
      }
    }

    const download = params['download'] != null
    const headers: HeadersInit = download ?  {
      'Content-Disposition': `attachment; filename="${title.replaceAll(' ', '_')}.png"`
    } : {}
 
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
                style: {position: 'absolute', top: 0, left: 0, objectFit: 'cover'},
                width: size,
                height: size,
                src: image,
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
                  padding: size*0.04,
                },
                children: [
                  {type: 'img', key: null, props: {height: size*0.06, src: mmLogo}},
                  {type: 'img', key: null, props: {height: size*0.09, src: utumLogo}}
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
                  padding: size*0.04,
                },
                children: [
                  {
                    type: 'div', 
                    key: null, 
                    props: {
                      style: {
                        fontSize: size*0.13,
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
                        marginTop: size*0.01,
                        fontSize: size*0.05,
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
        width: size,
        height: size,
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
        headers: headers,
      },
    );
  } catch (e: any) {
    console.log(`ERROR: ${e.message}`);
    return new Response(`Failed to generate the image`, {
      status: 500,
    });
  }
}
