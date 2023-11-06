import { ImageResponse } from "@vercel/og"
import { slackBotToken } from "../../constants"
import { slack } from "../../slack"

interface PostOptions {
  size: number
  title: string
  subtitle: string
  logoPosition: string
  titleColor: string
  titleAlignment: string
  file?: string
  image: string
  download: boolean
}

/**
 * Generates a social post image using the @vercel/og package.
 * @param options The input options for the post, like title, background and style.
 * @returns The image as a response object.
 */
export async function generatePostImage(options: PostOptions): Promise<Response> {

  let image: ArrayBuffer | string = options.image
  if (options.file != null) {
    const response = await slack.client.files.info({file: options.file})
    const imageUrl = response.file?.url_private

    if (imageUrl != null) {
      image = await fetch(response.file!.url_private!, {headers: {'Authorization': `Bearer ${slackBotToken}`}}).then((res) => res.arrayBuffer())
    }
  }

  const headers: HeadersInit = options.download ? {
    'Content-Disposition': `attachment; filename="${options.title.replaceAll(' ', '_')}.png"`
  } : {}

  const [
    mmLogo,
    utumLogo,
    workSansRegular,
    workSansBold,
  ] = await Promise.all([
    fetch(new URL('../../../assets/mm_logo.png', import.meta.url)).then((res) => res.arrayBuffer()),
    fetch(new URL('../../../assets/utum_logo.png', import.meta.url)).then((res) => res.arrayBuffer()),
    fetch(new URL('../../../assets/fonts/WorkSans-Regular.ttf', import.meta.url)).then((res) => res.arrayBuffer()),
    fetch(new URL('../../../assets/fonts/WorkSans-Bold.ttf', import.meta.url)).then((res) => res.arrayBuffer()),
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
          flexDirection: options.logoPosition == 'top' ? 'column' : 'column-reverse',
          flexWrap: 'nowrap',
        },
        children: [
          {
            type: 'img',
            key: null,
            props: {
              style: {position: 'absolute', top: 0, left: 0, objectFit: 'cover'},
              width: options.size,
              height: options.size,
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
                alignItems: options.logoPosition == 'top' ? 'flex-start' : 'flex-end',
                padding: options.size*0.04,
              },
              children: [
                {type: 'img', key: null, props: {height: options.size*0.06, src: mmLogo}},
                {type: 'img', key: null, props: {height: options.size*0.09, src: utumLogo}}
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
                alignItems: options.titleAlignment == 'left' ? 'flex-start' : 'flex-end',
                fontFamily: 'WorkSans',
                color: 'white',
                textAlign: options.titleAlignment,
                padding: options.size*0.04,
              },
              children: [
                {
                  type: 'div', 
                  key: null, 
                  props: {
                    style: {
                      fontSize: options.size*0.13,
                      fontWeight: 800,
                      lineHeight: 0.9,
                      whiteSpace: 'pre-wrap',
                      color: options.titleColor,
                    }, 
                    children: options.title
                  },
                },
                {
                  type: 'div', 
                  key: null, 
                  props: {
                    style: {
                      marginTop: options.size*0.01,
                      fontSize: options.size*0.05,
                      fontWeight: 500,
                      whiteSpace: 'nowrap',
                    }, 
                    children: options.subtitle
                  }
                }
              ]
            }
          },
        ] 
      }
    },
    {
      width: options.size,
      height: options.size,
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
  )
}