# My MM

This repository holds the code and resources for the custom slack integration for MM.

# Structure

- `/api` contains the api entry routes
- `/src` contains the source code
  - `/features` contains each feature in a separate directory
- `manifest.yaml` stores the config for the slack app

# Local Development Setup

You need the following prerequisites:

- Installed **NodeJS** and **npm**
- Create a vercel account (https://vercel.com/signup)
  - Select the Hobby plan for free projects
- Installed and setup **vercel** cli (https://vercel.com/docs/cli)

---

## Project Setup

For starters clone the git repository into a new directory called `mm_app`:

```shell
git clone https://github.com/schultek/mm_app mm_app
cd mm_app
```

## Vercel Project Setup

Inside the `mm_app` folder, initialize a new vercel project through the vercel cli:

```shell
vercel
```

Answer the prompts so that you setup your project for your private vercel account. 
You might need to login to the cli when prompted.
Select `N` when asked to link an existing project and enter the details for a new project.

---

Next go to `vercel.com` and open your project dashboard. Go to the `Storage` tab and add two databases:

- **KV** for caching.
- **Postgres** for vector embeddings.

---

Go to `Settings` -> `Domains` and note down your projects domain for production deployments. Create one if none exists. 

## Slack App Setup

Next create your own custom slack app like this:

- Go to `https://api.slack.com/apps/` and signin with your MM account
- Create a new slack app -> From an app manifest
- Select the **ManageAndMore Test** Workspace
- Copy the content of `manifest.yaml` into the text area and adjust the following:
  - Change `display_information.name` to a custom name
  - Change `features.bot_user.display_name` to the same name
  - Change `settings.event_subscriptions.request_url` to `https://<your-domain.vercel.app>/api/events` using your vercel project domain you noted down earlier.
  - Change `settings.interactivity.request_url` to the same url.
- Click **Create**


Then install the app to the workspace as prompted.

---

Open your vercel project dashboard and go to `Settings` -> `Environment Variables`

Add the following variables:

- `SLACK_SIGNING_SECRET` as found under **Basic Information** -> **App Credentials** -> **Signing Secret**
- `SLACK_BOT_TOKEN` as found under **OAuth & Permissions** -> **Bot User OAuth Token**

## Notion Setup

Add the `NOTION_INTEGRATION_TOKEN` environment variable in the vercel settings with the following:

- Go to `https://www.notion.so/my-integrations`
- Open the **MM App** integration
- Copy the **Internal Integration Secret** to the env var.

## OpenAI Setup

Either get a real OpenAI Api token from a personal account, or make up a dummy token (e.g. 'DUMMY_TOKEN'). 
Add your token as the `OPENAI_TOKEN` environment variable in the vercel settings.

## Deploy Development App

To deploy your personal development app run:

```shell
vercel deploy --prod
```

# Production

To deploy a new version to production (The real MM Workspace), commit and push your changes to the `main` branch.