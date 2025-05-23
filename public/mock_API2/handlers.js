import { http, HttpResponse ,delay} from 'https://cdn.jsdelivr.net/npm/msw@2.7.3/+esm';

const GOOGLE_DOCS_API_BASE_URL = 'https://docs.googleapis.com/v1';

// モック用の簡易的なドキュメントストア (必要に応じて状態を保持)
let mockDocumentStore = {
  "mock_doc_123": {
    documentId: "mock_doc_123",
    title: "既存のモックドキュメント",
    revisionId: "rev0",
    body: {
      content: [
        // 初期コンテンツの例 (段落区切りなど)
        {
          endIndex: 1,
          paragraph: {
            elements: [{ startIndex: 1, endIndex: 1, textRun: { content: "\n" } }] // ドキュメントは通常、空でも1つの段落を持つ
          }
        },
      ]
    }
  }
};

const batchUpdateUrlMatcher = new RegExp(
  `^${GOOGLE_DOCS_API_BASE_URL.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}/documents/(?<documentId>[^/:]+):batchUpdate$`
);

const googleDocsApiHandlers = [
  /**
   * 1. ドキュメント作成 (createDocument 関数が呼び出す)
   * API: POST /v1/documents
   */
  http.post(`${GOOGLE_DOCS_API_BASE_URL}/documents`, async ({ request }) => {
    console.log('[MSW] Intercepted POST /v1/documents (Create Document)');
    await delay(200); // ネットワーク遅延のシミュレーション

    const requestBody = await request.json().catch(() => ({}));
    const title = requestBody.title || `無題のドキュメント ${Date.now()}`;

    // エラーケースのシミュレーション (例: 特定のタイトルで失敗させる)
    if (title === "FAIL_CREATE_DOC") {
      console.error('[MSW] Simulating document creation failure.');
      return HttpResponse.json(
        { error: { code: 400, message: 'ドキュメント作成に失敗しました (モックエラー)。', status: 'INVALID_ARGUMENT' }},
        { status: 400 }
      );
    }

    const newDocumentId = `mock_doc_${Date.now()}`;
    const newDocument = {
      documentId: newDocumentId,
      title: title,
      locale: 'ja',
      revisionId: 'rev_initial',
      body: {
        content: [{ endIndex: 1, paragraph: { elements: [{ startIndex: 1, endIndex: 1, textRun: { content: "\n" } }] } }]
      },
      // Google Docs API のレスポンスに近づけるため、他のフィールドも適宜追加
    };
    mockDocumentStore[newDocumentId] = { ...newDocument }; // ストアに保存

    console.log(`[MSW] Mock document created: ${newDocumentId} ("${title}")`);
    return HttpResponse.json(newDocument, { status: 200 }); // Google APIは成功時200を返すことが多い
  }),

  /**
   * 2. ドキュメント一括更新 (多くの編集系関数が最終的に呼び出す executeBatchUpdate が使用)
   * API: POST /v1/documents/{documentId}:batchUpdate
   */

  http.post(batchUpdateUrlMatcher, async ({ request }) => { // 第1引数を正規表現に変更
    // 名前付きキャプチャグループ 'documentId' の値を request.params から取得
    //const documentId = request.params.documentId;

    // (代替案: もし request.params.documentId がうまく機能しない場合、URLから手動でパース)
    const url = new URL(request.url);
    const pathname = url.pathname; // 例: "/v1/documents/mock_doc_123:batchUpdate"
    const segments = pathname.split('/');
    const lastSegment = segments[segments.length - 1]; // 例: "mock_doc_123:batchUpdate"
    const documentId = lastSegment.substring(0, lastSegment.indexOf(':batchUpdate'));

    console.log(`[MSW] Intercepted POST /v1/documents/${documentId}:batchUpdate`);
    await delay(150);

    // ドキュメント存在チェック
    if (!mockDocumentStore[documentId]) {
      console.error(`[MSW] Document not found for batch update: ${documentId}`);
      return HttpResponse.json(
        { error: { code: 404, message: `ドキュメントが見つかりません: ${documentId} (モックエラー)。`, status: 'NOT_FOUND' }},
        { status: 404 }
      );
    }

    const batchRequestBody = await request.json().catch(() => ({ requests: [] }));
    const apiRequests = batchRequestBody.requests || [];

    // 特定のリクエスト内容に基づくエラーシミュレーション (例: "FAIL_REQUEST" を含むテキスト挿入)
    if (apiRequests.some(req => req.insertText && req.insertText.text && req.insertText.text.includes("FAIL_REQUEST"))) {
      console.error('[MSW] Simulating batch update failure due to specific request content.');
      return HttpResponse.json(
        { error: { code: 400, message: 'バッチ更新リクエスト内に無効な操作が含まれています (モックエラー)。', status: 'INVALID_ARGUMENT' }},
        { status: 400 }
      );
    }
    
    // 成功時のレスポンスをシミュレート
    // 各リクエストに対する応答の配列 (多くは空オブジェクト)
    const replies = apiRequests.map(req => {
      const requestType = Object.keys(req)[0]; // insertText, updateParagraphStyle など
      // ここでは簡略化し、各リクエストタイプに応じた空のオブジェクトを返す
      // 実際のAPIはリクエストタイプによって異なる内容を返すことがある
      if (requestType === 'createNamedRange') {
        return { createNamedRange: { namedRangeId: `mock_named_range_${Date.now()}` } };
      }
      return { [requestType]: {} };
    });

    // (オプション) モックストア内のドキュメント内容を更新するロジック
    // 例: リビジョンIDを更新
    const newRevisionId = `rev_${Date.now()}`;
    mockDocumentStore[documentId].revisionId = newRevisionId;
    // ここで実際にリクエスト内容に応じて mockDocumentStore[documentId].body.content を変更することも可能ですが、
    // テストの焦点に応じて、どこまで詳細にシミュレートするかを決定します。

    console.log(`[MSW] Batch update for document ${documentId} processed. ${apiRequests.length} requests.`);
    return HttpResponse.json({
      documentId: documentId,
      replies: replies,
      writeControl: { // 実際のAPIでは writeControl が含まれることがある
        requiredRevisionId: newRevisionId 
      }
    }, { status: 200 });
  }),

  /**
   * (オプション) ドキュメント取得 (テストやデバッグであると便利な場合がある)
   * API: GET /v1/documents/{documentId}
   */
  http.get(`${GOOGLE_DOCS_API_BASE_URL}/documents/:documentId`, async ({ params }) => {
    const { documentId } = params;
    console.log(`[MSW] Intercepted GET /v1/documents/${documentId}`);
    await delay(100);

    if (mockDocumentStore[documentId]) {
      console.log(`[MSW] Returning mock document: ${documentId}`);
      return HttpResponse.json(mockDocumentStore[documentId]);
    } else {
      console.error(`[MSW] Document not found for GET request: ${documentId}`);
      return HttpResponse.json(
        { error: { code: 404, message: `ドキュメントが見つかりません: ${documentId} (モックエラー)。`, status: 'NOT_FOUND' }},
        { status: 404 }
      );
    }
  })
];

// MSWのメインハンドラ配列に上記ハンドラを追加してください
export { googleDocsApiHandlers };
