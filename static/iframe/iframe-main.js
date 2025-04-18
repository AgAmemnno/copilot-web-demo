// iframe-main.js
import { MyIframeClass } from './iframe-module.js';

let appendGlobal = true;

if(appendGlobal){
    
// 同一オリジンであることを確認 (任意だが推奨)
try {
    // window.parent にアクセスして親のグローバルスコープに登録
    if (window.parent && window.parent !== window) { // 自分自身でないことを確認
        window.parent.MyClassExposedFromIframe = MyIframeClass;
        console.log('MyIframeClass assigned to window.parent.MyClassExposedFromIframe');
    } else {
         console.log('No parent window or same as self.');
    }
} catch (e) {
    console.error('Could not access parent window (cross-origin restriction?):', e);
}

// iframe 自身のグローバルにも公開しておくことも可能
window.MyGlobalIframeClass = MyIframeClass;




}else{
// この window は iframe の window オブジェクト
window.MyGlobalIframeClass = MyIframeClass;

console.log('MyIframeClass assigned to window.MyGlobalIframeClass within the iframe.');

// iframe 内の他のスクリプトやコンソールからアクセス可能
const instance = new MyGlobalIframeClass('iframe-1');
instance.whoAmI();
}




