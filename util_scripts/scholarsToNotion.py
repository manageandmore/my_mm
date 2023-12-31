from __future__ import print_function
import os.path

from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError

import requests
import json

from collections import defaultdict

from unidecode import unidecode

from dotenv import load_dotenv

# Load environment variables from the .env file
load_dotenv()
NOTION_SECRET_API_KEY = os.environ.get("NOTION_SECRET_API_KEY")

# If modifying these SCOPES, delete the file token.json.
SCOPES = ['https://www.googleapis.com/auth/spreadsheets.readonly']

NOTION_SCHOLAR_DATABASE_ID = '258576df97e347fa89b0ab2b237d3118'

NOTION_REQUEST_HEADER = {
    "Authorization": f"Bearer {NOTION_SECRET_API_KEY}",
    "Notion-Version": "2022-06-28",
    "Content-Type": "application/json"
}

SPREADSHEET_ID = '1LL6YrPLxU67_1NAZ4xFPZT7OXvzvBc3asY95Mr-g8x4'
SAMPLE_RANGE_NAME = 'Sheet1!A1:Q200'  # Modify this range as per your needs

scholar_database = []

# Get the path to the current script's directory
script_directory = os.path.dirname(os.path.realpath(__file__))

# Construct the full path to credentials.json
credentials_path = os.path.join(script_directory, "credentials.json")

def get_service():
    creds = None
    # The file token.json stores the user's access and refresh tokens, and is
    # created automatically when the authorization flow completes for the first time.
    if os.path.exists('token.json'):
        creds = Credentials.from_authorized_user_file('token.json')

    # If there are no (valid) credentials available, let the user log in.
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            flow = InstalledAppFlow.from_client_secrets_file(
                credentials_path, SCOPES)
            creds = flow.run_local_server(port=0)
            # Save the credentials for the next run
            with open('token.json', 'w') as token:
                token.write(creds.to_json())

    service = build('sheets', 'v4', credentials=creds)
    return service


def get_sheet_ids():
    """Gets the ids and title of all sheets or tabs of a google sheets file"""
    sheet_ids = []
    service = get_service()
    # Retrieve the list of sheets in the spreadsheet
    sheets = service.spreadsheets().get(spreadsheetId=SPREADSHEET_ID).execute().get('sheets', [])
    for sheet in sheets:
        title = sheet['properties']['title']
        id = sheet['properties']['sheetId']
        sheet_ids.append({"title": title, "id": id}) 
    
    return sheet_ids

def read_sheet(service, spreadsheet_id, range_name):
    """Reads data from a specific Google Sheet."""
    try:
        sheet = service.spreadsheets()
        result = sheet.values().get(spreadsheetId=spreadsheet_id,
                                    range=range_name).execute()
        values = result.get('values', [])

        if not values:
            print('No data found.')
        else:
            #for row in values:
            #    # Print columns A and B, which correspond to indices 0 and 1.
            #   print(', '.join(row))
            return values

    except HttpError as error:
        print(f"An error occurred: {error}")

def read_sheets(service, sheet_ids):
    values = []
    for sheet_id in sheet_ids:
        values.extend(read_sheet(service, SPREADSHEET_ID, sheet_id['title']+"!A1:C150"))

    return values

def create_scholar_entries(values, users):
    global scholar_database
    scholars = []
    #print(values)
    for row in values:
        if not row or len(row) < 1:
            continue
        elif not row[0].isdigit():
            continue
        #print(row)
        generation = row[0]
        nachname = row[1]
        vorname = row[2]
        name = vorname+" "+nachname
        mail = cleanup_string(vorname)+"."+cleanup_string(nachname)+"@manageandmore.de"
        id = users.get(mail)
        scholars.append([name, generation, mail, id])

    scholars = remove_duplicates(scholars)
    scholar_database = scholars.copy()
    return scholars
    
def cleanup_string(input_str):
    output_str = unidecode(replace_umlauts(input_str)).lower()
    output_str = output_str.replace(" ", "")
    return output_str

def replace_umlauts(input_str):
    # Replace lowercase umlauts
    input_str = input_str.replace('ä', 'ae')
    input_str = input_str.replace('ö', 'oe')
    input_str = input_str.replace('ü', 'ue')
    input_str = input_str.replace('ß', 'ss')
    
    # Replace uppercase umlauts
    input_str = input_str.replace('Ä', 'Ae')
    input_str = input_str.replace('Ö', 'Oe')
    input_str = input_str.replace('Ü', 'Ue')
    
    return input_str

def get_all_notion_users():

    users = {}
    has_more = True
    start_cursor = ""

    while has_more:
        response = requests.get(f"https://api.notion.com/v1/users{f'?start_cursor={start_cursor}' if start_cursor != '' else ''}", headers=NOTION_REQUEST_HEADER)
        response_content = response.json()
        print(response_content)

        has_more = response_content.get("has_more")
        start_cursor = response_content.get("next_cursor")

        for user in response_content.get("results"):
            if user.get("type") == "person":
                users[user.get("person").get("email")] = user.get("id")
        
        print(users)
    return users

def send_scholars_to_notion(scholars, database_id):
    entry_count = 0
    for scholar in scholars:
        data = {
            "parent": {"database_id": database_id},
            "properties": {
                "Name": {"title": [{"text": {"content": scholar[0]}}]},
                "Generation": {"number": int(scholar[1])},
                "Email": {"email": scholar[2]},
                "Person": {"people": ([
                    {"object": "user", "id": scholar[3]}
                ] if scholar[3] != None else [])},
                "Status": {"select": {"name": "Active" if int(scholar[1]) >= 38 else "Alumni"}}
            }
        }
        response = requests.post("https://api.notion.com/v1/pages", headers=NOTION_REQUEST_HEADER, data=json.dumps(data))
        response_content = response.json()
        #Check if response is error and print it out
        if response_content.get("object") == "error":
            print(response_content)
        else :
            print("added scholar " + scholar[0] + "to the notion database")
        entry_count += 1

    return entry_count

def remove_duplicates(lst):
    result = []
    for item in lst:
        if item not in result:
            result.append(item)
    return result


def main():
    service = get_service()
    sheet_ids = get_sheet_ids()
    values = read_sheets(service, sheet_ids)
    users = get_all_notion_users()
    scholars = create_scholar_entries(values, users)
    for scholar in scholars:
        print(scholar)
    entry_count = 0
    entry_count = send_scholars_to_notion(scholars, NOTION_SCHOLAR_DATABASE_ID)
    print("Added "+str(entry_count)+" entries to notion scholar database sucessfully")
    
if __name__ == '__main__':
    main()
