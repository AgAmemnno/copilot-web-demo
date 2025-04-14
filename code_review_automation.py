import requests

class CodeReviewAutomation:
    def __init__(self):
        self.base_url = "https://api.github.com"

    def _get_headers(self, token):
        return {
            "Authorization": f"token {token}",
            "Accept": "application/vnd.github.v3+json"
        }

    def notify_reviewers(self, token, repo_name, pull_number):
        url = f"{self.base_url}/repos/{repo_name}/pulls/{pull_number}/requested_reviewers"
        headers = self._get_headers(token)
        response = requests.post(url, headers=headers)
        if response.status_code != 201:
            raise Exception(f"Error notifying reviewers: {response.status_code} - {response.text}")
        return response.json()

    def add_comment(self, token, repo_name, pull_number, comment):
        url = f"{self.base_url}/repos/{repo_name}/issues/{pull_number}/comments"
        headers = self._get_headers(token)
        data = {
            "body": comment
        }
        response = requests.post(url, headers=headers, json=data)
        if response.status_code != 201:
            raise Exception(f"Error adding comment: {response.status_code} - {response.text}")
        return response.json()

    def auto_merge(self, token, repo_name, pull_number, commit_message=None):
        url = f"{self.base_url}/repos/{repo_name}/pulls/{pull_number}/merge"
        headers = self._get_headers(token)
        data = {
            "commit_message": commit_message
        }
        response = requests.put(url, headers=headers, json=data)
        if response.status_code != 200:
            raise Exception(f"Error merging pull request: {response.status_code} - {response.text}")
        return response.json()
