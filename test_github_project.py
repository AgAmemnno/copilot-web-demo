import unittest
from github_project import create_github_project, add_columns_to_project, add_cards_to_column

class TestGithubProject(unittest.TestCase):

    def setUp(self):
        self.token = "YOUR_GITHUB_TOKEN"
        self.owner = "YOUR_GITHUB_OWNER"
        self.repo = "YOUR_GITHUB_REPO"
        self.project_name = "Test Project"
        self.project_body = "This is a test project"
        self.columns = ["To Do", "In Progress", "Done"]
        self.cards = ["Task 1", "Task 2", "Task 3"]

    def test_create_github_project(self):
        project_id = create_github_project(self.token, self.owner, self.repo, self.project_name, self.project_body)
        self.assertIsNotNone(project_id)

    def test_add_columns_to_project(self):
        project_id = create_github_project(self.token, self.owner, self.repo, self.project_name, self.project_body)
        for column in self.columns:
            column_id = add_columns_to_project(self.token, project_id, column)
            self.assertIsNotNone(column_id)

    def test_add_cards_to_column(self):
        project_id = create_github_project(self.token, self.owner, self.repo, self.project_name, self.project_body)
        for column in self.columns:
            column_id = add_columns_to_project(self.token, project_id, column)
            for card in self.cards:
                card_id = add_cards_to_column(self.token, column_id, card)
                self.assertIsNotNone(card_id)

if __name__ == '__main__':
    unittest.main()
