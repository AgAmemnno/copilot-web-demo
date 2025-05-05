// import { createDraggable,waapi,animate,createTimeline, stagger ,createSpring} from 'https://cdn.jsdelivr.net/npm/animejs/+esm'; // WAAPIではこれらのimportは不要

// Shadow DOMの要素取得部分はそのまま利用
let id = sessionStorage.getItem("test2");
// IDが存在するか確認し、存在しない場合は処理をスキップするなど、エラーハンドリングを加えるとより堅牢になります。
if (!id) {
    console.error("Session storage item 'test2' not found.");
    // 適切なエラーハンドリングや代替処理を行う
} else {
    // Shadow DOMの取得
    let containerElement = document.getElementById(id);
    let shadowRoot = containerElement ? containerElement.shadowRoot : null;

    if (!shadowRoot) {
        console.error("Shadow root not found for element with id:", id);
        // 適切なエラーハンドリングや代替処理を行う
    } else {
        // 要素の取得

        const menuElement = shadowRoot.querySelector('.menu');
        const menuOpenButton = shadowRoot.querySelector('.menu-open-button');
        const menuItems = shadowRoot.querySelectorAll('.menu-item');
        const lines = menuOpenButton.querySelectorAll('.lines'); // line-1, line-2, line-3

        const category   = menuItems[0];
        const category2   = menuItems[1];
        const category3   = menuItems[2]
        const category4   = menuItems[3];
;

        const inputOuter = shadowRoot.querySelector('#alarm-minus');
        const graphOuter = shadowRoot.querySelector('#alarm-top');
        const promptOuter = shadowRoot.querySelector('#battery-full');
        const iframeOuter = shadowRoot.querySelector('#chat-teardrop-text');

        if (!menuElement || !menuOpenButton || menuItems.length === 0 || lines.length !== 3) {
             console.error("One or more required elements not found in shadow root.");
             // 要素が見つからなかった場合のエラーハンドリング
             // 例: return;
        } else {
            // --- 状態変数 ---
            let isMenuOpen = false;
            let isDragging = false;
            let initialX, initialY; // ドラッグ開始時のマウスポインタ/タッチ位置
            // menuElementのtransform:translateの現在のオフセット値を保持
            let xOffset = 0;
            let yOffset = 0;

            // --- 初期スタイル設定とドラッグのためのオフセット計算 ---
            // menuElementの初期transform値を取得 (translate(-50%, -50%) などを考慮するため)
            // WAAPIや手動ドラッグでtransformを操作するため、left/topではなくtransformを基準にする
            const initialTransform = window.getComputedStyle(menuElement).transform;
            if (initialTransform && initialTransform !== 'none') {
                const matrix = new DOMMatrix(initialTransform);
                xOffset = matrix.m41; // translateX
                yOffset = matrix.m42; // translateY
                 // Note: もし初期スタイルがleft/topで指定されている場合は、
                 // ここでその値を読み取り、一度transformに変換して初期オフセットとすることも可能
                 // (ただし、元のコードのように left/top を 0 にリセットする必要があるか検討)
            } else {
                 // transformが設定されていない場合、初期オフセットを0とする (中心に置くCSSを想定しない場合)
                 // または、left/topを計算して初期位置をtransformで設定し直す場合は元のコードを参照
                 xOffset = 0; // transform: none の場合は初期オフセット0
                 yOffset = 0; // transform: none の場合は初期オフセット0
                 menuElement.style.transform = 'translate3d(0px, 0px, 0)'; // 明示的に初期transformを設定
            }

            // --- 初期アニメーション (WAAPIで初期状態を設定) ---
            // WAAPIで「アニメーションせずに」初期状態を設定する場合、
            // animateに duration: 0 を指定するか、単に style を設定する。
            // ここでは、後の開閉アニメーションの「開始状態」としてこれらの値を定義するので、
            // 明示的な初期アニメーションは不要か、単なる style 設定で十分な場合が多い。
            // 元のコードの initial animate は、おそらく初期状態をアニメーション可能なプロパティとして設定するため。
            // WAAPIではキーフレームのFrom値として定義する方が一般的。
            // ただし、視覚的な初期状態をここで確定させるために style 設定を使うのはあり。

            // ハンバーガー線の初期位置
            lines[0].style.transform = 'translateY(-8px)';
            lines[1].style.transform = 'scaleX(1)';
            lines[1].style.opacity   = '1';
            lines[2].style.transform = 'translateY(8px)';

            // メニューアイテムの初期状態（中央、非表示）
            menuItems.forEach(item => {
                item.style.transform = 'translate(0px, 0px) scale(0.5)';
                item.style.opacity = '0.2';
                item.style.pointerEvents = 'none'; // 最初はクリック不可
            });

            // ボタンの初期スケール
            menuOpenButton.style.transform = 'scale(1.1)'; // 初期スケール

            inputOuter.style.transform = `scale(0.0)`;
            
            function animCategory (e,Category,Outer){
                
                const dst1 =  new DOMMatrix(window.getComputedStyle(menuElement).transform).translate().transformPoint();
                const dst2 =  new DOMMatrix(window.getComputedStyle(e.target).transform).translate().transformPoint();
                const x = (dst1.x + dst2.x) ;
                const y = (dst1.y + dst2.y) ;
    
                const centerX = document.documentElement.clientWidth / 2;
                const centerY = document.documentElement.clientHeight / 2;
               
                if(Category.dataset.is_element == "close")
                {
                    Outer.style.transform = `translate(${x}px, ${y}px) scale(0)`;
                    Outer.animate([
                            { transform: `translate(${x}px, ${y}px) scale(0)` } ,
                            { transform: `translate(0px, 0px) scale(1)` },
                        ],
                        {
                             duration: 500, 
                             easing: 'ease-out',
                             fill: 'forwards'
                        });
                    Category.dataset.is_element = "open";
                }else{
                    const center = `translate(${centerX}px, ${centerY}px) scale(1) `;
                    Outer.animate([
                            { transform: `translate(0px, 0px) scale(1)` },
                            { transform: `translate(${x}px, ${y}px) scale(0)` } 
                        ],
                        {
                             duration: 500, 
                             easing: 'ease-out',
                             fill: 'forwards'
                        });
                    Category.dataset.is_element = "close";
                }
                
            }
            category.dataset.is_element = "close";
            category.addEventListener('click', (e)=>{
                animCategory (e,category,inputOuter);
            });
            
            graphOuter.style.transform = `scale(0.0)`;
            category2.dataset.is_element = "close";
            category2.addEventListener('click', (e)=>{
                animCategory (e,category2,graphOuter);
                if(category2.dataset.is_element == "open")
                {
                    document.getElementById("cy").style.display = "block";
                    document.getElementById("rightPanelContainer1").style.display = "grid";
                    document.getElementById("rightPanelContainer2").style.display =  "grid";
                  
                }else{
                    document.getElementById("cy").style.display = "none";
                    document.getElementById("rightPanelContainer1").style.display = "none";
                    document.getElementById("rightPanelContainer2").style.display =  "none";
                   
                }
            });

            promptOuter.style.transform = `scale(0.0)`;
            category3.dataset.is_element = "close";
            category3.addEventListener('click', (e)=>{
                animCategory (e,category3,promptOuter);
                if(category3.dataset.is_element == "open")
                {

                  
                }else{

                   
                }
            });

            iframeOuter.style.transform = `scale(0.0)`;
            category4.dataset.is_element = "close";
            category4.addEventListener('click', (e)=>{
                animCategory (e,category4,iframeOuter);
                if(category4.dataset.is_element == "open")
                {
                 iframeOuter.menu.pushFrame();
                  
                }else{
                 iframeOuter.menu.popFrame();
                   
                }
            });
            // --- ドラッグ機能 (WAAPIの機能ではないため手動で実装) ---
            // anime.jsのcreateDraggableの代わり
            menuElement.addEventListener('mousedown', dragStart);
            menuElement.addEventListener('touchstart', dragStart, { passive: false });

            function dragStart(e) {
                // メニュー開閉ボタン自身や、開いているメニューアイテムをクリックした場合はドラッグしない
                // 注意: e.targetのチェックはShadow DOM内の要素を正しく扱う必要があります。
                // composedPath()を使うとShadow DOM境界を越えてイベントパスを辿れます。
                /* 
                const path = e.composedPath();
                 if (path.includes(menuOpenButton) || (isMenuOpen && path.some(el => el.classList && el.classList.contains('menu-item')))) {
                     // イベントがボタンまたはメニューアイテム内で発生した場合はドラッグを開始しない
                    // ただし、menuElement自体へのmousedown/touchstartは許可したい場合もあるので、
                    // ここでの条件は意図に応じて調整してください。
                    // 元のコードではボタンや開いているメニューアイテム自体のクリックは除外しているようです。
                     // ここでは「ドラッグを開始すべきでないクリックか？」を判定しています。
                     // ドラッグしたい領域（例: メニュー要素全体だが、ボタンは除く）に応じて調整が必要です。
                     // 簡単のため、元のコードのターゲットチェックロジックを模倣します。
                      if (e.target === menuOpenButton || menuOpenButton.contains(e.target) || (isMenuOpen && Array.from(menuItems).some(item => item.contains(e.target)))) {
                           return; // ドラッグ開始対象外
                      }
                 }
                 */


                isDragging = true;
                menuElement.style.cursor = 'grabbing'; // ドラッグ中はカーソルを変更

                // 初期クリック/タッチ位置と要素の現在のオフセットを基に、ドラッグ開始位置を計算
                if (e.type === 'touchstart') {
                    initialX = e.touches[0].clientX - xOffset;
                    initialY = e.touches[0].clientY - yOffset;
                } else {
                    initialX = e.clientX - xOffset;
                    initialY = e.clientY - yOffset;
                }

                // move/endリスナーをwindowに追加 (要素外に出ても追従)
                window.addEventListener('mousemove', drag);
                window.addEventListener('mouseup', dragEnd);
                window.addEventListener('touchmove', drag, { passive: false }); // touchmoveはpassive: falseが必要な場合が多い
                window.addEventListener('touchend', dragEnd);
                window.addEventListener('touchcancel', dragEnd); // touchcancelも考慮

                // ドラッグ開始時のデフォルト動作（テキスト選択など）を防止
                 if(e.cancelable) e.preventDefault();
            }

            function drag(e) {
                if (!isDragging) return;
                 // ドラッグ中のデフォルト動作（スクロールなど）を防止
                 // 特にタッチイベントでは重要
                if(e.cancelable) e.preventDefault();

                let clientX, clientY;
                if (e.type === 'touchmove') {
                    // 複数のタッチがある場合は最初のタッチを追跡
                    clientX = e.touches[0].clientX;
                    clientY = e.touches[0].clientY;
                } else {
                    clientX = e.clientX;
                    clientY = e.clientY;
                }

                // 新しいオフセットを計算
                const currentX = clientX - initialX;
                const currentY = clientY - initialY;

                // 次回のドラッグのためにオフセットを更新
                xOffset = currentX;
                yOffset = currentY;

                // transformで要素を移動 (translate3dを使用)
                menuElement.style.transform = `translate3d(${currentX}px, ${currentY}px, 0)`;
            }

            function dragEnd(e) {
                if (!isDragging) return; // ドラッグ中でない場合は何もしない
                isDragging = false; // ドラッグ終了
                menuElement.style.cursor = 'grab'; // カーソルを元に戻す

                // イベントリスナーを削除
                window.removeEventListener('mousemove', drag);
                window.removeEventListener('mouseup', dragEnd);
                window.removeEventListener('touchmove', drag);
                window.removeEventListener('touchend', dragEnd);
                window.removeEventListener('touchcancel', dragEnd);
            }
            const buttonLineDuration = 200; 

            var lines0kf = new Animation( new KeyframeEffect(
                 lines[0],
                    [
                        { transform:  'translateY(-8px) rotate(0deg)' }, // from
                        { transform:  'translateY(0px) rotate(45deg)' }  // to
                    ],
                    {
                        duration: buttonLineDuration,
                        easing: 'ease-in-out', // animejsの 'easeInOutSine' に相当
                        fill: 'forwards' // アニメーション終了後、最終状態を維持
                    }
                ),document.timeline);

              
            var lines1kf = new Animation( new KeyframeEffect(
                 lines[1],
                    [
                        { transform:'scaleX(1)' , opacity: 1 }, // from
                        { transform: 'scaleX(0)' , opacity:0 }  // to
                    ],
                    {
                        duration: buttonLineDuration / 2, // 真ん中の線は少し速く消える/現れる
                        easing: 'ease-in-out', // animejsの 'easeInOutSine' に相当
                        fill: 'forwards'
                    }
                ),document.timeline);

                // line-3 (下)
            var lines2kf = new Animation( new KeyframeEffect(
                 lines[2],
                    [
                        { transform: 'translateY(8px) rotate(0deg)' }, // from
                        { transform: 'translateY(0px) rotate(135deg)' }  // to
                    ],
                    {
                        duration: buttonLineDuration,
                        easing: 'ease-in-out', // animejsの 'easeInOutSine' に相当
                        fill: 'forwards'
                    }
                ),document.timeline);


            var openbtnkf =  new Animation( new KeyframeEffect(
                 menuOpenButton,
                    [
                         { transform:  'scale(1.1)' }, // from
                         { transform:  'scale(0.8)' }  // to
                    ],
                    {
                        duration: buttonLineDuration,
                        easing: 'linear', // animejsの 'linear' に相当
                        fill: 'forwards'
                    }
            ),document.timeline);
            
    
            // --- メニューアニメーションのためのターゲット位置 ---
            // 各アイテムのターゲット相対位置 (元のCSSの値)
            const targetPositions = [
                { x: 0.08361, y: -104.99997 }, // item 1 (nth-child(3))
                { x: 90.9466, y: -52.47586 },  // item 2 (nth-child(4))
                { x: 90.9466, y: 52.47586 },   // item 3 (nth-child(5))
                { x: 0.08361, y: 104.99997 },  // item 4 (nth-child(6))
                { x: -90.86291, y: 52.62064 }, // item 5 (nth-child(7))
                { x: -91.03006, y: -52.33095 }  // item 6 (nth-child(8))
            ];
          
            const duration = 380;
            const staggerDelay = 50; // アイテム間の遅延
            let menuItemAnims = [];
            function handleAnimationFinish(event) {
               
                const animation = event.target; // 完了したAnimationオブジェクトを取得
                // アニメーション対象の要素を取得
                const element = animation.effect.target;
            
                if (!element) {
                    console.error("Animation target element not found.");
                    return;
                }
                const isMenuOpen =  element.dataset.is_open === "true";;
                if(( (!isMenuOpen) && (element.dataset.nth ===  "first")) || ( isMenuOpen && (element.dataset.nth ===  "last"))){
                    return ;
                }
                //console.log(`onfinish2  isMenuOpen  ${isMenuOpen} element.dataset.nth ${element.dataset.nth}`);
                const finalButtonAnim = menuOpenButton.animate(
                    [
                         // 現在の状態（前のスケールアニメーションの最終状態）から
                        { transform: isMenuOpen ? 'scale(1.1)' : 'scale(0.8)' }, // from (閉じる場合は0.8 -> 1.1 -> 0.6, 開く場合は1.1 -> 0.8 -> 1.1)
                         // transform プロパティは合成されるので、rotateも忘れずに含める
                         // 例: scale(X) rotate(Y)
                         // ただし、animejsのrotate: { to: ... }は累積回転を指定している可能性もあるので注意
                         // ここでは単純に最終的な回転角度を指定
                         { transform: `${isMenuOpen ? 'scale(1.1)' : 'scale(0.8)'} rotate(${isMenuOpen ? -360 : 360}deg)` } // to (閉じる場合は-360度、開く場合は360度)
                    ],
                    {
                         // durationは適宜調整
                         duration: 500, // 例として duration を設定
                         easing: 'ease-out', // Spring easingの代用としてease-out
                         fill: 'forwards'
                    }
                );
                // pointer-events の切り替え
                // 開くアニメーション完了後 -> auto (クリック可能)
                // 閉じるアニメーション完了後 -> none (クリック不可)
                menuItems.forEach(item => {
                    item.style.pointerEvents = isMenuOpen ? 'none' : 'auto';
                });

               // menuItemAnims.forEach((a,i)=>{console.log(` onfinish    i ${i} CurrentTime ${a.currentTime}`);});
                  
            }
            
            const timingF = {
                duration:duration, // 少し長め
                easing: 'cubic-bezier(0.935, 0, 0.34, 1.33)', // 元のCSSのeasing (WAAPIでも使用可能)
                delay: 0, // アイテムごとに遅延を計算
                fill: 'forwards',
                direction :"normal"
            }
            const timingB = {
                duration:duration, // 少し長め
                easing: 'cubic-bezier(0.935, 0, 0.34, 1.33)', // 元のCSSのeasing (WAAPIでも使用可能)
                delay: 0, // アイテムごとに遅延を計算
                fill: 'backwards',
                direction :"reverse"
            }
            menuItemAnims = Array.from(menuItems).map((item, i) => {
                        // ターゲット位置と初期位置 (0,0) を利用
                const targetX = targetPositions[i].x;
                const targetY = targetPositions[i].y;
                        // 開いている場合は、アニメーションを逆再生する
                var menuKeyframes = new KeyframeEffect(
                        item, 
                        [
                          { // from state (closed)
                                transform: `translate(0px, 0px) scale(0.5)`,
                                opacity: 0.2,
                          },
                          { // to state (open)
                                transform: `translate(${targetX}px, ${targetY}px) scale(1)`,
                                opacity: 1,
                          }
                        ], 
                        timingF
                    );
                var menuAnimation = new Animation(menuKeyframes, document.timeline);
                if( (i == menuItems.length - 1) ||(i==0))
                {
                   menuAnimation.onfinish = handleAnimationFinish;
                };
                return menuAnimation;
            });
            
            const animArray = [...menuItemAnims,lines0kf, lines1kf, lines2kf, openbtnkf];
            animArray[ 0 ].effect.target.dataset.nth =  "first";
            animArray[ menuItemAnims.length - 1].effect.target.dataset.nth =  "last";
            
            menuOpenButton.addEventListener('click', () => {
                //animArray.forEach((a,i)=>{console.log(` onclick start   i ${i} CurrentTime ${a.currentTime}`);});
                //console.log(`click isDragging ${isDragging} isMenuOpen ${isMenuOpen} `);
                if (isDragging) return; // ドラッグ操作中はボタンクリックを無視

                animArray[0].effect.target.dataset.is_open = isMenuOpen;
                animArray[ menuItemAnims.length - 1].effect.target.dataset.is_open = isMenuOpen;
                (isMenuOpen)?
                    animArray.forEach((a,i) => { 
                      timingB.delay = i*staggerDelay;
                      a.effect.updateTiming(timingB);
                      a.playbackRate = 0.8; 
                      a.play(); 
                    })
                :
                    animArray.forEach((a,i)=>{ 
                      timingF.delay = i*staggerDelay;
                      a.effect.updateTiming(timingF);
                      a.playbackRate = 0.8;a.play(); 
                    });
                
                isMenuOpen = !isMenuOpen;
                /*
                console.log(`finish   isMenuOpen ${isMenuOpen}`);
                setTimeout(() => {
                     animArray.forEach((a,i)=>{console.log(` onclick end   i ${i} CurrentTime ${a.currentTime}`);});
                  
                }, duration*10);
                */
            });
            
        } // End of element found check
    } // End of shadow root check
} // End of id check