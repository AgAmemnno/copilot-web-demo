const conceptualDocument = `プロジェクト名: AI駆動型プロジェクト管理支援SPA

背景:
複雑化するソフトウェア開発プロジェクトにおいて、計画立案、タスク管理、進捗追跡は依然として大きな課題である。特に、初期の要求定義から具体的なタスクへの落とし込み、変化への柔軟な対応、そして開発者体験の向上は常に求められている。

目的:
本プロジェクトの目的は、AI (特に大規模言語モデル) の能力を活用し、プロジェクトの計画立案からIssue発行、進捗管理までを支援するSPA (Single Page Application) を開発することである。これにより、以下の価値を提供する。
1.  計画策定の効率化: 概念的なアイデアから、具体的なマイルストーン、シナリオ、タスク(Issue)への展開をAIが支援する。
2.  柔軟なリスケジューリング: 状況変化に応じて、AIが再計画案を提示し、迅速な意思決定をサポートする。
3.  GitHub連携の強化: GitHub Projects V2, Issues, Milestonesとシームレスに連携し、開発ワークフローに自然に統合される。
4.  開発者体験の向上: 面倒な手作業を自動化・半自動化し、開発者がより創造的な作業に集中できる環境を提供する。

主要機能:
1.  マイルストーン定義支援: ユーザーが入力した概念文書に基づき、AIが複数のマイルストーン案(期間、主要成果物を含む)を提案。ユーザーは編集・承認し、GitHub標準Milestoneとして登録。
2.  シナリオ生成: 承認されたマイルストーン群と概念文書を基に、AIが複数の実行シナリオ(異なるアプローチや重点事項を反映)を提案。ユーザーが一つを選択。
3.  クリティカルパス生成: 選択されたシナリオとターゲットマイルストーンに基づき、AIがそのマイルストーン達成のための具体的なIssue骨子群(タスクリスト)を提案。
4.  Issue発行支援: ユーザーがAI提案のIssue骨子を基に、外部ツール(NotebookLM, AI Studio等)で詳細なIssue記述を作成し、本SPAに持ち込む。SPAはこれをGitHub Issueとして発行し、関連Milestoneに紐付け、Project V2にアイテムとして追加。
5.  (将来機能) リスケジューリング支援: 進捗の遅れや仕様変更が発生した場合、AIが影響範囲を分析し、新たなシナリオやタスク調整案を提示。

ターゲットユーザー:
小〜中規模のソフトウェア開発チーム、個人開発者、プロジェクトマネージャー。

技術スタック(想定):
- フロントエンド: HTML, CSS, JavaScript (フレームワークは未定だが、最初はVanilla JSでUIロジック検証)
- AI: Gemini API (Google Generative AI)
- バージョン管理・プロジェクト管理: GitHub (Issues, Milestones, Projects V2)
- API連携: Octokit.js

期待される成果物:
- 上記主要機能1〜4を実装したSPAのプロトタイプ。
- GitHubリポジトリ (ソースコード、ドキュメント)
- 簡単な利用ガイド

その他前提条件:
- ユーザーはGitHubアカウントと、Gemini APIキーを所有しているものとする。
- SPAはクライアントサイドで動作し、原則としてサーバーサイドの処理は持たない。
`;




const getScenarioGenerationPrompt = (conceptualDocument,milestonesForPrompt) => {
    return `
    あなたは経験豊富なプロジェクト戦略家です。提供された「概念文書」と「定義済みマイルストーン群」を分析し、プロジェクトを推進するための複数の論理的な実行シナリオを提案してください。
    各シナリオは、プロジェクト目標達成のための異なるアプローチや重点事項を反映するものとします。創造的なストーリーテリングではなく、与えられた情報から導き出される合理的な選択肢を提示してください。
    
    ## 入力情報:
    1.  概念文書:
        ${conceptualDocument}
    
    2.  定義済みマイルストーン群 (JSON形式):
        ${JSON.stringify(milestonesForPrompt, null, 2)}
    
    ## 指示:
    1.  上記の入力情報を基に、2〜4個程度の異なる実行シナリオを考案してください。
    2.  各シナリオには、以下の情報を含めてください。
        * \`scenario_id\`: シナリオを一意に識別するID（例: "SCN-01", "SCN-02"）。
        * \`scenario_name\`: シナリオの特性を簡潔に示す名称。
        * \`scenario_description\`: そのシナリオの主要な戦略、アプローチ、想定されるメリット・デメリットを具体的に説明してください。
        * \`focus_milestones\`: このシナリオにおいて特に注力すべき、あるいは進行順序やリソース配分に特徴が出るマイルストーンのID(number)リスト。
        * \`approach_summary\`: プロジェクトの進め方に関するアプローチの要約。
        * \`considerations\`: このシナリオを選択した場合に考慮すべき事項や潜在的な課題点。
    3.  出力は、必ず以下のJSON形式の配列としてください。
    
    ## 出力形式 (JSON):
    [
      {
        "scenario_id": "string",
        "scenario_name": "string",
        "scenario_description": "string",
        "focus_milestones": [number, number, ...],
        "approach_summary": "string",
        "considerations": "string"
      }
    ]
    `;
}



export { conceptualDocument ,getScenarioGenerationPrompt} ;