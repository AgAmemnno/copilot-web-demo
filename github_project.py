import requests

def create_github_project(token, owner, repo, name, body):
    url = "https://api.github.com/graphql"
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    query = """
    mutation {
        createProjectV2(input: {ownerId: "%s", title: "%s", body: "%s"}) {
            projectV2 {
                id
            }
        }
    }
    """ % (owner, name, body)
    response = requests.post(url, headers=headers, json={"query": query})
    if response.status_code != 200:
        raise Exception(f"Error creating project: {response.status_code} - {response.text}")
    return response.json()["data"]["createProjectV2"]["projectV2"]["id"]

def add_columns_to_project(token, project_id, columns):
    url = "https://api.github.com/graphql"
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    for column in columns:
        query = """
        mutation {
            addProjectV2ItemById(input: {projectId: "%s", contentId: "%s"}) {
                projectV2Item {
                    id
                }
            }
        }
        """ % (project_id, column)
        response = requests.post(url, headers=headers, json={"query": query})
        if response.status_code != 200:
            raise Exception(f"Error adding column: {response.status_code} - {response.text}")
        return response.json()["data"]["addProjectV2ItemById"]["projectV2Item"]["id"]

def add_cards_to_column(token, column_id, cards):
    url = "https://api.github.com/graphql"
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    for card in cards:
        query = """
        mutation {
            addProjectV2ItemById(input: {projectId: "%s", contentId: "%s"}) {
                projectV2Item {
                    id
                }
            }
        }
        """ % (column_id, card)
        response = requests.post(url, headers=headers, json={"query": query})
        if response.status_code != 200:
            raise Exception(f"Error adding card: {response.status_code} - {response.text}")
        return response.json()["data"]["addProjectV2ItemById"]["projectV2Item"]["id"]
