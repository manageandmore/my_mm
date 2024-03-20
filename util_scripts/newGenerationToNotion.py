from __future__ import print_function
import os.path


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

scholars = []

# Get the path to the current script's directory
script_directory = os.path.dirname(os.path.realpath(__file__))


def create_scholar_entry(generation, first_name, last_name, users):
    global scholars
    name = last_name+" "+first_name
    mail = cleanup_string(first_name)+"."+cleanup_string(last_name)+"@manageandmore.de"
    id = users.get(mail)
    scholars.append([name, generation, mail, id])
    scholars = remove_duplicates(scholars)
    return
    

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

        has_more = response_content.get("has_more")
        start_cursor = response_content.get("next_cursor")

        for user in response_content.get("results"):
            if user.get("type") == "person":
                users[user.get("person").get("email")] = user.get("id")
        #for debug purposes only
        #print(users)
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
            print("added scholar " + scholar[0] + " to the notion database")
            entry_count += 1

    return entry_count

def remove_duplicates(lst):
    result = []
    for item in lst:
        if item not in result:
            result.append(item)
    return result


def main():
    while True:
        try:
            entry_count = int(input("Please enter the amount of scholars: "))
            break
        except ValueError:
            print("That's not a valid number! Please try again.")
    while True:
        try:
            generation = int(input("Please enter the generation (only the number G40->40): "))
            break
        except ValueError:
            print("That's not a valid number! Please try again.")
    print("Now please enter the information for each scholar. For more than one first name please combine the names with a -")
    users = get_all_notion_users()
    for i in range(entry_count):
        print("Please enter the following information for scholar "+str(i+1))
        last_name = input("Last Name: ")
        first_name = input("First Name: ")
        create_scholar_entry(generation, first_name, last_name, users)

    for scholar in scholars:
        print(scholar)
    entry_count = 0
    entry_count = send_scholars_to_notion(scholars, NOTION_SCHOLAR_DATABASE_ID)
    print("Added "+str(entry_count)+" entries to notion scholar database sucessfully")
    
if __name__ == '__main__':
    main()
