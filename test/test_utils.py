import os
import shutil
import pytest
from src.utils import clone_github_repo, list_files_recursive, count_lines_in_file, analyze_repo_files, get_tmp_dir, create_tmp_file, estimate_lc_by_filetype, estimate_lc_by_commit_message
import git


def test_clone_and_analyze():
    tmpdir = get_tmp_dir()
    # プロジェクトディレクトリの一つ上の階層にmswリポジトリがある前提でパスを取得
    from src.utils import get_project_root
    msw_repo_path = get_project_root().parent / "msw"
    assert msw_repo_path.exists()
    files = list_files_recursive(msw_repo_path)
    assert "README" in "".join(files) or "README.md" in "".join(files)
    analysis = analyze_repo_files(msw_repo_path)
    assert isinstance(analysis, list)
    assert all("path" in f and "lines" in f for f in analysis)


def test_count_lines_in_file():
    tmpdir = get_tmp_dir()
    file_path = create_tmp_file("test.txt", "a\nb\nc\n")
    assert count_lines_in_file(file_path) == 3


def test_md_file_is_L():
    result = estimate_lc_by_filetype('README.md')
    assert result['lc_type'] == 'L'
    assert result['confidence'] >= 0.8


def test_js_file_is_neutral():
    result = estimate_lc_by_filetype('src/components/Button.js')
    assert result['lc_type'] in ['Neutral', 'C']
    assert 0.4 <= result['confidence'] <= 0.7


def test_testjs_file_is_L():
    result = estimate_lc_by_filetype('src/components/Button.test.js')
    assert result['lc_type'] == 'L'
    assert result['confidence'] >= 0.85


def test_feature_file_is_L():
    result = estimate_lc_by_filetype('features/authentication/login.feature')
    assert result['lc_type'] == 'L'
    assert result['confidence'] >= 0.75


def test_docs_rst_file_is_L():
    result = estimate_lc_by_filetype('docs/usage/advanced_guide.rst')
    assert result['lc_type'] == 'L'
    assert result['confidence'] >= 0.8


def test_src_features_ts_is_C_or_neutral():
    result = estimate_lc_by_filetype('src/features/new-checkout/PaymentProcessor.ts')
    assert result['lc_type'] in ['C', 'Neutral']
    if result['lc_type'] == 'C':
        assert result['confidence'] >= 0.5
    else:
        assert result['confidence'] >= 0.4


def test_package_json_is_L():
    result = estimate_lc_by_filetype('package.json')
    assert result['lc_type'] == 'L'
    assert result['confidence'] >= 0.6


def test_css_file_is_L_or_neutral():
    result = estimate_lc_by_filetype('styles/main.css')
    assert result['lc_type'] in ['L', 'Neutral']
    assert result['confidence'] >= 0.4


def test_swagger_yaml_is_C():
    result = estimate_lc_by_filetype('api/v1/swagger.yaml')
    assert result['lc_type'] == 'C'
    assert result['confidence'] >= 0.7


def test_unknown_ext_is_neutral():
    result = estimate_lc_by_filetype('src/core/data.unknownext')
    assert result['lc_type'] == 'Neutral'
    assert result['confidence'] <= 0.3


def test_filename_only_js():
    result = estimate_lc_by_filetype('utils.js')
    assert result['lc_type'] in ['Neutral', 'C']
    assert result['confidence'] >= 0.4


def test_empty_path():
    result = estimate_lc_by_filetype('')
    assert result['lc_type'] == 'Neutral'
    assert result['confidence'] <= 0.2


def test_mixed_case_test_file():
    result = estimate_lc_by_filetype('src/Components/MyComponent.TEST.JS')
    assert result['lc_type'] == 'L'
    assert result['confidence'] >= 0.85


def test_deep_test_file():
    result = estimate_lc_by_filetype('project/modules/feature_x/sub_module_y/tests/integration/api.spec.ts')
    assert result['lc_type'] == 'L'
    assert result['confidence'] >= 0.85


def test_dockerfile_is_L():
    result = estimate_lc_by_filetype('Dockerfile')
    assert result['lc_type'] == 'L'
    assert result['confidence'] >= 0.6


def test_github_actions_yml_is_L():
    result = estimate_lc_by_filetype('.github/workflows/ci.yml')
    assert result['lc_type'] == 'L'
    assert result['confidence'] >= 0.65


def test_html_file_is_neutral():
    result = estimate_lc_by_filetype('public/index.html')
    assert result['lc_type'] == 'Neutral'
    assert result['confidence'] >= 0.4


def test_svg_asset_is_neutral():
    result = estimate_lc_by_filetype('assets/logo.svg')
    assert result['lc_type'] == 'Neutral'
    assert result['confidence'] >= 0.3


def test_shell_script_is_L():
    result = estimate_lc_by_filetype('scripts/setup.sh')
    assert result['lc_type'] == 'L'
    assert result['confidence'] >= 0.5


def test_msw_repo_file_list_and_commits():
    from src.utils import get_project_root
    msw_repo_path = get_project_root().parent / "msw"
    assert msw_repo_path.exists()
    repo = git.Repo(str(msw_repo_path))
    # ファイル一覧取得
    files = [item.path for item in repo.tree().traverse() if item.type == 'blob']
    assert any(f.endswith('README.md') for f in files)
    # コミット履歴取得
    commits = list(repo.iter_commits('HEAD', max_count=5))
    assert len(commits) > 0
    for commit in commits:
        print(f"{commit.hexsha[:7]} {commit.author.name}: {commit.summary}")


def test_feat_commit_is_C():
    msg = 'feat: add new login API'
    result = estimate_lc_by_commit_message(msg)
    assert result['lc_type'] == 'C'
    assert result['lc_score'] >= 1.5
    assert result['confidence'] >= 0.8
    assert result['matched_keyword'] == 'feat'
    assert 'Conventional Commit type: feat' in result['reason']


def test_fix_commit_is_L():
    msg = 'fix: correct typo in README'
    result = estimate_lc_by_commit_message(msg)
    assert result['lc_type'] == 'L'
    assert result['lc_score'] <= -1.5
    assert result['confidence'] >= 0.8
    assert result['matched_keyword'] == 'fix'


def test_refactor_commit_is_L():
    msg = 'refactor(auth): improve token validation'
    result = estimate_lc_by_commit_message(msg)
    assert result['lc_type'] == 'L'
    assert result['lc_score'] <= -1.0
    assert result['confidence'] >= 0.7
    assert result['matched_keyword'] == 'refactor'


def test_docs_commit_is_L():
    msg = 'docs: update usage examples'
    result = estimate_lc_by_commit_message(msg)
    assert result['lc_type'] == 'L'
    assert result['lc_score'] <= -1.0
    assert result['confidence'] >= 0.7
    assert result['matched_keyword'] == 'docs'


def test_test_commit_is_L():
    msg = 'test: add unit tests for API client'
    result = estimate_lc_by_commit_message(msg)
    assert result['lc_type'] == 'L'
    assert result['lc_score'] <= -1.5
    assert result['confidence'] >= 0.8
    assert result['matched_keyword'] == 'test'


def test_chore_commit_is_L_or_neutral():
    msg = 'chore: update dependencies'
    result = estimate_lc_by_commit_message(msg)
    if result['lc_score'] < 0:
        assert result['lc_type'] == 'L'
    else:
        assert result['lc_type'] == 'Neutral'
    assert result['lc_score'] <= 0
    assert result['lc_score'] >= -1.0
    assert result['confidence'] >= 0.5
    assert result['matched_keyword'] == 'chore'


def test_uppercase_feat():
    msg = 'FEAT: Implement dark mode'
    result = estimate_lc_by_commit_message(msg)
    assert result['lc_type'] == 'C'
    assert result['lc_score'] >= 1.5
    assert result['matched_keyword'] == 'feat'


def test_scope_and_breaking_marker():
    msg = 'feat(api)!: introduce new user endpoint, breaks old one'
    result = estimate_lc_by_commit_message(msg)
    assert result['lc_type'] == 'C'
    assert result['lc_score'] >= 1.5
    assert result['matched_keyword'] == 'feat'


def test_multiple_keywords_conventional_priority():
    msg = 'fix: correct bug and add new logging feature'
    result = estimate_lc_by_commit_message(msg)
    assert result['lc_type'] == 'L'
    assert result['lc_score'] <= -1.5
    assert result['matched_keyword'] == 'fix'


def test_general_C_keyword():
    msg = 'Implement new search algorithm for better performance'
    result = estimate_lc_by_commit_message(msg)
    assert result['lc_type'] == 'C'
    assert result['lc_score'] >= 1.0
    assert result['confidence'] >= 0.5
    assert result['reason'].startswith('General keyword:')
    assert result['matched_keyword'] in ['implement', 'new']


def test_general_L_keyword():
    msg = 'Cleanup unused code and improve readability'
    result = estimate_lc_by_commit_message(msg)
    assert result['lc_type'] == 'L'
    assert result['lc_score'] <= -0.5
    assert result['confidence'] >= 0.5
    assert result['reason'].startswith('General keyword:')
    assert result['matched_keyword'] in ['cleanup', 'improve']


def test_no_strong_keyword():
    msg = 'Update README'
    result = estimate_lc_by_commit_message(msg)
    if -0.75 < result['lc_score'] < 0.75:
        assert result['lc_type'] == 'Neutral'
    else:
        assert result['lc_type'] == 'L'
    assert result['confidence'] >= 0.1


def test_empty_message():
    msg = ''
    result = estimate_lc_by_commit_message(msg)
    assert result['lc_type'] == 'Neutral'
    assert result['lc_score'] == 0
    assert result['confidence'] <= 0.1
    assert 'No specific LC keyword found' in result['reason']


def test_long_message_with_keyword_at_start():
    msg = 'feat: This is a very long commit message describing a new feature that does a lot of things and has many details, but the keyword is at the beginning.'
    result = estimate_lc_by_commit_message(msg)
    assert result['lc_type'] == 'C'
    assert result['lc_score'] >= 1.5
    assert result['matched_keyword'] == 'feat'


def test_perf_commit():
    msg = 'perf: optimize image loading'
    result = estimate_lc_by_commit_message(msg)
    assert result['lc_type'] == 'L'
    assert -1.5 <= result['lc_score'] <= -0.5
    assert result['matched_keyword'] == 'perf'


def test_build_commit():
    msg = 'build: update webpack configuration'
    result = estimate_lc_by_commit_message(msg)
    assert result['lc_type'] == 'L'
    assert -1.0 <= result['lc_score'] <= 0
    assert result['matched_keyword'] == 'build'


def test_ci_commit():
    msg = 'ci: fix pipeline script error'
    result = estimate_lc_by_commit_message(msg)
    assert result['lc_type'] == 'L'
    assert -1.0 <= result['lc_score'] <= 0
    assert result['matched_keyword'] == 'ci'


def test_revert_commit():
    msg = 'Revert "feat: add experimental feature X"'
    result = estimate_lc_by_commit_message(msg)
    assert result['lc_type'] == 'L'
    assert -1.5 <= result['lc_score'] <= -0.5
    assert result['matched_keyword'] == 'revert'


def test_initial_commit():
    msg = 'Initial commit'
    result = estimate_lc_by_commit_message(msg)
    assert result['lc_type'] == 'C'
    assert 0.5 <= result['lc_score'] <= 1.5
    assert result['matched_keyword'] == 'initial'


def test_add_commit():
    msg = 'Add user profile page'
    result = estimate_lc_by_commit_message(msg)
    assert result['lc_type'] == 'C'
    assert 0.5 <= result['lc_score'] <= 1.5
    assert result['matched_keyword'] == 'add'


def test_hotfix_commit():
    msg = 'HOTFIX: Critical issue in production'
    result = estimate_lc_by_commit_message(msg)
    assert result['lc_type'] == 'L'
    assert -2.0 <= result['lc_score'] <= -1.5
    assert result['matched_keyword'] == 'hotfix'
    assert result['reason'].startswith('General keyword:')

def test_prototype_commit():
    msg = 'Prototype new dashboard UI'
    result = estimate_lc_by_commit_message(msg)
    assert result['lc_type'] == 'C'
    assert 1.5 <= result['lc_score'] <= 2.0
    assert result['matched_keyword'] == 'prototype'
    assert result['reason'].startswith('General keyword:')

def test_code_changes_new_file_strong_C():
    from src.utils import estimate_lc_by_code_changes
    diff_stats = { 'added_lines': 200, 'deleted_lines': 10, 'is_new_file': True }
    result = estimate_lc_by_code_changes(diff_stats)
    assert result['lc_type'] == 'C'
    assert result['confidence'] > 0.8
    assert result['lc_score'] > 1.5


def test_code_changes_minor_L():
    from src.utils import estimate_lc_by_code_changes
    diff_stats = { 'added_lines': 5, 'deleted_lines': 30, 'is_new_file': False }
    result = estimate_lc_by_code_changes(diff_stats)
    assert result['lc_type'] == 'L'
    assert result['confidence'] > 0.55
    assert result['lc_score'] < 0.0


def test_code_changes_neutral():
    from src.utils import estimate_lc_by_code_changes
    diff_stats = { 'added_lines': 0, 'deleted_lines': 0, 'is_new_file': False }
    result = estimate_lc_by_code_changes(diff_stats)
    assert result['lc_type'] == 'Neutral'
    assert result['confidence'] == 0.0 or result['confidence'] < 0.4
    assert result['lc_score'] == 0


def test_code_changes_significant_addition():
    from src.utils import estimate_lc_by_code_changes
    diff_stats = { 'added_lines': 150, 'deleted_lines': 5, 'is_new_file': False }
    result = estimate_lc_by_code_changes(diff_stats)
    assert result['lc_type'] == 'C'
    assert result['confidence'] > 0.7
    assert result['lc_score'] > 1


def test_code_changes_significant_deletion():
    from src.utils import estimate_lc_by_code_changes
    diff_stats = { 'added_lines': 5, 'deleted_lines': 150, 'is_new_file': False }
    result = estimate_lc_by_code_changes(diff_stats)
    assert result['lc_type'] == 'L'
    assert result['confidence'] > 0.7
    assert result['lc_score'] < -1


def test_code_changes_new_file_minor_C():
    from src.utils import estimate_lc_by_code_changes
    diff_stats = { 'added_lines': 10, 'deleted_lines': 2, 'is_new_file': True }
    result = estimate_lc_by_code_changes(diff_stats)
    assert result['lc_type'] == 'C'
    assert result['confidence'] > 0.8
    assert result['lc_score'] > 1


def test_code_changes_equal_add_del_neutral():
    from src.utils import estimate_lc_by_code_changes
    diff_stats = { 'added_lines': 50, 'deleted_lines': 50, 'is_new_file': False }
    result = estimate_lc_by_code_changes(diff_stats)
    assert result['lc_type'] == 'Neutral'
    assert result['confidence'] > 0.3
    assert abs(result['lc_score']) < 0.1


def test_code_changes_large_new_file():
    from src.utils import estimate_lc_by_code_changes
    diff_stats = { 'added_lines': 500, 'deleted_lines': 100, 'is_new_file': True }
    result = estimate_lc_by_code_changes(diff_stats)
    assert result['lc_type'] == 'C'
    assert result['confidence'] > 0.9
    assert result['lc_score'] > 2


# --- 統合テスト用モックデータ ---
MOCK_SCENARIO_1 = {
    "files": [
        {"path": "src/components/Login.js", "type": "file"},
        {"path": "src/utils/auth.js", "type": "file"}
    ],
    "commit": {
        "message": "feat: Implement user login functionality",
        "author": {"name": "John Doe"},
        "sha": "abcdef123456"
    },
    "diff": {
        "added_lines": 200,
        "deleted_lines": 5,
        "files": [
            {"path": "src/components/Login.js", "additions": 200, "deletions": 5}
        ]
    }
}

MOCK_SCENARIO_2 = {
    "files": [
        {"path": "src/components/UserProfile.js", "type": "file"}
    ],
    "commit": {
        "message": "fix: Correct display error in user profile",
        "author": {"name": "Jane Doe"},
        "sha": "123456abcdef"
    },
    "diff": {
        "added_lines": 10,
        "deleted_lines": 50,
        "files": [
            {"path": "src/components/UserProfile.js", "additions": 10, "deletions": 50}
        ]
    }
}

MOCK_SCENARIO_3 = {
    "files": [
        {"path": "docs/API.md", "type": "file"}
    ],
    "commit": {
        "message": "docs: Update API documentation",
        "author": {"name": "Alice"},
        "sha": "fedcba654321"
    },
    "diff": {
        "added_lines": 50,
        "deleted_lines": 20,
        "files": [
            {"path": "docs/API.md", "additions": 50, "deletions": 20}
        ]
    }
}

def test_integration_scenario_1_new_feature_with_mock():
    """
    MOCK_SCENARIO_1を使った統合テスト
    """
    from src.utils import estimate_lc_by_filetype, estimate_lc_by_commit_message, estimate_lc_by_code_changes
    files = [f["path"] for f in MOCK_SCENARIO_1["files"]]
    filetype_scores = [estimate_lc_by_filetype(f) for f in files]
    commit_result = estimate_lc_by_commit_message(MOCK_SCENARIO_1["commit"]["message"])
    code_result = estimate_lc_by_code_changes({
        'added_lines': MOCK_SCENARIO_1["diff"]["added_lines"],
        'deleted_lines': MOCK_SCENARIO_1["diff"]["deleted_lines"],
        'is_new_file': False
    })
    total_score = commit_result['lc_score'] + code_result['lc_score'] + sum(0.7 for _ in files)
    assert commit_result['lc_type'] == 'C'
    assert code_result['lc_type'] == 'C'
    assert all(f['lc_type'] in ['C', 'Neutral', 'L'] for f in filetype_scores)
    assert total_score > 3.5
