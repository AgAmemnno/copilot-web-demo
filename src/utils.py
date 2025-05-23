import os
import subprocess
from pathlib import Path

import json
import datetime
from google.oauth2 import service_account
from googleapiclient.discovery import build
import re

LOCAL = False
try:
    from google.colab import drive # Google Driveにアクセスするため
    from google.colab import userdata # Secretsにアクセスするため
    from google.colab import auth # Google認証用
except ImportError:
    LOCAL = True
    from dotenv import load_dotenv

def list_calendars(service):
    calendar_list = service.calendarList().list().execute()
    calendars = calendar_list.get('items', [])
    return calendars


def credentials():
    """
    Google APIの認証情報を取得する。
    """
    SCOPES = [
        'https://www.googleapis.com/auth/calendar',
        'https://www.googleapis.com/auth/tasks',
        'https://www.googleapis.com/auth/keep',
        'https://www.googleapis.com/auth/drive'
    ]
    if LOCAL:
        load_dotenv()  # .envファイルを読み込む
        SERVICE_ACCOUNT_FILE = os.getenv('GOOGLE_APPLICATION_CREDENTIALS_JSON')
        credentials = service_account.Credentials.from_service_account_file(SERVICE_ACCOUNT_FILE, scopes=SCOPES)
    else:
        SERVICE_ACCOUNT_FILE = userdata.get('GOOGLE_APPLICATION_CREDENTIALS_JSON')
        SERVICE_ACCOUNT_FILE = json.loads(SERVICE_ACCOUNT_FILE[1:-3].replace("\n","\\n"))
        credentials = service_account.Credentials.from_service_account_info(SERVICE_ACCOUNT_FILE, scopes=SCOPES)
    
    service = build('calendar', 'v3', credentials=credentials)
    print(list_calendars(service))
    print(f"service from {SERVICE_ACCOUNT_FILE} {service}")


credentials()

def clone_github_repo(repo_url: str, dest_dir: str) -> Path:
    """
    指定したGitHubリポジトリをdest_dirにクローンする。
    既に存在する場合は何もしない。
    """
    dest = Path(dest_dir)
    if not dest.exists():
        subprocess.run(["git", "clone", repo_url, dest_dir], check=True)
    return dest

def list_files_recursive(base_dir: str):
    """
    指定ディレクトリ以下の全ファイルパスを再帰的にリストアップする。
    """
    file_list = []
    for root, _, files in os.walk(base_dir):
        for f in files:
            file_list.append(os.path.relpath(os.path.join(root, f), base_dir))
    return file_list

def count_lines_in_file(file_path: str) -> int:
    """
    ファイルの行数をカウントする。
    """
    with open(file_path, encoding="utf-8", errors="ignore") as f:
        return sum(1 for _ in f)

def analyze_repo_files(base_dir: str):
    """
    ディレクトリ以下の全ファイルのパスと行数を返す。
    """
    files = list_files_recursive(base_dir)
    return [{"path": f, "lines": count_lines_in_file(os.path.join(base_dir, f))} for f in files]

def get_project_root():
    """
    プロジェクトのルートディレクトリ（copilot-web-demo）を返す。
    このutils.pyがsrc/配下にある前提で、その親ディレクトリを返す。
    """
    return Path(__file__).resolve().parent.parent

def get_tmp_dir():
    """
    プロジェクトルート配下に'tmp'ディレクトリを作成し、そのPathを返す。
    存在しない場合は作成する。
    """
    project_root = get_project_root()
    tmp_dir = project_root / "tmp"
    tmp_dir.mkdir(exist_ok=True)
    return tmp_dir


def create_tmp_file(filename: str, content: str = "") -> Path:
    """
    tmpディレクトリ内に一時ファイルを作成し、そのPathを返す。
    """
    tmp_dir = get_tmp_dir()
    file_path = tmp_dir / filename
    with open(file_path, "w", encoding="utf-8") as f:
        f.write(content)
    return file_path

def estimate_lc_by_filetype(file_path: str) -> dict:
    """
    ファイルパスから拡張子や命名規則、パス構造に基づいてLC特性を推定する。
    Returns: {'lc_type': 'L' or 'C' or 'Neutral', 'confidence': float}
    """
    import os
    filename = os.path.basename(file_path).lower()
    ext = os.path.splitext(filename)[1].lower()
    path_lower = file_path.lower()

    # テストコード
    test_patterns = [r'\.test\.(js|ts|jsx|tsx)$', r'\.spec\.(js|ts|jsx|tsx)$', r'_test\.(py|go)$', r'test_.*\.py$', r'^test_.*\.py$', r'tests?\.py$', r'\.feature$']
    test_paths = ['tests/', 'test/', 'spec/', '__tests__/', 'e2e/']
    if any(re.search(pattern, filename) for pattern in test_patterns) or any(tp in path_lower for tp in test_paths):
        return {'lc_type': 'L', 'confidence': 0.9}

    # ドキュメント
    doc_extensions = ['.md', '.rst', '.txt', '.asciidoc', '.adoc', '.wiki']
    doc_filenames_exact = ['readme', 'license', 'contributing', 'changelog', 'history', 'authors', 'todo', 'install', 'copying']
    doc_filenames_contain = ['guide', 'manual', 'documentation', 'faq']
    doc_paths = ['docs/', 'doc/', 'documentation/']
    if ext in doc_extensions or any(filename.startswith(name) for name in doc_filenames_exact) or any(name in filename for name in doc_filenames_contain) or any(dp in path_lower for dp in doc_paths):
        return {'lc_type': 'L', 'confidence': 0.85}

    # API定義
    api_def_extensions = ['.graphql', '.gql']
    api_def_filenames = ['swagger.json', 'swagger.yaml', 'swagger.yml', 'openapi.json', 'openapi.yaml', 'openapi.yml', 'api.raml']
    if ext in api_def_extensions or filename in api_def_filenames:
        return {'lc_type': 'C', 'confidence': 0.75}

    # 設定/構成/CI/CD
    config_extensions = ['.yml', '.yaml', '.json', '.xml', '.ini', '.toml', '.conf', '.cfg', '.properties', '.env']
    config_filenames_exact = [
        'dockerfile', 'docker-compose.yml', 'makefile', 'rakefile', 'gemfile', 'setup.py',
        'package.json', 'package-lock.json', 'yarn.lock', 'composer.json', 'composer.lock',
        'pom.xml', 'build.gradle', 'settings.gradle', 'requirements.txt', 'pipfile',
        '.editorconfig', '.prettierrc', '.eslintrc', '.babelrc', 'tsconfig.json',
        'webpack.config.js', 'vite.config.js', 'rollup.config.js', 'jest.config.js',
        'pyproject.toml', 'cargo.toml', 'go.mod', 'go.sum',
        'jenkinsfile', '.gitlab-ci.yml', '.travis.yml'
    ]
    cicd_paths = ['.github/workflows/']
    if filename in config_filenames_exact:
        return {'lc_type': 'L', 'confidence': 0.7}
    if ext in config_extensions and ext != '.json':
        return {'lc_type': 'L', 'confidence': 0.65}
    if any(cp in path_lower for cp in cicd_paths) and ext in ['.yml', '.yaml']:
        return {'lc_type': 'L', 'confidence': 0.8}

    # スタイルシート
    style_extensions = ['.css', '.scss', '.sass', '.less', '.styl', '.pcss']
    if ext in style_extensions:
        return {'lc_type': 'L', 'confidence': 0.6}

    # スクリプト
    script_extensions = ['.sh', '.bash', '.ps1', '.bat', '.cmd', '.py', '.rb', '.pl', '.js']
    script_paths = ['scripts/', 'tools/', 'utils/']
    if any(sp in path_lower for sp in script_paths) and ext in script_extensions:
        if ext in ['.py', '.rb', '.js', '.ts'] and not any(sp in path_lower for sp in script_paths):
            pass
        else:
            return {'lc_type': 'L', 'confidence': 0.55}

    # HTML/テンプレート
    html_template_extensions = ['.html', '.htm', '.xhtml', '.erb', '.haml', '.slim', '.pug', '.hbs', '.mustache', '.ejs', '.vue', '.svelte']
    if ext in html_template_extensions:
        if ext in ['.vue', '.svelte']:
            return {'lc_type': 'Neutral', 'confidence': 0.45}
        return {'lc_type': 'Neutral', 'confidence': 0.5}

    # SQL/DB
    sql_extensions = ['.sql', '.ddl', '.dml']
    migration_paths = ['db/migrate/', 'migrations/']
    if ext in sql_extensions or any(mp in path_lower for mp in migration_paths):
        if 'schema.rb' in filename or 'structure.sql' in filename:
            return {'lc_type': 'L', 'confidence': 0.7}
        if any(mp in path_lower for mp in migration_paths):
            return {'lc_type': 'L', 'confidence': 0.65}
        return {'lc_type': 'Neutral', 'confidence': 0.5}

    # 主要ソースコード
    source_code_extensions = [
        '.js', '.jsx', '.ts', '.tsx', '.py', '.pyw', '.java', '.kt', '.scala', '.groovy',
        '.cs', '.fs', '.vb', '.c', '.cpp', '.h', '.hpp', '.m', '.mm', '.go', '.rb', '.php',
        '.swift', '.rs', '.dart', '.lua', '.pl', '.clj', '.cljs', '.ex', '.exs'
    ]
    if ext in source_code_extensions:
        if 'features/' in path_lower or 'services/' in path_lower or 'modules/' in path_lower or 'api/' in path_lower:
            return {'lc_type': 'C', 'confidence': 0.55}
        if 'utils/' in path_lower or 'helpers/' in path_lower or 'lib/' in path_lower or 'core/' in path_lower:
            return {'lc_type': 'Neutral', 'confidence': 0.5}
        if 'ui/' in path_lower or 'components/' in path_lower or 'views/' in path_lower:
            return {'lc_type': 'C', 'confidence': 0.5}
        return {'lc_type': 'Neutral', 'confidence': 0.4}

    # 画像/アセット
    asset_extensions = ['.png', '.jpg', '.jpeg', '.gif', '.bmp', '.tiff', '.webp', '.svg', '.ico', '.woff', '.woff2', '.ttf', '.otf', '.eot', '.mp3', '.wav', '.aac', '.ogg', '.flac', '.mp4', '.mov', '.avi', '.webm', '.mkv', '.pdf', '.ps', '.obj', '.stl', '.fbx', '.gltf']
    asset_paths = ['assets/', 'static/', 'public/', 'images/', 'img/', 'fonts/']
    if ext in asset_extensions or any(ap in path_lower for ap in asset_paths):
        return {'lc_type': 'Neutral', 'confidence': 0.3}

    # データファイル
    data_extensions = ['.csv', '.tsv', '.json', '.xml', '.parquet', '.avro', '.feather', '.hdf5']
    data_paths = ['data/', 'fixtures/', 'seeds/']
    if ext in data_extensions and ext not in config_extensions:
        if any(dp in path_lower for dp in data_paths) or ext == '.csv' or ext == '.tsv':
            return {'lc_type': 'L', 'confidence': 0.5}
        return {'lc_type': 'Neutral', 'confidence': 0.35}

    # 生成物/バイナリ
    build_paths = ['dist/', 'build/', 'target/', 'out/', 'bin/', 'obj/', 'coverage/']
    binary_extensions = ['.exe', '.dll', '.so', '.dylib', '.a', '.lib', '.jar', '.war', '.ear', '.apk', '.ipa', '.class', '.o', '.pyc', '.pyo', '.zip', '.tar', '.gz', '.rar', '.7z', '.log', '.tmp', '.bak', '.swp', '.ds_store', '.db']
    if any(bp in path_lower for bp in build_paths) or ext in binary_extensions:
        return {'lc_type': 'Neutral', 'confidence': 0.1}

    # その他
    return {'lc_type': 'Neutral', 'confidence': 0.2}

def estimate_lc_by_commit_message(message: str) -> dict:
    """
    コミットメッセージからLC特性を推定する。
    Returns: {
        'lc_score': float,       # -2.0 (強いL) から +2.0 (強いC)
        'lc_type': str,         # 'L', 'C', 'Neutral'
        'confidence': float,    # 推定の確信度 (0.0-1.0)
        'reason': str,          # スコアリングの根拠となったキーワードやタイプ
        'matched_keyword': str  # マッチした主要キーワード
    }
    """
    lc_score = 0.0
    confidence = 0.1  # Default confidence
    reason = "No specific LC keyword found"
    matched_keyword = ""

    # 1. Conventional Commits の型を優先的にチェック
    conventional_commit_match = re.match(
        r'^(revert|build|chore|ci|docs|feat|fix|perf|refactor|style|test)(?:\(.*?\))?(!?):?\s*(.*)',
        message.lower() if message else ''
    )
    
    cc_scores = {
        'feat':     {'score': +2.0, 'confidence': 0.9, 'type': 'C'},
        'fix':      {'score': -2.0, 'confidence': 0.9, 'type': 'L'},
        'docs':     {'score': -1.5, 'confidence': 0.8, 'type': 'L'},
        'style':    {'score': -0.5, 'confidence': 0.7, 'type': 'L'},
        'refactor': {'score': -1.5, 'confidence': 0.9, 'type': 'L'},
        'perf':     {'score': -1.0, 'confidence': 0.8, 'type': 'L'},
        'test':     {'score': -2.0, 'confidence': 0.9, 'type': 'L'},
        'build':    {'score': -1.0, 'confidence': 0.7, 'type': 'L'},
        'ci':       {'score': -1.0, 'confidence': 0.7, 'type': 'L'},
        'chore':    {'score': -1.0, 'confidence': 0.6, 'type': 'L'},
        'revert':   {'score': -1.0, 'confidence': 0.8, 'type': 'L'}
    }
    if conventional_commit_match:
        commit_type = conventional_commit_match.group(1)
        if commit_type in cc_scores:
            score_info = cc_scores[commit_type]
            lc_score = score_info['score']
            confidence = score_info['confidence']
            reason = f"Conventional Commit type: {commit_type}"
            matched_keyword = commit_type
    else:
        # 2. 汎用キーワードを探す
        general_keywords_scores = [
            (r'\bprototype\b',     {'score': +2.0, 'confidence': 0.75, 'type': 'C', 'keyword': 'prototype'}),
            (r'\bexperiment(al)?\b',{'score': +2.0, 'confidence': 0.75, 'type': 'C', 'keyword': 'experiment'}),
            (r'\bpoc\b',            {'score': +2.0, 'confidence': 0.75, 'type': 'C', 'keyword': 'poc'}),
            (r'\bnew\b',           {'score': +1.5, 'confidence': 0.6, 'type': 'C', 'keyword': 'new'}),
            (r'\bcreate(d)?\b',    {'score': +1.5, 'confidence': 0.6, 'type': 'C', 'keyword': 'create'}),
            (r'\bimplement(ed)?\b',{'score': +1.5, 'confidence': 0.65, 'type': 'C', 'keyword': 'implement'}),
            (r'\bintroduce(d)?\b', {'score': +1.5, 'confidence': 0.65, 'type': 'C', 'keyword': 'introduce'}),
            (r'\badd(ed)?\b',      {'score': +1.0, 'confidence': 0.55, 'type': 'C', 'keyword': 'add'}),
            (r'\binitial\b',       {'score': +1.0, 'confidence': 0.6, 'type': 'C', 'keyword': 'initial'}),
            (r'\benhance(d)?\b',   {'score': +0.5, 'confidence': 0.5, 'type': 'C', 'keyword': 'enhance'}),
            (r'\bdesign(ed)?\b',   {'score': +1.0, 'confidence': 0.5, 'type': 'C', 'keyword': 'design'}),
            (r'\bimprove(d|ments?)?\b', {'score': -0.5, 'confidence': 0.5, 'type': 'L', 'keyword': 'improve'}),
            (r'\bupdate(d)?\b',    {'score': -0.5, 'confidence': 0.5, 'type': 'L', 'keyword': 'update'}),
            (r'\bremove(d)?\b',    {'score': -0.5, 'confidence': 0.5, 'type': 'L', 'keyword': 'remove'}),
            (r'\bcleanup\b',       {'score': -1.0, 'confidence': 0.6, 'type': 'L', 'keyword': 'cleanup'}),
            (r'\bpolish(ed)?\b',   {'score': -0.5, 'confidence': 0.5, 'type': 'L', 'keyword': 'polish'}),
            (r'\bdeprecate(d)?\b', {'score': -0.5, 'confidence': 0.6, 'type': 'L', 'keyword': 'deprecate'}),
            (r'\bbug\b',           {'score': -2.0, 'confidence': 0.8, 'type': 'L', 'keyword': 'bug'}),
            (r'\berror\b',         {'score': -1.5, 'confidence': 0.7, 'type': 'L', 'keyword': 'error'}),
            (r'\bfail(ure|d)?\b', {'score': -1.5, 'confidence': 0.7, 'type': 'L', 'keyword': 'fail'}),
            (r'\bhotfix\b',        {'score': -2.0, 'confidence': 0.85, 'type': 'L', 'keyword': 'hotfix'}),
            (r'\bpatch\b',         {'score': -1.0, 'confidence': 0.6, 'type': 'L', 'keyword': 'patch'})
        ]
        found_keywords_scores = []
        message_lower = message.lower() if message else ''
        for regex, score_info in general_keywords_scores:
            if re.search(regex, message_lower):
                found_keywords_scores.append({
                    'keyword': score_info['keyword'],
                    'score': score_info['score'],
                    'confidence': score_info['confidence']
                })
        if found_keywords_scores:
            best_match = max(found_keywords_scores, key=lambda x: (abs(x['score']), x['score']))
            lc_score = best_match['score']
            confidence = best_match['confidence']
            matched_keyword = best_match['keyword']
            reason = f"General keyword: {matched_keyword}"
    lc_type = 'Neutral'
    if lc_score >= 1.0:
        lc_type = 'C'
    elif lc_score <= -1.0:
        lc_type = 'L'
    return {
        'lc_score': lc_score,
        'lc_type': lc_type,
        'confidence': confidence,
        'reason': reason,
        'matched_keyword': matched_keyword
    }

def estimate_lc_by_code_changes(diff_stats: dict) -> dict:
    """
    コード変更量からLC特性を推定する。
    diff_stats: {
        'added_lines': int,
        'deleted_lines': int,
        'is_new_file': bool
    }
    Returns: {
        'lc_type': 'L' | 'C' | 'Neutral',
        'confidence': float,
        'lc_score': float
    }
    """
    added = diff_stats.get('added_lines', 0)
    deleted = diff_stats.get('deleted_lines', 0)
    is_new = diff_stats.get('is_new_file', False)

    lc_score = 0.0
    confidence = 0.0

    # 何らかの変更があれば最低限の信頼度
    if added > 0 or deleted > 0:
        confidence += 0.3

    # 新規ファイルはC的特性が非常に強い
    if is_new:
        lc_score += 2.0
        confidence += 0.9

    # 追加行数が多い場合
    if added >= 100:
        lc_score += 1.5
        confidence += 0.7

    # 削除行数が多い場合
    if deleted >= 100:
        lc_score -= 1.5
        confidence += 0.7

    # 追加行数と削除行数の比較
    if added > deleted:
        lc_score += 0.5
        confidence += 0.3
    elif deleted > added:
        lc_score -= 0.5
        confidence += 0.3
    elif added == deleted and added > 0:
        confidence += 0.3

    # LCタイプの判定
    if lc_score > 0:
        lc_type = 'C'
    elif lc_score < 0:
        lc_type = 'L'
    else:
        lc_type = 'Neutral'

    # 信頼度を0-1の範囲に調整
    confidence = max(0, min(1, confidence))

    return {
        'lc_type': lc_type,
        'confidence': confidence,
        'lc_score': lc_score
    }

def summarize_lc_analysis_to_markdown(repo_path: str, branch: str, output_path: str = None) -> str:
    """
    指定リポジトリとブランチのLC特性分析を実行し、要約をMarkdown形式で返す（またはファイル出力）。
    ファイル種別ごと（ソース/テスト/ドキュメント/設定/その他）に集計し、最後に統合スコアを算出。
    """
    import git
    from src.utils import estimate_lc_by_filetype, estimate_lc_by_commit_message, estimate_lc_by_code_changes
    import os
    repo = git.Repo(repo_path)
    repo.git.checkout(branch)
    files = [os.path.join(dp, f) for dp, dn, filenames in os.walk(repo_path) for f in filenames if not dp.endswith('__pycache__')]
    # ファイル種別ごとに分類
    filetype_results = [(f, estimate_lc_by_filetype(f)) for f in files]
    categories = {'source': [], 'test': [], 'doc': [], 'config': [], 'other': []}
    for f, res in filetype_results:
        path = f.lower()
        if any(x in path for x in ['/test/', '/tests/', '.test.', '.spec.', '/__tests__/', '/e2e/']):
            categories['test'].append(res)
        elif any(x in path for x in ['/doc/', '/docs/', '.md', '.rst', '.txt']):
            categories['doc'].append(res)
        elif any(x in path for x in ['.yml', '.yaml', '.json', '.xml', 'dockerfile', 'package.json', 'requirements.txt', '.github/workflows/']):
            categories['config'].append(res)
        elif any(x in path for x in ['/src/', '/lib/', '/core/', '/features/', '/components/', '/services/', '/modules/', '.js', '.ts', '.py', '.java', '.cpp', '.c', '.rb', '.go']):
            categories['source'].append(res)
        else:
            categories['other'].append(res)
    def cat_summary(cat):
        return {
            'C': sum(1 for r in categories[cat] if r['lc_type'] == 'C'),
            'L': sum(1 for r in categories[cat] if r['lc_type'] == 'L'),
            'Neutral': sum(1 for r in categories[cat] if r['lc_type'] == 'Neutral'),
            'total': len(categories[cat])
        }
    # 各カテゴリごとに集計
    source_sum = cat_summary('source')
    test_sum = cat_summary('test')
    doc_sum = cat_summary('doc')
    config_sum = cat_summary('config')
    other_sum = cat_summary('other')
    # 最新10コミットを分析
    commits = list(repo.iter_commits(branch, max_count=10))
    commit_results = [estimate_lc_by_commit_message(c.message) for c in commits]
    commit_summary = {
        'C': sum(1 for r in commit_results if r['lc_type'] == 'C'),
        'L': sum(1 for r in commit_results if r['lc_type'] == 'L'),
        'Neutral': sum(1 for r in commit_results if r['lc_type'] == 'Neutral')
    }
    # 最新コミットのdiffでコード変更分析
    latest_commit = commits[0]
    parent = latest_commit.parents[0] if latest_commit.parents else None
    diff_stats = {'added_lines': 0, 'deleted_lines': 0, 'is_new_file': False}
    if parent:
        diff = latest_commit.diff(parent, create_patch=True)
        for d in diff:
            if d.a_blob and d.b_blob:
                diff_stats['added_lines'] += d.diff.decode(errors='ignore').count('+')
                diff_stats['deleted_lines'] += d.diff.decode(errors='ignore').count('-')
    code_result = estimate_lc_by_code_changes(diff_stats)
    # 統合スコア例: ソースC割合×0.5 + テストL割合×0.2 + ドキュメントL割合×0.2 + configL割合×0.1
    def safe_div(a, b):
        return a / b if b else 0
    source_c_ratio = safe_div(source_sum['C'], source_sum['total'])
    test_l_ratio = safe_div(test_sum['L'], test_sum['total'])
    doc_l_ratio = safe_div(doc_sum['L'], doc_sum['total'])
    config_l_ratio = safe_div(config_sum['L'], config_sum['total'])
    integrated_score = source_c_ratio * 0.5 - (test_l_ratio * 0.2 + doc_l_ratio * 0.2 + config_l_ratio * 0.1)
    integrated_type = 'C' if integrated_score > 0.2 else 'L' if integrated_score < -0.2 else 'Neutral'
    # Markdown生成
    md = f"""# LC特性分析サマリー: {os.path.basename(repo_path)} [{branch}]

## ファイル種別ごとの集計
- ソースコード: C的={source_sum['C']} L的={source_sum['L']} Neutral={source_sum['Neutral']} (total={source_sum['total']})
- テスト:        C的={test_sum['C']} L的={test_sum['L']} Neutral={test_sum['Neutral']} (total={test_sum['total']})
- ドキュメント:  C的={doc_sum['C']} L的={doc_sum['L']} Neutral={doc_sum['Neutral']} (total={doc_sum['total']})
- 設定:          C的={config_sum['C']} L的={config_sum['L']} Neutral={config_sum['Neutral']} (total={config_sum['total']})
- その他:        C的={other_sum['C']} L的={other_sum['L']} Neutral={other_sum['Neutral']} (total={other_sum['total']})

## 直近10コミットの傾向
- C的コミット数: {commit_summary['C']}
- L的コミット数: {commit_summary['L']}
- Neutralコミット数: {commit_summary['Neutral']}

## 最新コミットのコード変更分析
- 追加行数: {diff_stats['added_lines']}
- 削除行数: {diff_stats['deleted_lines']}
- LC特性: {code_result['lc_type']} (score={code_result['lc_score']}, confidence={code_result['confidence']})

## 統合LC特性スコア
- 統合スコア: {integrated_score:.2f}
- 統合タイプ: {integrated_type}

---
この要約は自動分析ロジックにより生成されています。
"""
    if output_path:
        with open(output_path, 'w', encoding='utf-8') as f:
            f.write(md)
    return md

