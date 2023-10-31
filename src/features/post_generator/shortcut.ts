import { Files } from "openai/resources"
import { BlockElementAction, ButtonAction, DataSubmissionView } from "slack-edge"
import { slackUserToken } from "../../constants"
import { slack } from "../../slack"
import { getPostCreatorModal, getPostImageUrl, PostCreatorModalOptions } from "./modal"

const createSocialPostShortcut = 'create_social_post'

slack.globalShortcut(createSocialPostShortcut, async (request) => {
  const payload = request.payload
  
  await slack.client.chat.postMessage({
    channel: payload.user.id,
    text: 'Send me an image to get started with the post creation.',
    blocks: [
      {
        type: "section",
        text: {
          type: 'mrkdwn',
          text: 'Hi 👋\n\nLooks like you want to create a social media post four our amazing *ManageAndMore Socials*.\n'+
          'To get started, simply *send me a message* in this chat *containing the image* that you want to use for the post.'
        }
      }
    ]
  })
})

export const createSocialPostAction = 'create_social_post'
export const updateSocialPostAction = 'update_social_post'

interface PostCreatorModalState {
  title?: {[updateSocialPostAction]: {value: string}}
  subtitle?: {[updateSocialPostAction]: {value: string}}
  image_url?: {[updateSocialPostAction]: {value: string}}
  logo_position?: {[updateSocialPostAction]: {selected_option?: {value: string}}}
  title_alignment?: {[updateSocialPostAction]: {selected_option?: {value: string}}}
  title_color?: {[updateSocialPostAction]: {selected_option?: {value: string}}}
}

slack.action(createSocialPostAction, async (request) => {
  const payload = request.payload

  const fileId = (payload.actions[0] as ButtonAction).value

  await slack.client.views.open({
    trigger_id: payload.trigger_id,
    view: getPostCreatorModal({
      size: 300,
      file: fileId,
    })
  })
})

slack.action(updateSocialPostAction, async (request) => {
  const payload = request.payload

  if (payload.view == null) {
    return
  }

  const options = getPostOptionsFromView(payload.view)

  await slack.client.views.update({
    view_id: payload.view!.id,
    view: getPostCreatorModal(
      {
        ...options,
        size: 300,
      }
    )
  })
})

export const createSocialPostCallback = 'create_social_post_callback'

slack.viewSubmission(createSocialPostCallback, async (request) => {
  return {
    response_action: "clear",
  }
}, async (request) => {

  const payload = request.payload

  const options = getPostOptionsFromView(payload.view)

  const imageUrl = getPostImageUrl({
    ...options,
    size: 1200,
  }, true) + '&download=1'

  await slack.client.chat.postMessage({
    channel: payload.user.id,
    text: 'Here is your post',
    blocks: [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: "Here is your finished post.\n\n🙏 Thanks for helping us with your amazing content for the MM socials. "
        }
      },
      {
        type: "image",
        image_url: imageUrl,
        alt_text: "Post Image",
      }
    ]
  })

})

function getPostOptionsFromView(view: DataSubmissionView | undefined): PostCreatorModalOptions {
  if (view == null) return {}
  const state = view.state.values as PostCreatorModalState
  const data = JSON.parse(view.private_metadata) as PostCreatorModalOptions

  return Object.assign(data, {
    title: state.title?.[updateSocialPostAction].value,
    subtitle: state.subtitle?.[updateSocialPostAction].value,
    image: state.image_url?.[updateSocialPostAction].value,
    logoPosition: state.logo_position?.[updateSocialPostAction].selected_option?.value,
    titleAlignment: state.title_alignment?.[updateSocialPostAction].selected_option?.value,
    titleColor: state.title_color?.[updateSocialPostAction].selected_option?.value,
  })
}