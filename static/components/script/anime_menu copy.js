import {  createDraggable,waapi,animate,createTimeline, stagger ,createSpring} from 'https://cdn.jsdelivr.net/npm/animejs/+esm';

let id  = sessionStorage.getItem("test2");

let shadowRoot = document.getElementById(id).shadowRoot;


const menuElement = shadowRoot.querySelector('.menu');
const menuOpenButton = shadowRoot.querySelector('.menu-open-button');
const menuItems = shadowRoot.querySelectorAll('.menu-item');
const lines = menuOpenButton.querySelectorAll('.lines'); // line-1, line-2, line-3

let isMenuOpen = false;
let isDragging = false;
let currentX, currentY, initialX, initialY;
// menuElementのtransform:translateの値を保持
let xOffset = 0;
let yOffset = 0;

// --- 初期スタイル設定 (CSSで設定してもOK) ---
// menuElementの初期transform値を取得(translate(-50%, -50%)などを考慮するため)
const initialTransform = window.getComputedStyle(menuElement).transform;
if (initialTransform && initialTransform !== 'none') {
    const matrix = new DOMMatrix(initialTransform);
    xOffset = matrix.m41; // translateX
    yOffset = matrix.m42; // translateY
} else {
    // transformが設定されていない場合、left/topから初期オフセットを計算
    xOffset = menuElement.offsetLeft;
    yOffset = menuElement.offsetTop;
    // 初期位置をtransformで設定し直す (ドラッグ処理を統一するため)
    menuElement.style.left = '0px';
    menuElement.style.top = '0px';
    menuElement.style.transform = `translate3d(${xOffset}px, ${yOffset}px, 0)`;
}


// ハンバーガー線の初期位置
animate(lines[0], { translateY: -8 });
animate(lines[1], { scaleX: 1, opacity: 1 });
animate(lines[2], { translateY: 8 });
// メニューアイテムの初期状態（中央、非表示）
animate(menuItems, { translateX: 0, translateY: 0, opacity: 0.2, scale: 0.5, pointerEvents: 'none' });
// ボタンの初期スケール
animate(menuOpenButton, { scale: 1.1 });


/*
 --- ドラッグ機能 ---
menuElement.addEventListener('mousedown', dragStart);
menuElement.addEventListener('touchstart', dragStart, { passive: false });

function dragStart(e) {
    // メニュー開閉ボタン自身や、開いているメニューアイテムをクリックした場合はドラッグしない
    if (e.target === menuOpenButton || menuOpenButton.contains(e.target) || (isMenuOpen && Array.from(menuItems).includes(e.target.closest('.menu-item')))) {
        //return;
    }

    isDragging = true;
    menuElement.style.cursor = 'grabbing';

    if (e.type === 'touchstart') {
        // タッチイベントの場合、最初のタッチポイントを使用
        initialX = e.touches[0].clientX - xOffset;
        initialY = e.touches[0].clientY - yOffset;
    } else {
        initialX = e.clientX - xOffset;
        initialY = e.clientY - yOffset;
    }

    // move/endリスナーをwindowに追加 (要素外に出ても追従)
    window.addEventListener('mousemove', drag);
    window.addEventListener('mouseup', dragEnd);
    window.addEventListener('touchmove', drag, { passive: false });
    window.addEventListener('touchend', dragEnd);

    // ドラッグ開始時のデフォルト動作（テキスト選択など）を防止
    if(e.cancelable) e.preventDefault();
}

function drag(e) {
    if (!isDragging) return;
    // ドラッグ中のデフォルト動作（スクロールなど）を防止
    if(e.cancelable) e.preventDefault();

    let clientX, clientY;
    if (e.type === 'touchmove') {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
    } else {
        clientX = e.clientX;
        clientY = e.clientY;
    }

    currentX = clientX - initialX;
    currentY = clientY - initialY;

    xOffset = currentX;
    yOffset = currentY;

    // transformで要素を移動
    menuElement.style.transform = `translate3d(${currentX}px, ${currentY}px, 0)`;
}

function dragEnd(e) {
    if (!isDragging) return;
    isDragging = false;
    menuElement.style.cursor = 'grab';

    // イベントリスナーを削除
    window.removeEventListener('mousemove', drag);
    window.removeEventListener('mouseup', dragEnd);
    window.removeEventListener('touchmove', drag);
    window.removeEventListener('touchend', dragEnd);
}
*/
createDraggable(menuElement,{
    container: '#full-screen',
})
// --- メニューアニメーション ---
// 各アイテムのターゲット相対位置 (元のCSSの値)
const targetPositions = [
    { x: 0.08361, y: -104.99997 }, // item 1 (nth-child(3))
    { x: 90.9466, y: -52.47586 },  // item 2 (nth-child(4))
    { x: 90.9466, y: 52.47586 },   // item 3 (nth-child(5))
    { x: 0.08361, y: 104.99997 },  // item 4 (nth-child(6))
    { x: -90.86291, y: 52.62064 }, // item 5 (nth-child(7))
    { x: -91.03006, y: -52.33095 }  // item 6 (nth-child(8))
];


// --- イベントリスナー (メニュー開閉) ---
menuOpenButton.addEventListener('click', () => {
    if (isDragging) return; // ドラッグ操作中はボタンクリックを無視
    const tl = createTimeline({
        onComplete: () => {
            animate(menuItems, { pointerEvents: isMenuOpen ? 'auto' : 'none' });
            waapi.animate(menuOpenButton, {
                scale: isMenuOpen ? 0.6:1.1,
                rotate: {
                  to: isMenuOpen ? -360:360,
                  ease: 'out(6)',
                },
                ease: createSpring({ stiffness: 70 }),
              });
        },
        defaults: {
          ease: 'easeOutExpo',
          duration: 1000,
        }
      })
        .add( lines[0], {
            translateY: isMenuOpen ?-8: 0, // 中央へ
            rotate:  isMenuOpen ?0:45,
            duration: 200,
            easing: 'ease-in-out'
        }, 0) // タイムラインの0msから開始
        .add(lines[1], {
            scaleX: isMenuOpen ?1: 0, 
            opacity: isMenuOpen ?1: 0, 
            duration: 100,
            easing: 'ease-in-out'
        }, 0)
        .add(lines[2],{
            translateY: isMenuOpen ?8: 0, // 中央へ
            rotate: isMenuOpen ?0:135,
            duration: 200,
            easing: 'ease-in-out'
        }, 0)
        .add(menuOpenButton,{
            scale:  isMenuOpen ? 1.1 : 0.8, // 縮小
            duration: 200,
            easing: 'linear'
        }, 0) // 線のアニメーションと同時に開始
        // 3. メニューアイテムの展開アニメーション
        .add( menuItems,{
            translateX: (el, i) => isMenuOpen  ? 0: targetPositions[i].x,
            translateY: (el, i) => isMenuOpen  ? 0:  targetPositions[i].y,
            scale: isMenuOpen  ?0:1,    // 元のサイズに戻す
            opacity: isMenuOpen  ?0:1,    
            duration: 380, // 少し長め
            easing: 'cubicBezier(0.935, 0, 0.34, 1.33)', // 元のCSSのeasing
            delay: stagger( [50,50 ]) // 50ms後から50msずつずれて開始
        }, 0); // ボタンのアニメーションが少し始まってから開始

    if (isMenuOpen) {
           animate(menuItems, { pointerEvents: 'auto' });
    }
    isMenuOpen = !isMenuOpen; // メニューの状態をトグル
});

