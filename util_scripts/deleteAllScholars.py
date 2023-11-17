from __future__ import print_function
import requests
import json

import os.path

from dotenv import load_dotenv

# Load environment variables from the .env file
load_dotenv()

NOTION_SECRET_API_KEY = os.environ.get("NOTION_SECRET_API_KEY")

NOTION_CREDITS_DATABASE_ID = '3e8172d8079a466fa027356895626e0a'

NOTION_SCHOLARS_DATABASE_ID = '258576df97e347fa89b0ab2b237d3118'

NOTION_REQUEST_HEADER = {
    "Authorization": f"Bearer {NOTION_SECRET_API_KEY}",
    "Notion-Version": "2022-06-28",
    "Content-Type": "application/json"
}

def get_people_page_ids():
    # Query the database to retrieve all pages
    response = requests.post(f'https://api.notion.com/v1/databases/{NOTION_SCHOLARS_DATABASE_ID}/query', headers=NOTION_REQUEST_HEADER, json={})
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
            response = requests.post(f'https://api.notion.com/v1/databases/{NOTION_SCHOLARS_DATABASE_ID}/query', headers=NOTION_REQUEST_HEADER, json=payload)
            one_request_entries = response.json()["results"]
            entries.extend(one_request_entries)
            request_count += 1
            #Safeguard against infinite loop
            if(request_count > 10):
                break

        for entry in entries:
            page_id = entry["id"]
            page_ids.append(page_id)
            #print(f"ID: {page_id} | Name: {name}")
        
    else:
        print(f"Failed to retrieve entries. Error: {response.text}")
    
    print(page_ids)
    return page_ids

def delete_all_scholars(ids):
    data = {
        "archived": True
    }
    for id in ids:
        response = requests.patch(f'https://api.notion.com/v1/pages/{id}', headers=NOTION_REQUEST_HEADER, data=json.dumps(data))
       

def main():
    ids = get_people_page_ids()
    delete_all_scholars(ids)

if __name__ == '__main__':
    main()
