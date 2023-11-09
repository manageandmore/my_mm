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

# If modifying these SCOPES, delete the file token.json.
SCOPES = ['https://www.googleapis.com/auth/spreadsheets.readonly']

NOTION_SECRET_API_KEY = 'secret_Rcz8sh5V0pYLCer9VWQkPnDpVWLTWSzMYwTeoJ3Fqpl'
NOTION_DATABASE_ID = '79aae9b224804c3d8997a71287480111'

NOTION_PEOPLE_DATABASE_ID = '9fd93456efb34c6f9fe1ca63fa376899'

NOTION_REQUEST_HEADER = {
    "Authorization": f"Bearer {NOTION_SECRET_API_KEY}",
    "Notion-Version": "2022-06-28",
    "Content-Type": "application/json"
}

SPREADSHEET_ID = '1LL6YrPLxU67_1NAZ4xFPZT7OXvzvBc3asY95Mr-g8x4'
SAMPLE_RANGE_NAME = 'Sheet1!A1:Q200'  # Modify this range as per your needs

database = []
result = []
sheet_ids = []
entry_count = 0

def get_sheet_ids(service, spreadsheet_id):
    """Gets the ids and title of all sheets or tabs of a google sheets file"""
    sheet_ids = []
    # Retrieve the list of sheets in the spreadsheet
    sheets = service.spreadsheets().get(spreadsheetId=spreadsheet_id).execute().get('sheets', [])
    for sheet in sheets:
        title = sheet['properties']['title']
        id = sheet['properties']['sheetId']
        sheet_ids.append({"title": title, "id": id}) 
    
    return sheet_ids

def get_service():
    """Shows basic usage of the Sheets API.
    Prints values from a sample spreadsheet.
    """
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
                'credentials.json', SCOPES)
            creds = flow.run_local_server(port=0)
            # Save the credentials for the next run
            with open('token.json', 'w') as token:
                token.write(creds.to_json())

    service = build('sheets', 'v4', credentials=creds)
    return service

def read_sheet(service, spreadsheet_id, range_name):
    """Reads data from a specific Google Sheet."""
    sheet_title = range_name
    range_name = range_name+"!A1:Q150"
    try:
        sheet = service.spreadsheets()
        result = sheet.values().get(spreadsheetId=spreadsheet_id,
                                    range=range_name).execute()
        values = result.get('values', [])

        if not values:
            print('No data found.')
        else:
            for row in values:
                row.append(sheet_title)
            #for row in values:
            #    # Print columns A and B, which correspond to indices 0 and 1.
            #   print(', '.join(row))
            return values

    except HttpError as error:
        print(f"An error occurred: {error}")

def read_sheets(service, spreadsheet_id, sheet_ids):
    values = []
    for sheet_id in sheet_ids:
        values.extend(read_sheet(service, spreadsheet_id, sheet_id['title']))

    return values

def create_credit_entries(values, page_ids):
    #print(values)
    credit_entries = []
    for row in values:
        if row[0] == 'G':
            headers=row.copy()
        if not row or len(row) < 1:
            continue
        elif not row[0].isdigit():
            continue
        #print(row)
        nachname = row[1]
        vorname = row[2]
        name = vorname+" "+nachname
        semester = headers[len(headers)-1]
        for index, value in enumerate(row[3:], start=3):
            if value not in ["", '0'] and value.isdigit():  # If the value is not empty or zero
                if headers[index] != 'Summe':
                    credit_entries.append([get_page_id(page_ids,name), value, headers[index], semester])

    return credit_entries

def get_page_id(page_ids, name):
    for page_id in page_ids:
        if page_id[0] == name:
            return page_id[1]
    return name


def send_data_to_notion(credit_entries):
    for entry in credit_entries:
        entry_count = 0
        data = {
            "parent": {"database_id": NOTION_DATABASE_ID},
            "properties": {
                "Scholar": { "relation": [{"id": entry[0]}]},
                "Credits": {"number": int(entry[1])},
                "Project": {"select": {"name": entry[2]}},
                "Semester": {"select": {"name": entry[3]}}
            }
        }
        entry_count += 1
        response = requests.post("https://api.notion.com/v1/pages", headers=NOTION_REQUEST_HEADER, data=json.dumps(data))
        response_content = response.json()
        #Check if response is error and print it out
        if response_content.get("object") == "error":
            print(response_content)
            
    return entry_count

def get_people_page_data(notion_people_database_id):
    # Query the database to retrieve all pages
    response = requests.post(f'https://api.notion.com/v1/databases/{notion_people_database_id}/query', headers=NOTION_REQUEST_HEADER, json={})
    page_ids = []
    entries = []
    # Ensure the request was successful
    if response.status_code == 200:
        one_request_entries = response.json()["results"]
        request_count = 1
        entries.extend(one_request_entries)
        #one request to notion returns max 100 entries
        while response.json()["has_more"]:
            last_id = one_request_entries[-1]['id']
            payload = {"start_cursor": last_id}
            response = requests.post(f'https://api.notion.com/v1/databases/{notion_people_database_id}/query', headers=NOTION_REQUEST_HEADER, json=payload)
            one_request_entries = response.json()["results"]
            entries.extend(one_request_entries)
            request_count += 1
            #Safeguard against infinite loop
            if(request_count > 10):
                break

        # Write the data to output.json
        with open('output.json', 'w') as outfile:
            json.dump(response.json(), outfile, indent=4)
        for entry in entries:
            page_id = entry["id"]
            # Extracting the name from the "Name" property (assuming it's a title property)
            name = entry["properties"]["Name"]["title"][0]["plain_text"]
            page_ids.append([name,page_id])
            #print(f"ID: {page_id} | Name: {name}")
        
    else:
        print(f"Failed to retrieve entries. Error: {response.text}")
    
    return page_ids

def main():
    service = get_service()
    sheet_ids = get_sheet_ids(service, SPREADSHEET_ID)
    values = read_sheets(service, SPREADSHEET_ID, sheet_ids)
    page_ids = get_people_page_data(NOTION_PEOPLE_DATABASE_ID)
    print(len(page_ids))
    entry_count = 0
    credit_entries = create_credit_entries(values, page_ids)
    #for credit_entry in credit_entries:
       #print(credit_entry)
    entry_count = send_data_to_notion(credit_entries)
    print("Added "+str(entry_count)+" entries to notion sucessfully")

if __name__ == '__main__':
    main()
