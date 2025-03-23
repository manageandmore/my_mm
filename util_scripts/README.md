
**Scripts to transfer data from google sheets to notion**

**HOW TO USE** (should never be necessary unless all entries have been deleted on notion

1. Follow the instructions here: https://developers.google.com/sheets/api/quickstart/python until have installed the google client library
2. Create a .env file in your clone of the repository with this structure:

```env
NOTION_SECRET_API_KEY = "<notion_secret_api_key>"
NOTION_INTEGRATION_TOKEN="<notion_integration_token>"
OPENAI_TOKEN="<openai_token>"
SLACK_BOT_TOKEN="<slack_bot_token>"
SLACK_SIGNING_SECRET="<slack_signing_secret>"
```

3. Make sure you have generated a credentials.json file with your google credentials and placed it in the util_scripts folder
4. Run scholarsToNotion.py
2. Run creditEntriesToNotion.py

**creditEntriesToNotion.py**
Transfers all credit entries from all sheets into a notion database entry, where each entry represents a one credit entry.

**scholarsToNotion.py**
Transfers all scholars found based on entries from the credit google sheets into a scholar entry on the notion scholars database. (Email is auto-generated based on first and last name)



**TO-DO**
- Add tqdm progress bar to upload script
- somehow prevent multiple entries for multiple uploads
- improve speed of script
- Filter project name for credit entry to prevent differently spelled version of the same name