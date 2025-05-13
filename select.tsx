
// このiframeのグローバルスコープに値を設定します
// (例: window.iframeScopedGlobalValue)



const create_selector = (TARGET_GLOBAL_VAR_NAME) => { 


    const modeSelector = document.getElementById('modeSelector');
    const inputPromptMessageElement = document.getElementById('inputPromptMessage');
    const valueInput = document.getElementById('valueInput');
    const processInputButton = document.getElementById('processInputButton');
    const clearInputButton = document.getElementById('clearInputButton');
    
    const objectPropertyInputContainer = document.getElementById('objectPropertyInputContainer');
    const objectPropertyKeyInput = document.getElementById('objectPropertyKey');
    
    function updatePromptAndInputs() {
        const selectedMode = modeSelector.value;
        objectPropertyInputContainer.classList.add('hidden'); // デフォルトで非表示
    
        switch (selectedMode) {
            case 'setPat':
                inputPromptMessageElement.textContent = '値を入力してPatに設定します:';
                break;
            case 'toUpperCase':
                inputPromptMessageElement.textContent = '値を入力して大文字に変換し、「大文字値」に設定します:';
                break;
            case 'addToList':
                inputPromptMessageElement.textContent = '値を入力して「リスト」に追加します:';
                break;
            case 'setObjectProperty':
                inputPromptMessageElement.textContent = 'プロパティ名と値を入力して「オブジェクト」に設定します:';
                objectPropertyInputContainer.classList.remove('hidden');
                break;
            default:
                inputPromptMessageElement.textContent = '値を入力してください:';
        }
    }
    
    function handleProcessInput(main) {
        const inputValue = valueInput.value;
        const selectedMode = modeSelector.value;
    
        switch (selectedMode) {
            case 'setPat':
                window[TARGET_GLOBAL_VAR_NAME] = inputValue;
                console.log(`window.normalValue が "${inputValue}" に設定されました。`);
                break;
            case 'toUpperCase':
                window.uppercaseValue = inputValue.toUpperCase();
                console.log(`window.uppercaseValue が "${window.uppercaseValue}" に設定されました。`);
                break;
            case 'addToList':
                window.valueList.push(inputValue);
                console.log(`"${inputValue}" が window.valueList に追加されました。リスト:`, window.valueList);
                break;
            case 'setObjectProperty':
                const propertyKey = objectPropertyKeyInput.value;
                if (propertyKey) {
                    window.customObject[propertyKey] = inputValue;
                    console.log(`window.customObject["${propertyKey}"] が "${inputValue}" に設定されました。オブジェクト:`, window.customObject);
                } else {
                    alert("プロパティ名を入力してください。");
                    return; // 更新をスキップ
                }
                break;
        }
        main();
        // valueInput.value = ''; // 連続入力のためにクリアしない場合もある
        // objectPropertyKeyInput.value = ''; // 同上
    }
    
    
    function openLocalCustomPrompt(main) {
    
        modeSelector.addEventListener('change', updatePromptAndInputs);
        processInputButton.addEventListener('click', handleProcessInput.bind(null, main));
        clearInputButton.addEventListener('click', () => {
            valueInput.value = '';
            objectPropertyKeyInput.value = '';
            console.log("入力フィールドがクリアされました。");
        });
    
    }
    
    
    
    return { 
        open : openLocalCustomPrompt,
    
    }
    }
    
    export {create_selector};
    