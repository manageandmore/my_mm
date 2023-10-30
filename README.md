# My MM

This repository holds the code and resources for the custom slack integration for MM.

# Structure

- `/api` contains the api entry routes.
- `/src` contains the source code
- `manifest.yaml` stores the config for the slack app

# Local Development Setup

You need the following prerequisites:

- Installed **NodeJS** and **npm**
- Installed and setup **vercel** cli
- Installed and setup **ngrok**

Add a `.env` file with the following content:

```env
NOTION_INTEGRATION_TOKEN=""
OPENAI_TOKEN=""
SLACK_BOT_TOKEN=""
SLACK_SIGNING_SECRET=""
NGROK_DOMAIN=""
```

We will edit these values as we do the setup.

## Ngrok Setup

Go to `https://dashboard.ngrok.com/cloud-edge/domains` and create a new domain.
Copy the domain to the `.env` file as `NGROK_DOMAIN="<your-domain>.ngrok-free.app"`

## Slack App Setup

Next create your own custom slack app like this:

- Go to `https://api.slack.com/apps/` and signin with your MM account
- Create a new slack app -> From an app manifest
- Select the **ManageAndMore Test** Workspace
- Copy the content of `manifest.yaml` into the text area and adjust the following:
  - Change `display_information.name` to a custom name
  - Change `features.bot_user.display_name` to the same name
  - Change `settings.event_subscriptions.request_url` to include your ngrok domain as `https://<your-domain>.ngrok-free.app/api/events`
- Click **Create**

Then install the app to the workspace as prompted.

Finally update the following variables in the `.env` file:

- `SLACK_SIGNING_SECRET` as found under **Basic Information** -> **App Credentials** -> **Signing Secret**
- `SLACK_BOT_TOKEN` as found under **OAuth & Permissions** -> **Bot User OAuth Token**

## Notion Setup

Update the `NOTION_INTEGRATION_TOKEN` variable in the `.env` file with the following:

- Go to `https://www.notion.so/my-integrations`
- Open the **MM App** integration
- Copy the **Internal Integration Secret** to the env var.

## Running Local Development

Start the dev server: 

```shell
vercel dev
````

Start ngrok with the port of the dev server (usually 3000):

```
ngrok http 3000
```

# Deployment

```shell
vercel deploy
```

To deploy a new version, commit and push your changes to the `main` branch.