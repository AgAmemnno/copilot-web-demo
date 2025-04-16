/**
 * アプリケーション固有のグラフスタイルシートを生成する関数を登録します。
 * 設定オブジェクトにより、形状、色、アイコンなどをカスタマイズ可能です。
 * ノードタイプの区別は主にアイコン (background-image) で行います。
 * document ノードの役割 (start/target/element) もアイコンで区別します。
 *
 * @param {object} cytoscape Cytoscape.jsのインスタンスまたはクラス。
 * @param {object} [userConfig] ユーザー定義の設定オブジェクト。defaultConfigを上書きします。
 * @returns {cytoscape.Stylesheet} Cytoscape.js用のスタイルシートオブジェクト。
 */
var registerAppStyleSheet = (userConfig = {}) => {

  // --- デフォルト設定 ---
  const defaultConfig = {
    // --- 色定義 ---
    colors: { /* ... (前回と同じ) ... */
      nodeStroke: '#555555', nodeFill: '#f6f6f6', edgeLine: '#6A6A6A',
      controlEdge: '#e67e22',
      Scheduler: '#f1c40f', Executor: '#2ecc71', Accelerator: '#3498db',
      Transformer: '#9b59b6', Monitor: '#e74c3c',
      selected: '#d67614', active: '#d67614',
      text: '#333333', textOutline: 'white',
      compartmentFill: 'rgba(200, 200, 200, 0.1)', compartmentBorder: '#aaaaaa',
      logicMarkerBorder: '#555555',
      cloneMarkerStroke: '#555555',
    },
    // --- 線幅定義 ---
    lineWidths: { /* ... (前回と同じ) ... */
      nodeBorder: 1.5, edgeLine: 1.5, controlEdge: 2.5, compartmentBorder: 2,
      selectedBorder: 3,
      textOutline: 0.75, cloneMarkerStroke: 1.5,
      logicMarkerBorder: 2,
    },
    // --- フォント定義 ---
    fonts: { /* ... (前回と同じ) ... */
      size: { default: 14, compartmentLabel: 16, iconFont: 18 },
      family: { default: 'Helvetica Neue, Helvetica, sans-serif' }
    },
    // --- 形状定義 ---
    shapes: { /* ... (前回と同じ) ... */
      document: 'roundrectangle',
      process: 'square',
      agent: 'hexagon',
      productionArrow: 'triangle', consumptionArrow: 'triangle', stimulationArrow: 'diamond',
      controlArrow: 'chevron', defaultArrow: 'none',
      defaultArrowFill: 'filled',
    },
    // --- サイズ定義 ---
    sizes: { /* ... (前回と同じ) ... */
      document: { w: 80, h: 50 },
      process: { w: 30, h: 30 },
      agent: { w: 70, h: 70 },
      arrowScale: 1.5,
      padding: { default: '16px', functionCompartment: '25px' },
      activeOverlayPadding: { node: '10', edge: '6' },
      iconSize: '60%',
      roleIconSize: '20px',
      stateMarkerSize: '15px',
    },
    // --- 不透明度定義 ---
    opacities: { /* ... (前回と同じ) ... */
      default: 1, text: 1, textOutline: 1, selectionBox: 0.1, activeOverlay: 0.2,
      cloneMarkerGhost: 0.3,
    },
    // --- アイコン定義 (SVG Data URI) ---
    icons: {
      // Document 役割別アイコン (element にも追加)
      documentStart: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="green" class="bi bi-play-circle-fill" viewBox="0 0 16 16"><path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zM6.79 5.093A.5.5 0 0 0 6 5.5v5a.5.5 0 0 0 .79.407l3.5-2.5a.5.5 0 0 0 0-.814l-3.5-2.5z"/></svg>',
      documentTarget: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="red" class="bi bi-stop-circle-fill" viewBox="0 0 16 16"><path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zM6.5 5A1.5 1.5 0 0 0 5 6.5v3A1.5 1.5 0 0 0 6.5 11h3A1.5 1.5 0 0 0 11 9.5v-3A1.5 1.5 0 0 0 9.5 5h-3z"/></svg>',
      documentElement: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="%236c757d" class="bi bi-file-earmark-text" viewBox="0 0 16 16"><path d="M5.5 7a.5.5 0 0 0 0 1h5a.5.5 0 0 0 0-1h-5zM5.5 9a.5.5 0 0 0 0 1h5a.5.5 0 0 0 0-1h-5zM5.5 11a.5.5 0 0 0 0 1h2a.5.5 0 0 0 0-1h-2z"/><path d="M9.5 0H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V4.5L9.5 0zm0 1v2A1.5 1.5 0 0 0 11 4.5h2V14a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1h5.5z"/></svg>', // 灰色 (#6c757d) のドキュメントアイコン例
      // Process タイプ別アイコン (例)
      processGeneral: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-box" viewBox="0 0 16 16"><path d="M8.186 1.113a.5.5 0 0 0-.372 0L1.846 3.5l2.404.961L10.404 2l-2.218-.887zm3.564 1.426L5.596 5 8 5.961 14.154 3.5l-2.404-.961zm3.25 1.7-6.5 2.6v7.922l6.5-2.6V4.24zM7.5 14.762V6.838L1 4.239v7.923l6.5 2.6zM7.443.184a1.5 1.5 0 0 1 1.114 0l7.129 2.852A.5.5 0 0 1 16 3.5v8.662a1 1 0 0 1-.629.928l-7.185 2.874a.5.5 0 0 1-.372 0L.63 13.09a1 1 0 0 1-.63-.928V3.5a.5.5 0 0 1 .314-.464L7.443.184z"/></svg>',
      processAssociation: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-link-45deg" viewBox="0 0 16 16"><path d="M4.715 6.542 3.343 7.914a3 3 0 1 0 4.243 4.243l1.828-1.829A3 3 0 0 0 8.586 5.5L8 6.086a1.002 1.002 0 0 0-.154.199 2 2 0 0 1 .861 3.337L6.88 11.45a2 2 0 1 1-2.83-2.83l.793-.792a4.018 4.018 0 0 1-.128-1.287z"/><path d="M6.586 4.672A3 3 0 0 0 7.414 9.5l.775-.776a2 2 0 0 1-.896-3.346L9.12 3.55a2 2 0 1 1 2.83 2.83l-.793.792c.112.42.155.855.128 1.287l1.372-1.372a3 3 0 1 0-4.243-4.243L6.586 4.672z"/></svg>',
      processDissociation: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-scissors" viewBox="0 0 16 16"><path d="M3.5 3.5c-.614-.884-.074-1.962.858-2.5L8 7.226 11.642 1c.932.538 1.472 1.616.858 2.5L8.81 8.61l1.556 2.661a2.5 2.5 0 1 1-.794.637L8 9.73l-1.572 2.177a2.5 2.5 0 1 1-.794-.637L7.19 8.61 3.5 3.5zm2.5 10a1.5 1.5 0 1 0-3 0 1.5 1.5 0 0 0 3 0zm7 0a1.5 1.5 0 1 0-3 0 1.5 1.5 0 0 0 3 0z"/></svg>',
      // Agent タイプ別アイコン
      Scheduler: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-clock" viewBox="0 0 16 16"><path d="M8 3.5a.5.5 0 0 0-1 0V9a.5.5 0 0 0 .252.434l3.5 2a.5.5 0 0 0 .496-.868L8 8.71V3.5z"/><path d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16zm7-8A7 7 0 1 1 1 8a7 7 0 0 1 14 0z"/></svg>',
      Executor: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-gear" viewBox="0 0 16 16"><path d="M8 4.754a3.246 3.246 0 1 0 0 6.492 3.246 3.246 0 0 0 0-6.492zM5.754 8a2.246 2.246 0 1 1 4.492 0 2.246 2.246 0 0 1-4.492 0z"/><path d="M9.796 1.343c-.527-1.79-3.065-1.79-3.592 0l-.094.319a.873.873 0 0 1-1.255.52l-.292-.16c-1.64-.892-3.433.902-2.54 2.541l.159.292a.873.873 0 0 1-.52 1.255l-.319.094c-1.79.527-1.79 3.065 0 3.592l.319.094a.873.873 0 0 1 .52 1.255l-.16.292c-.892 1.64.902 3.433 2.541 2.54l.292-.159a.873.873 0 0 1 1.255.52l.094.319c.527 1.79 3.065 1.79 3.592 0l.094-.319a.873.873 0 0 1 1.255-.52l.292.16c1.64.892 3.433-.902 2.54-2.541l-.159-.292a.873.873 0 0 1 .52-1.255l.319-.094c1.79-.527 1.79-3.065 0-3.592l-.319-.094a.873.873 0 0 1-.52-1.255l.16-.292c.892-1.64-.902-3.433-2.541-2.54l-.292.159a.873.873 0 0 1-1.255-.52l-.094-.319zm-2.633.283c.246-.835 1.428-.835 1.674 0l.094.319a1.873 1.873 0 0 0 2.693 1.115l.291-.16c.764-.415 1.6.42 1.184 1.185l-.159.291a1.873 1.873 0 0 0 1.115 2.694l.319.094c.835.246.835 1.428 0 1.674l-.319.094a1.873 1.873 0 0 0-1.115 2.693l.16.292c.415.764-.42 1.6-1.185 1.184l-.291-.159a1.873 1.873 0 0 0-2.694 1.115l-.094.319c-.246.835-1.428.835-1.674 0l-.094-.319a1.873 1.873 0 0 0-2.693-1.115l-.292.16c-.764.415-1.6-.42-1.184-1.185l.159-.291a1.873 1.873 0 0 0-1.115-2.694l-.319-.094c-.835-.246-.835-1.428 0-1.674l.319-.094a1.873 1.873 0 0 0 1.115-2.693l-.16-.292c-.415-.764.42-1.6 1.185-1.184l.292.159a1.873 1.873 0 0 0 2.693-1.115l.094-.319z"/></svg>',
      Accelerator: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-lightning-fill" viewBox="0 0 16 16"><path d="M5.52.359A.5.5 0 0 1 6 0h4a.5.5 0 0 1 .474.658L8.694 6H12.5a.5.5 0 0 1 .395.807l-7 9a.5.5 0 0 1-.873-.454L6.823 9.5H3.5a.5.5 0 0 1-.48-.641l2.5-8.5z"/></svg>',
      Transformer: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-arrow-repeat" viewBox="0 0 16 16"><path d="M11.534 7h3.932a.25.25 0 0 1 .192.41l-1.966 2.36a.25.25 0 0 1-.384 0l-1.966-2.36a.25.25 0 0 1 .192-.41zm-11 2h3.932a.25.25 0 0 0 .192-.41L2.692 6.23a.25.25 0 0 0-.384 0L.342 8.59A.25.25 0 0 0 .534 9z"/><path fill-rule="evenodd" d="M8 3c-1.552 0-2.94.707-3.857 1.818a.5.5 0 1 1-.771-.636A6.002 6.002 0 0 1 13.917 7H12.5A5.002 5.002 0 0 0 8 3zM3.5 9a5.002 5.002 0 0 0 4.5 4c1.552 0 2.94-.707 3.857-1.818a.5.5 0 1 1 .771.636A6.002 6.002 0 0 1 2.083 9H3.5z"/></svg>',
      Monitor: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-eye-fill" viewBox="0 0 16 16"><path d="M10.5 8a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0z"/><path d="M0 8s3-5.5 8-5.5S16 8 16 8s-3 5.5-8 5.5S0 8 0 8zm8 3.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z"/></svg>',
      // 状態を示すアイコン
      recursive: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="%233498db" class="bi bi-arrow-counterclockwise" viewBox="0 0 16 16"><path fill-rule="evenodd" d="M8 3a5 5 0 1 1-4.546 2.914.5.5 0 0 0-.908-.417A6 6 0 1 0 8 2v1z"/><path d="M8 4.466V.534a.25.25 0 0 0-.41-.192L5.23 2.308a.25.25 0 0 0 0 .384l2.36 1.966A.25.25 0 0 0 8 4.466z"/></svg>',
      cyclic: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="%23e67e22" class="bi bi-arrow-repeat" viewBox="0 0 16 16"><path d="M11.534 7h3.932a.25.25 0 0 1 .192.41l-1.966 2.36a.25.25 0 0 1-.384 0l-1.966-2.36a.25.25 0 0 1 .192-.41zm-11 2h3.932a.25.25 0 0 0 .192-.41L2.692 6.23a.25.25 0 0 0-.384 0L.342 8.59A.25.25 0 0 0 .534 9z"/><path fill-rule="evenodd" d="M8 3c-1.552 0-2.94.707-3.857 1.818a.5.5 0 1 1-.771-.636A6.002 6.002 0 0 1 13.917 7H12.5A5.002 5.002 0 0 0 8 3zM3.5 9a5.002 5.002 0 0 0 4.5 4c1.552 0 2.94-.707 3.857-1.818a.5.5 0 1 1 .771.636A6.002 6.002 0 0 1 2.083 9H3.5z"/></svg>',
      logicAND: '', logicOR: '', logicNOT: '', // NOT IMPLEMENTED: 論理修飾アイコン
    },
    // その他の設定値
    cloneMarkerOffset: { x: 8, y: 8 },
  };

  // --- 設定のマージ ---
  const config = { ...defaultConfig };
  // (簡易的なdeep merge)
  for (const key in defaultConfig) {
    if (typeof defaultConfig[key] === 'object' && defaultConfig[key] !== null && !Array.isArray(defaultConfig[key])) {
      config[key] = { ...defaultConfig[key], ...(userConfig && userConfig[key] ? userConfig[key] : {}) };
       if (key === 'sizes') {
         if (defaultConfig.sizes.padding) config.sizes.padding = { ...defaultConfig.sizes.padding, ...(userConfig?.sizes?.padding || {}) };
         if (defaultConfig.sizes.activeOverlayPadding) config.sizes.activeOverlayPadding = { ...defaultConfig.sizes.activeOverlayPadding, ...(userConfig?.sizes?.activeOverlayPadding || {}) };
       }
       if (key === 'icons') config.icons = { ...defaultConfig.icons, ...(userConfig?.icons || {}) };
    }
  }


  // --- 内部ヘルパー関数 ---
  const data_access = { /* ... (前回と同じ) ... */
    class: (ele) => ele.data('class'), role: (ele) => ele.data('role'),
    processType: (ele) => ele.data('processType'), agentType: (ele) => ele.data('agentType'),
    logicType: (ele) => ele.data('logicType'), label: (ele) => ele.data('label'),
    isRecursive: (ele) => ele.data('stateVariables')?.some(v => v.state?.variable === 'recursive' && v.state?.value === 'true'),
    isCyclic: (ele) => ele.data('stateVariables')?.some(v => v.state?.variable === 'cyclic' && v.state?.value === 'true'),
    hasClonemarker: (ele) => ele.data('clonemarker') === true,
    cardinality: (ele) => ele.data('cardinality'),
    getEdgeDirection: (edge) => edge.data('direction'),
  };

  // 形状決定ロジック (Process形状を統一, Document形状も統一)
  const getShape = (node) => {
    const nodeClass = data_access.class(node);
    if (nodeClass === 'document') {
      return config.shapes.document; // 全て roundrectangle
    } else if (nodeClass === 'Process') {
      return config.shapes.process; // 全て square
    } else if (nodeClass === 'Agent') {
      return config.shapes.agent; // hexagon
    }
    return 'ellipse'; // デフォルトフォールバック
  };

  // 寸法決定ロジック (Processサイズを統一, Documentサイズも統一)
  const getDimensions = (node) => {
     const nodeClass = data_access.class(node);
     if (nodeClass === 'document') {
       return config.sizes.document; // 全て共通サイズ
     } else if (nodeClass === 'Process') {
       return config.sizes.process; // 全て共通サイズ
     } else if (nodeClass === 'Agent') {
       return config.sizes.agent;
     }
     return { w: 50, h: 50 }; // デフォルトフォールバック
  };
  const getWidth = (node) => getDimensions(node).w;
  const getHeight = (node) => getDimensions(node).h;

  const getIconDataUri = (iconName) => { /* ... (前回と同じ) ... */
      return config.icons[iconName] || '';
  };

  // --- スタイルシート生成関数内 ---
  const appStyleSheet = (cytoscape) => {

    // start/target 用のSVGデータURI生成は不要になったので削除

    return cytoscape.stylesheet()
      // --- 基本ノードスタイル ---
      .selector('node')
      .css({ /* ... (形状、寸法ロジック更新以外は前回と同じ) ... */
        'shape': getShape, 'width': getWidth, 'height': getHeight, // 更新
        'content': (node) => data_access.label(node) || '',
        'font-size': config.fonts.size.default, 'font-family': config.fonts.family.default,
        'color': config.colors.text, 'text-valign': 'center', 'text-halign': 'center',
        'text-wrap': 'wrap', 'text-max-width': (node) => getWidth(node) * 0.9,
        'border-width': config.lineWidths.nodeBorder, 'border-color': config.colors.nodeStroke,
        'background-color': config.colors.nodeFill, 'text-opacity': config.opacities.text,
        'opacity': config.opacities.default, 'text-outline-color': config.colors.textOutline,
        'text-outline-opacity': config.opacities.textOutline, 'text-outline-width': config.lineWidths.textOutline,
        'padding': config.sizes.padding.default,
        'background-image': [], 'background-width': [], 'background-height': [],
        'background-position-x': [], 'background-position-y': [],
        'background-fit': 'contain', 'background-clip': 'node', 'background-opacity': 1,
      })

      // --- Document ノード スタイル (アイコン中心に) ---
      .selector('node[class="document"]')
      .css({
        // 'background-color': config.colors.elementNodeFill, // 基本色に戻す
        // 役割アイコン + 状態マーカー を背景画像として追加
        'background-image': (node) => {
            const images = [];
            const role = data_access.role(node);
            // 役割アイコン (常に表示、elementも含む)
            if (role === 'start') images.push(getIconDataUri('documentStart'));
            else if (role === 'target') images.push(getIconDataUri('documentTarget'));
            else images.push(getIconDataUri('documentElement')); // element用アイコン

            // 状態マーカー
            if (data_access.isRecursive(node)) images.push(getIconDataUri('recursive'));
            if (data_access.isCyclic(node)) images.push(getIconDataUri('cyclic'));
            return images;
        },
        'background-width': (node) => {
            const widths = [];
            // 役割アイコン
            widths.push(config.sizes.roleIconSize);
            // 状態マーカー
            if (data_access.isRecursive(node)) widths.push(config.sizes.stateMarkerSize);
            if (data_access.isCyclic(node)) widths.push(config.sizes.stateMarkerSize);
            return widths.join(' ');
        },
        'background-height': (node) => {
            const heights = [];
            // 役割アイコン
            heights.push(config.sizes.roleIconSize);
             // 状態マーカー
            if (data_access.isRecursive(node)) heights.push(config.sizes.stateMarkerSize);
            if (data_access.isCyclic(node)) heights.push(config.sizes.stateMarkerSize);
            return heights.join(' ');
        },
        'background-position-x': (node) => { // アイコンの位置調整 (例: 役割=中央上、再帰=左上、サイクル=右上)
            const positions = [];
            // 役割アイコン
            positions.push('50%'); // 中央
            // 状態マーカー
            if (data_access.isRecursive(node)) positions.push('5px'); // 左
            if (data_access.isCyclic(node)) positions.push('95%'); // 右
            return positions.join(' ');
        },
        'background-position-y': (node) => { // Y位置調整
             const positions = [];
             // 役割アイコン
            positions.push('10%'); // 少し上
             // 状態マーカー
            if (data_access.isRecursive(node)) positions.push('5px'); // 上端
            if (data_access.isCyclic(node)) positions.push('5px'); // 上端
            return positions.join(' ');
        },
        'text-valign': 'center', // ラベルは中央
        'text-margin-y': 0,
      })
      // start/target 用の個別セレクタは不要に

      // クローンマーカー表示 (ghost effect)
      .selector('node[class="document"][clonemarker=true]')
      .css({ /* ... (前回と同じ) ... */
          'ghost': 'yes',
          'ghost-offset-x': config.cloneMarkerOffset.x,
          'ghost-offset-y': config.cloneMarkerOffset.y,
          'ghost-opacity': config.opacities.cloneMarkerGhost,
      })

      // --- Process ノード スタイル (形状統一、アイコンで区別) ---
      .selector('node[class="Process"]')
      .css({
        'shape': config.shapes.process, // 形状を 'square' に統一
        // タイプ別アイコンを背景画像として表示
        'background-image': (node) => {
            const processType = data_access.processType(node);
            // processType が null や undefined の場合も考慮
            const typeKey = processType ? `process${processType.charAt(0).toUpperCase() + processType.slice(1)}` : 'processGeneral';
            const iconUri = getIconDataUri(typeKey);
            return iconUri ? [iconUri] : [];
        },
        'background-width': config.sizes.iconSize,
        'background-height': config.sizes.iconSize,
        'background-position-x': '50%',
        'background-position-y': '50%',
        'text-valign': 'bottom', // ラベルを下に
        'text-margin-y': 3,
        // 論理修飾 (AND/OR/NOT) マーカー (ボーダースタイルで表現)
        'border-style': (node) => data_access.logicType(node) ? 'double' : 'solid',
        'border-color': (node) => { /* ... (前回と同じ) ... */
            const logic = data_access.logicType(node);
            if (logic) return config.colors.logicMarkerBorder;
            return config.colors.nodeStroke;
        },
        'border-width': (node) => data_access.logicType(node) ? config.lineWidths.logicMarkerBorder : config.lineWidths.nodeBorder,
      })

      // --- Agent ノード スタイル ---
      .selector('node[class="Agent"]')
      .css({ /* ... (前回と同じ - アイコンを背景画像で表示) ... */
        'background-color': (node) => {
            const agentType = data_access.agentType(node);
            return config.colors[agentType] || config.colors.nodeFill;
        },
        'background-image': (node) => {
            const agentType = data_access.agentType(node);
            const iconUri = getIconDataUri(agentType);
            return iconUri ? [iconUri] : [];
        },
        'background-width': config.sizes.iconSize,
        'background-height': config.sizes.iconSize,
        'background-position-x': '50%', 'background-position-y': '50%',
        'text-valign': 'bottom', 'text-margin-y': 5,
      })

      // --- 区画 (Compartment) スタイル ---
      .selector('node[class="compartment"]')
      .css({ /* ... (前回と同じ - complex削除済み) ... */
        'shape': 'roundrectangle',
        'background-color': config.colors.compartmentFill,
        'border-color': config.colors.compartmentBorder,
        'border-width': config.lineWidths.compartmentBorder,
        'border-style': (node) => node.data('type') === 'function' ? 'solid' : 'dashed',
        'padding': (node) => node.data('type') === 'function' ? config.sizes.padding.functionCompartment : config.sizes.padding.default,
        'label': (node) => data_access.label(node) || '',
        'text-valign': 'top', 'text-halign': 'center',
        'font-size': config.fonts.size.compartmentLabel, 'font-weight': 'bold',
        'color': config.colors.nodeStroke, 'text-margin-y': -10,
        'compound-sizing-wrt-labels': 'exclude',
      })

      // --- 基本エッジスタイル ---
      .selector('edge')
      .css({ /* ... (前回と同じ) ... */
        'curve-style': 'bezier', 'line-color': config.colors.edgeLine,
        'target-arrow-color': config.colors.edgeLine, 'source-arrow-color': config.colors.edgeLine,
        'width': config.lineWidths.edgeLine, 'arrow-scale': config.sizes.arrowScale,
        'target-arrow-shape': config.shapes.defaultArrow, 'source-arrow-shape': config.shapes.defaultArrow,
        'target-arrow-fill': config.shapes.defaultArrowFill, 'source-arrow-fill': config.shapes.defaultArrowFill,
      })

      // --- Document <-> Process エッジスタイル (双方向性考慮) ---
      .selector('edge[class="production"]')
      .css({ /* ... (前回と同じ - NOT IMPLEMENTED 方向制御) ... */
        'target-arrow-shape': config.shapes.productionArrow,
        'source-arrow-shape': config.shapes.productionArrow,
      })
      .selector('edge[class="consumption"]')
      .css({ /* ... (前回と同じ - NOT IMPLEMENTED 方向制御) ... */
        'target-arrow-shape': config.shapes.consumptionArrow,
        'source-arrow-shape': config.shapes.consumptionArrow,
      })
      .selector('edge[class="stimulation"]')
      .css({ /* ... (前回と同じ - NOT IMPLEMENTED 方向制御) ... */
        'target-arrow-shape': config.shapes.stimulationArrow,
        'source-arrow-shape': config.shapes.stimulationArrow,
      })

      // --- Agent -> Process エッジスタイル ---
      .selector('edge[class="control"]')
      .css({ /* ... (前回と同じ - Cardinality表示なし) ... */
        'line-color': config.colors.controlEdge,
        'target-arrow-color': config.colors.controlEdge,
        'source-arrow-color': config.colors.controlEdge,
        'width': config.lineWidths.controlEdge,
        'target-arrow-shape': config.shapes.controlArrow,
        'source-arrow-shape': 'none',
        'line-style': 'dashed',
      })

      // --- 選択/アクティブ スタイル (修正) ---
      .selector('node:selected') // ノード選択
      .css({
        'border-color': config.colors.selected,
        'border-width': config.lineWidths.selectedBorder,
        // 'background-color': config.colors.selected, // 背景画像と競合するため削除
         'overlay-color': config.colors.selected, // オーバーレイで選択を示す
         'overlay-padding': config.sizes.activeOverlayPadding.node,
         'overlay-opacity': 0.25,
      })
       .selector('edge:selected') // エッジ選択
      .css({
        'line-color': config.colors.selected,
        'target-arrow-color': config.colors.selected,
        'source-arrow-color': config.colors.selected,
        'width': config.lineWidths.controlEdge,
         'overlay-color': config.colors.selected,
         'overlay-padding': config.sizes.activeOverlayPadding.edge,
         'overlay-opacity': 0.25,
      })
      .selector(':active') // タップ/クリック中のスタイル (オーバーレイ)
      .css({
        'overlay-color': config.colors.active,
        'overlay-opacity': config.opacities.activeOverlay,
        'overlay-padding': (ele) => ele.isNode() ? config.sizes.activeOverlayPadding.node : config.sizes.activeOverlayPadding.edge,
      })

      // --- Core スタイル ---
      .selector('core')
      .css({ /* ... (前回と同じ) ... */
        'selection-box-color': config.colors.selected,
        'selection-box-opacity': config.opacities.selectionBox,
        'selection-box-border-color': config.colors.selected,
        'selection-box-border-width': 1,
      });
  };

  return appStyleSheet;
};
