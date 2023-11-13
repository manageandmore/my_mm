# Social Post Creator

## Description

With this feature, users can create social media posts in just a few clicks right from inside slack. The post images are created in the new MM social post style that is used the create a consistent look across the MM social media channels. The user can configure the content, like title and background image, as well as some limited predefined theming options.

## Functionality

The user interacts with this feature through both messaging with the app and a modal. The whole interaction is designed as a linear workflow that the user is being lead through by the app. The workflow is as follows:

0. (Optional / First Time)
  - User triggers the "Create Social Post" Shortcut from anywhere inside slack.
  - App sends a initial message with instructions to the user on how to continue with step 1.
1. User sends an image as a message to the app.
  - (This can also be done directly without step 0)
2. App detects the image message and sends a response, containing an action button labeled "Create Social Media Post".
3. User presses the button.
4. App openes a modal with the post preview and a form for the post configuration.
5. Whenever the user updates the values in the modal, it updates to render the new post preview.
6. User submits the modal.
7. App sends a final message to the user with the full-resolution post image, which the user can then download.

## Structure

- `./action.ts` contains all event handlers for the shortcut, message, actions and modal submission.
- `./generator.ts` contains the layout code for the image generation.
- `./modal.ts` contains the layout code for the modal.
- `/api/social.ts` contains the api entrypoint for the image generation.

## Roadmap

In the future we want to expand this to directly add the created post to the content calendar in notion.
