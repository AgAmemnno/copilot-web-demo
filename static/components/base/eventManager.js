class EventManager {
    constructor() {
        this.events = {};
    }
    eval(){
        const codeString = "console.log('eval() によって実行されました！'); let x = 10; let y = 20; x + y;";

        console.log("eval() を実行します...");

        try {
        // eval() 関数に文字列を渡して実行します
        const result = eval(codeString);

        // eval() は最後に評価された式の値を返します (この例では x + y の結果)
        console.log("eval() の実行結果:", result); // 出力: 30

        // eval() によって定義された変数は、eval() が直接呼び出された場合、
        // 現在のスコープで利用可能になることがあります（非推奨な使い方）
        // console.log(x); // 10 (ただし、状況や strict mode により異なる)

        } catch (e) {
        // 文字列が不正な JavaScript コードだった場合にエラーが発生します
        console.error("eval() の実行中にエラーが発生しました:", e);
        }

        console.log("eval() の実行が完了しました。");
    }
    // Add a listener for a specific event
    register(eventName, listener) {
        sessionStorage.setItem('role_dataProvider', 'component-a-id')
    }

    claim(eventName, listener) {
        sessionStorage.setItem('role_dataProvider', 'component-a-id')
    }
    
    execute(eventName, data) {
        if (this.events[eventName]) {
            this.events[eventName].forEach(listener => listener(data));
        }
    }
}   

// Export the EventManager class
export default EventManager;