import { ButtonAction, DataSubmissionView, FileItem } from "slack-edge"
import { slack } from "../../slack"
import { getPostCreatorModal, getPostImageUrl, PostCreatorModalOptions } from "./modal"

const createSocialPostShortcut = 'create_social_post'

/**
 * Shows a helpful starting message when the user triggers the 'Create Social Post' shortcut.
 */
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

/**
 * Shows a "Create Social Media Post" button whenever the user sends an image to the app.
 */
slack.anyMessage(async (request) => {
  const payload = request.payload;

  // Guard for direct messages to the app.
  if (payload.channel_type != 'im') {
    return
  }

  // Guard for file messages.
  if (payload.subtype != 'file_share' || payload.files == null || payload.files.length != 1) {
    return
  }
  
  const file = payload.files![0] as any as FileItem
  
  // Guard for image files.
  if (!['jpg', 'jpeg', 'png'].includes(file.filetype)) {
    return
  }
      
  await slack.client.chat.postMessage({
    channel: payload.channel,
    text: 'What a nice image. Do you want to turn it into a social media post?',
    blocks: [
      {
        "type": "section",
        "text": {
          "type": "mrkdwn",
          "text": "What a nice image. ✨\nDo you want to turn it into a social media post?"
        },
        "accessory": {
          "type": "button",
          "action_id": createSocialPostAction,
          "text": {
            "type": "plain_text",
            "text": "Create Social Media Post",
            "emoji": true
          },
          "style": "primary",
          "value": file.id,
        }
      }
    ]
  })
})

export const createSocialPostAction = 'create_social_post'

interface PostCreatorModalState {
  title?: {[updateSocialPostAction]: {value: string}}
  subtitle?: {[updateSocialPostAction]: {value: string}}
  image_url?: {[updateSocialPostAction]: {value: string}}
  logo_position?: {[updateSocialPostAction]: {selected_option?: {value: string}}}
  title_alignment?: {[updateSocialPostAction]: {selected_option?: {value: string}}}
  title_color?: {[updateSocialPostAction]: {selected_option?: {value: string}}}
}

/** 
 * Opens the post creator modal when the user clicks the "Create Social Media Post" button.
 */
slack.action(createSocialPostAction, async (request) => {
  const payload = request.payload

  const fileId = (payload.actions[0] as ButtonAction).value

  await slack.client.views.open({
    trigger_id: payload.trigger_id,
    view: getPostCreatorModal({
      size: 300, // Generate a low-resolution preview.
      file: fileId,
    })
  })
})

export const updateSocialPostAction = 'update_social_post'

/**
 * Updates the post creator modal whenever the user changes some values inside the modal.
 */
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
        size: 300, // Generate a low-resolution preview.
      }
    )
  })
})

export const createSocialPostCallback = 'create_social_post_callback'

/**
 * Sends back the created post image when the user submits the post creator modal.
 */
slack.viewSubmission(createSocialPostCallback, async (request) => {
  return {
    response_action: "clear",
  }
}, async (request) => {

  const payload = request.payload

  const options = getPostOptionsFromView(payload.view)

  const imageUrl = getPostImageUrl({
    ...options,
    size: 1200, // Generate a high resolution image.
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