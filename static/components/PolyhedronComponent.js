import BaseHTMLComponentWithEvent from './base/BaseHTMLComponentWithEvent.js';
import { rotationParams } from '/components/hedron/platonic-data.js'; // 軸/角度データをインポート
import { generateMatrixFromAxisAngle } from '/components/hedron/matrix-utils.js'; // 行列生成関数をインポート
import { MatrixPathNavigator } from '/components/hedron/MatrixPathNavigator.js'; // 新しいクラスをインポート

import * as glMatrix  from 'https://cdn.jsdelivr.net/npm/gl-matrix@3.4.3/+esm'
// Requires gl-matrix library (loaded via CDN in html)

const mat4 = glMatrix.mat4; // 4x4 matrix functions

// --- データ準備: 軸/角度データから行列データを作成 ---
function createOperationMatrixMap(params) {
    const matrixMap = new Map();
    for (const opId in params) {
        const param = params[opId];
        const matrix = generateMatrixFromAxisAngle(param.axis, param.angle);
        matrixMap.set(opId, matrix);
    }
    return matrixMap;
}

// T, O, I グループの行列マップを作成 (Iは不完全なデータに基づく)


class Orbit {
    
    #isDragging = false;
    #previousX = 0;
    #previousY = 0;
    #flagX = -1;
    #flagY = 1;
    #rotateX = 0; // 現在のX軸周りの回転角度
    #rotateY = 0; // 現在のY軸周りの回転角度
    // 回転感度
    #sensitivity = 1.0;
    #boundMouseDown = this.#MouseDown.bind(this);
    #boundMouseMove = this.#MouseMove.bind(this);
    #boundMouseUpOrLeave = this.#MouseUpOrLeave.bind(this);
    #irotateX = 360;
    #irotateY = 360;
    constructor(ele,target){
        this.ele = ele;
        this.target = target;
        this.register();
    }
    
    #MouseDown(event){
        this.#isDragging = true;
        this.ele.classList.add('dragging');
        // event.clientX/Y はビューポート基準の座標
        this.#previousX = event.clientX;
        this.#previousY = event.clientY;

        this.#irotateX = 360 + this.#rotateX;
        this.#irotateY = 360 + this.#rotateY;
        // ドラッグ中はトランジションを一時的に無効化することが多い
        // orbitObject.style.transition = 'none'; // CSSで .dragging クラスで制御
    };

    #MouseMove(event){
        if (!this.#isDragging) return;

        const currentX = event.clientX;
        const currentY = event.clientY;

        // マウスの移動量
        const deltaX = currentX - this.#previousX;
        const deltaY = currentY - this.#previousY;


        this.#rotateX += this.#flagX * deltaX * this.#sensitivity; // Y軸と逆方向に回すことが多い
        this.#rotateY += this.#flagY * deltaY * this.#sensitivity;
        
       if((this.#rotateX > this.#irotateX) || (this.#rotateX < (this.#irotateX-720)) ){
           if(this.#rotateX > this.#irotateX){
               this.#rotateX = this.#irotateX;
           }else{
               this.#rotateX =  (this.#irotateX-720);
           }
           //this.#flagX *= -1;
       }
       if( (this.#rotateY > this.#irotateY) || (this.#rotateY < (this.#irotateX-720) )){
           if(this.#rotateY > this.#irotateX){
               this.#rotateY = this.#irotateX;
           }else{
               this.#rotateY = (this.#irotateX-720);
           }
           //this.#flagY *= -1;
       }

    
        console.log(` X ${currentX} Y   ${currentY}    rotateX(${this.#rotateX}deg) rotateY(${this.#rotateY}deg) `);
        // CSSのtransformプロパティを更新
        var rX = -this.#rotateX ;
        var rY = -this.#rotateY;
        this.target.forEach( (ele) =>{
            if( ("transformOrigin"  in ele ) &&  ( ele.transformOrigin !="") ){
                ele.style.transform = `rotateY(${rX}deg) rotateX(${rY}deg) ${ele.transformOrigin}`;
            }else{
                ele.style.transform = `rotateY(${rX}deg) rotateX(${rY}deg)`;
            }
        });

        // 現在の位置を保存
        this.#previousX = currentX;
        this.#previousY = currentY;
    };

    #MouseUpOrLeave(event){
        if (this.#isDragging) {
            this.#isDragging = false;
            this.ele.classList.remove('dragging');
            // ドラッグ終了時にトランジションを戻す（滑らかな停止のため）
            // orbitObject.style.transition = 'transform 0.1s ease-out'; // CSSで制御
        }
    };

    // イベントリスナーを登録
    register(){
        window.addEventListener('mousedown', this.#boundMouseDown);
        window.addEventListener('mousemove', this.#boundMouseMove); // windowでmousemoveを監視
        window.addEventListener('mouseup', this.#boundMouseUpOrLeave);   // windowでmouseupを監視
    }
}


const getNagivator = (selectedGroup = 'T')=>{

    let userPath = [];

    const operationMatrices = {
        T: createOperationMatrixMap(rotationParams.T),
        O: createOperationMatrixMap(rotationParams.O),
        I: createOperationMatrixMap(rotationParams.I)
    };

    if (selectedGroup === 'T') {
            userPath = ['T_C3_111_120', 'T_C2_X_180', 'T_C3_111_240', 'T_C2_X_180'];
    } else if (selectedGroup === 'O') {
        // 例: Oグループのパス (軸周りの90度回転など)
            userPath = ['O_C4_Z_90', 'O_C4_X_90', 'O_C3_111_120', 'O_C4_X_270', 'O_C4_Z_270'];
    } else { // Iグループ (データ不完全なので注意)
            userPath = ['I_C5_A1_72', 'I_C2_C1_180', 'I_C5_A1_144']; // 例
    }

    console.log(`Setting up navigator for Group: ${selectedGroup}, Path:`, userPath);

    // ナビゲーターを初期化
    return new MatrixPathNavigator(operationMatrices[selectedGroup], userPath);
}

// --- 共通関数定義 ---
class PolyhedronComponent extends BaseHTMLComponentWithEvent {
    #shadowRoot;
    #config = null;
    #elements = new Map(); // Store references to created elements
    #rotatedState = new Map(); // Store rotated state for each element id
    #hinge_done = new Map();
    #data_num = 0;
    // --- Dragging State ---
    #isDragging = false;
    #startX = 0;
    #startY = 0;
    // Store scene position instead of rotation
    #initialSceneTop = 0;
    #initialSceneLeft = 0;
    #currentSceneTop = 0;
    #currentSceneLeft = 0;
    #sceneElement = null; // Reference to the scene element
    #rboxContainer = null; // Reference to the container (still needed for content)


    #faceTree = null;
    #center  = null;
    #currentNode = null;
    #navigator = null;
    #orbit =null;
    constructor() {
        super();
    }
    ishadow(){}
    set data_num(num) {
        this.#data_num = num;
    }
    static requiredStyleVariables = [
        '--c-card-padding',
        '--c-card-bg-color',
        '--c-card-border-radius',
        '--c-card-text-color'
    ];
    // Configuration data can be set via property
    set config(newConfig) {
        if (!this.#isValidConfig(newConfig)) {
            console.error('Invalid configuration provided to polyhedron-rotator.');
            return;
        }
        this.#config    = newConfig;
        var Char = '';
        switch (this.#data_num) {
            case 0:
                Char =  'T';
                break;
            case 1:
            case 2:
                Char = 'O';
                break;
            case 3:
            case 4:
                Char = 'I';
                break;
            default:
                Char = 'O';
                break;   
        }
        this.#navigator = getNagivator(Char);
        
        this.#rotatedState.clear(); // Reset state when config changes
        this.#calcCenter();
        this.#render();
        this.foldAll();
    }
    #calcCenter(){
        const { width, height, perspective, transitionDuration,margin } = this.#config.settings;
        this.width  = parseInt(width.replace("px","")); // Default width
        this.height = parseInt(height.replace("px","")); // Default width
        this.margin = margin || '0%'; // Default margin
        const solid = this.#config.solid;
        const net = this.#config.net;
        var amount1 = solid[0][0]*solid[0][1];
        var amount2 = net[0][0]*net[0][1];
        if(amount1 != amount2){
            console.error(`not equal solid${amount1} <=> net ${amount2}`);
        }
        const  amount = parseInt(this.#config.vertices.length/2)
        const verts = this.#config.vertices;

        
        var fcenter = [0.,0.,0.];
        var center =[ 0.,0,0.];
        var s  =  new Set();
        const getV = (v1,v2) =>{
            return [ v1[0] -v2[0],v1[1] -v2[1],v1[2] -v2[2]];
        };
        const  vN = solid[1][0];
        var    axis = [];
        solid.slice(1).forEach((i,n) => {
            i.slice(1).forEach( (_vi,n2)=>{
                var vi = _vi +1;
                if(n==0){
                    axis.push(getV(verts[vi],verts[ i[ ((n2-1+vN) % vN) + 1 ]]));
                    [0,1,2].forEach((j)=>fcenter[j] += verts[vi][j]);
                }
                if(!s.has(vi)){
                    console.log(` ${vi}  ${verts[vi]}`);
                    [0,1,2].forEach( (j) => {
                        center[j] += verts[vi][j];
                        console.log(` ${vi}  ${j}  ${center[j]}`);
                    });
                    s.add(vi);
                }
            });
        });

        var origin = [ 0.0,0.0,0.0];
        const v0 = this.#config.vertices[solid[1][1]+1];
        var  L  = 0.0;
        var  OL  = 0.0;
        [0,1,2].forEach((i)=> {
            
            center[i] = center[i]/s.size;
            fcenter[i] = fcenter[i]/solid[1][0];
            origin[i] = (fcenter[i] - center[i]);
            var oL = origin[i]*origin[i];
            OL += oL;
            var l = v0[i] - fcenter[i];
            L += l*l;
        });
        
        L  = Math.sqrt(L);
        OL = Math.sqrt(OL);
        this.scale   = this.width/L/2.;
        
        
        this.angle   =    Math.PI - this.#config.hinges[1][4];
        this.axis    =    axis;
        this.torigin =    OL*this.scale;
        console.log(`origin ${origin} ${OL} `);
        console.log( `rotate3d(${this.axis[0][0]}, ${this.axis[0][1]}, ${this.axis[0][2]},${this.angle}rad)` );
        console.log( `rotate3d(${this.axis[1][0]}, ${this.axis[1][1]}, ${this.axis[1][2]},${this.angle}rad)` );
        console.log( `rotate3d(${this.axis[2][0]}, ${this.axis[2][1]}, ${this.axis[2][2]},${this.angle}rad)` );
    }
    get config() {
        return this.#config;
    }

    async GetPolyhedron() {
      async function fetchData(data_num) {
          try {
              const response = await fetch(`/hedron/data/${data_num}.json`);
              const data = await response.json();
              const jsonData = {
                  "settings": {
                          width: '1000px',
                          height: '1000px',
                          perspective: '80000px', // Perspectiveを調整
                          transitionDuration: '0.1s',
                          margin:"0%"
                      },
                  "net" :data.net,
                  "hinges":data.hinges,
                  "vertices":data.vertices,
                  "solid" :data.solid,
                  "svertices" :data.svertices
              }
              
              return jsonData;
              console.log('GET Response:', data);
          } catch (error) {
              console.error('Error with GET request:', error);
          }
      }
      return  fetchData(this.#data_num);
  };
  
    #isValidConfig(config) {
        return config && config.settings && config.net && config.hinges && config.vertices;
    }

    connectedCallback() {
        this.#shadowRoot = this.shadowRoot;
        // Optionally set a default config if none is provided
        /*
        if (!this.#config) {
            console.warn("Polyhedron configuration not set. Using default.");
            this.config = cubeLikeConfig; // Set default here
        }
            */
    }
    
    disconnectedCallback() {}
    
    #render() {
        if (!this.#config) return;

        this.#shadowRoot = this.shadowRoot;
        const { width, height, perspective, transitionDuration,margin } = this.#config.settings;
        this.width  = parseInt(width.replace("px","")); // Default width
        this.height = parseInt(height.replace("px","")); // Default width
        this.margin = margin || '0%'; // Default margin
        // --- Create Styles ---

        // --- Create Structure ---
        this.#shadowRoot.innerHTML = ''; // Clear previous content
        this.#elements.clear();
        this.#hinge_done.clear();
        this.#faceTree = null;
        
        const scene = document.createElement('div');
        scene.className = 'scene';


        const rootContainer = document.createElement('div');
        rootContainer.className = 'rbox-container'; // Container for positioning
        scene.appendChild(rootContainer);

        const axisContainer = document.createElement('div');
        axisContainer.className = 'rbox-container'; // Container for positioning
        axisContainer.id        = "axis";
        scene.appendChild(axisContainer);
        
        this.axisContainer  = axisContainer;
        this.#rboxContainer = rootContainer; // Store reference
        // Apply a fixed rotation if desired, or keep it dynamic
        this.#rboxContainer.style.transform = `rotateX(0deg) rotateY(0deg)`;
        this.#buildElementRecursive(0,this.#config.hinges[1],{x:0.,y:0.},null);
        this.#currentNode =  this.#faceTree;
        const style = document.createElement('style');
        style.textContent = `
            :host { /* Style the component host itself */
                display: contents; /* Allow component to size itself */
                background-color: #00ffff00;
                --w: ${width};
                --h: ${height};
                --m:${margin};
                --transition-duration: ${transitionDuration || '0.8s'};
                --grid-color: rgba(0, 255, 255, 0.7); /* Cyan grid color */
                --grid-size: 5%; /* Size of the grid cells */
                --line-thickness: 1px; /* Thickness of grid lines */
            }
            .scene {
                position:fixed;
                inset: 0;
                display: grid;
                place-items: center; /* 垂直・水平中央揃えのショートハンド */
                transform: scale(1.0);
                perspective: ${perspective || '800px'};
                /* Add cursor style to indicate draggability */
                cursor: grab;
                transition: top 0.1s ease-out, left 0.1s ease-out;
                z-index:-1;
            }
            .scene.dragging { /* Style when dragging */
                cursor: grabbing;
                transition: none !important; /* Disable transition during drag */
            }
            
            .rbox-container { /* Container for the root element */
                position: relative; /* Needed for absolute children */
                transform-style: preserve-3d;
                transition: transform 0.1s ease-out; /* Short transition for settling */
                //pointer-events: none;
                width: var(--w);
                height: var(--h);
                background-color:#faebd700;
            }
            
            .rbox-container.no-transition {
                transition: none !important; /* Disable transition during drag */
            }

            
            .rbox-element {
                position: absolute;
                width: var(--w);
                height: var(--h);
                transform-style: preserve-3d;
                transition: transform var(--transition-duration) ease-in-out;
                /* transform-origin and transform set by JS */
                background-color: #00ffff00;
            }
            
            .box-content {
                position: absolute;
                width: 100%;
                height: 100%;
              
                background-image:
                /* Horizontal lines */
                repeating-linear-gradient(
                    to bottom,
                    transparent,
                    transparent calc(var(--grid-size) - var(--line-thickness)),
                    var(--grid-color) var(--grid-size)
                ),
                /* Vertical lines */
                repeating-linear-gradient(
                    to right,
                    transparent,
                    transparent calc(var(--grid-size) - var(--line-thickness)),
                    var(--grid-color) var(--grid-size)
                );

                border-radius: 0px;
                border: calc( var(--w) / 4 ) double rgb(65 76 51);
                color: #000000;
                box-sizing: border-box;
                margin: var(--m);
                padding: 0px;
                font-weight: bold;
                cursor: pointer;
                user-select: none;
               
                font-family: 'Special Elite';
                font-size: xx-large;
                place-items: center;
                display: grid;
            }


            .box-content::before {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background-color:#c0f8ff99;
                box-shadow: 0 0 30vw rgb(159 160 160 / 56%), 0 0 6px rgb(104 117 25 / 88%), 0 0 174px rgb(255 77 0 / 70%), 0 0 18px rgba(89, 0, 255, 0.7), 0 0 24px rgb(128 221 70 / 80%), 0 0 30px rgba(0, 229, 255, 0.6), 0 0 45px rgba(255, 247, 0, 0.8);
                border-radius: 36px;
                z-index: -1;
            }

            .axis{
                transform: rotateX(-49.5deg) rotateY(5deg);
                background-color: #6efa0054;
                background-clip: content-box;
                box-sizing: border-box;
            }
            .axis2 {
                position: absolute;
                width: 100%;
                height: 100%;
              
                background-color: #6e0a7754;
                color: #000000;
                box-sizing: border-box;

                padding: 0px;
                font-weight: bold;

                font-family: 'Special Elite';
                font-size: xx-large;

            }

            
    `;

        this.#shadowRoot.appendChild(style);
        this.#shadowRoot.appendChild(scene);
        // Add listener to the container, not the scene, for better control
        
        //scene.addEventListener('mousedown', this.#boundHandleDragStart);
        //scene.addEventListener('touchstart', this.#boundHandleDragStart, { passive: false }); // Use passive: false if preventDefault is needed
        
        this.#sceneElement　=scene;
        // Apply initial transforms after elements are in the DOM
        //this.#updateAllTransforms();
    }
    
    #toViewport(vx,vy){
        return {
            x: (vx * this.scale),
            y: (vy * this.scale)
        }; 
    }

    #buildElementRecursive(i,hinge,parentPos,parentNode) {
        const data_id = `face-${i}`;
        var centroid  = null; 
        let currentNode = null; 
        if(!this.#elements.get(data_id)){
            
            const verts    = this.#config.net[i+1].slice(1);
            centroid = this.#calculateCentroid(verts);
            const maxDist  = this.#calculateMaxDistance(verts, centroid);

            const elementWrapper = document.createElement('div');
            elementWrapper.className = 'rbox-element';
            elementWrapper.dataset.id = `face-${i}`; // Store id for later reference
            
            const boxContent = document.createElement('div');
            boxContent.className = 'box-content';
            boxContent.textContent = `${i}asdfojasdjfpsjdofpfjoj ojspojfdfopjwoedfjwojfvopj vdojkvosjdfpojssdojvopj pojpofjedopfjposajfdpojweopf` ;//elementConfig.content || '';
            elementWrapper.appendChild(boxContent);
           
            const pathData = this.#getCentroidRelativePercentages(verts, centroid,maxDist);
            boxContent.style.clipPath = `polygon(${pathData
            .map(p => `${p[0].toFixed(2)}% ${p[1].toFixed(2)}%`)
            .join(', ')})`;
            if(i == 0){
                elementWrapper.style.transform = elementWrapper.transformTranslate = `translate3d(0px ,0px, ${this.torigin}px)`;
            }else{
                const dst = this.#toViewport(centroid.x - parentPos.x,centroid.y - parentPos.y);
                elementWrapper.style.transform = elementWrapper.transformTranslate = `translate3d(${Math.round(dst.x)}px,${Math.round(dst.y)}px,0px) `;                
            }
            currentNode = {
                        parent : parentNode,
                        id: data_id,
                        element: elementWrapper, // Reference to the DOM element
                        chid :-1,
                        children: []
            };
            if (parentNode) {
                parentNode.element.appendChild(elementWrapper);
                parentNode.children.push(currentNode);
            } else {
                // This is the root node (face 0)
                this.#rboxContainer.appendChild(elementWrapper);
                this.#faceTree = currentNode;
                
            }
            // Store reference and initial state
            this.#elements.set(elementWrapper.dataset.id, elementWrapper);
            this.#rotatedState.set(elementWrapper.dataset.id, false); // Initially not rotated
            
            /*
            boxContent.addEventListener('click', (e) => {
                e.stopPropagation(); // Prevent event bubbling to parent elements
                this.#toggleRotation(elementWrapper.dataset.id);
            });
            */

            if(i!=0 ){
                const vertices = this.#config.vertices;
                const fid  = parseInt(hinge[2]) + 1;
                const n    = this.#config.net[fid][0];
                const vid  = parseInt(hinge[3]) + 1;
                const v1   = vertices[ (this.#config.net[fid][vid]) + 1 ];
                const v2   = vertices[ parseInt(this.#config.net[fid][(vid==n)?1:vid+1]) + 1 ];
                const mid  = this.#calculateMidpoint(v1,v2);
                const midper = this.#convertToCentroidPercentage(mid, centroid, maxDist);
                elementWrapper.style.transformOrigin = `${midper[0]}% ${midper[1]}%`;
                elementWrapper.transformRotate       = `rotate3d(${v1[0] - mid[0]}, ${v1[1] - mid[1]},0, ${180- (hinge[4] * 180 / Math.PI)}deg)`;
                elementWrapper.transformRotate2      = `rotate3d(${v1[0] - mid[0]}, ${v1[1] - mid[1]},0, -${180- (hinge[4] * 180 / Math.PI)}deg)`;
            }
        }
        const elementWrapper = this.#elements.get(data_id);
      
        this.#config.hinges.slice(1).forEach((hinge, hingeIndex) => {
            if(this.#hinge_done.get(hingeIndex)){
                return;
            }
            if(i == hinge[0]){
                this.#hinge_done.set(hingeIndex,true);
                this.#buildElementRecursive(hinge[2],hinge,centroid,currentNode);
            }
            if(this.#hinge_done.get(hingeIndex)){
                return;
            }
            if(i == hinge[2]){
                this.#hinge_done.set(hingeIndex,true);
                this.#buildElementRecursive(hinge[0],[hinge[2],hinge[3],hinge[0],hinge[1],hinge[4]],centroid,currentNode);
            }
        });
    }

    #toggleRotation(elementId) {
        const currentState = this.#rotatedState.get(elementId);
        this.#rotatedState.set(elementId, !currentState);
        this.#updateTransform(elementId);
    }

    #updateTransform(elementId) {
         const elementWrapper = this.#elements.get(elementId);
         //const elementConfig = this.#config.elements.find(el => el.id === elementId);
         if (!elementWrapper) return;

         const isRotated = this.#rotatedState.get(elementId);
         let transformString = '';

         // 1. Apply initial offset (relative to parent)
         if (elementWrapper.transformTranslate) {
             transformString += elementWrapper.transformTranslate;
         }
         // 2. Apply rotation if in rotated state
         if (isRotated && elementWrapper.transformRotate) {
            transformString += elementWrapper.transformRotate;
         } 

         
         elementWrapper.style.transform = transformString.trim();
        }

    foldAll() {
        this.#elements.forEach((element, elementId) => {
            if (this.#rotatedState.get(elementId) === false) {
                this.#rotatedState.set(elementId, true);
                this.#updateTransform(elementId);
            }
        });
    }

    unfoldAll() {
        this.#elements.forEach((element, elementId) => {
             if (this.#rotatedState.get(elementId) === true) {
                this.#rotatedState.set(elementId, false);
                this.#updateTransform(elementId);
            }
        });
    }
    
    nextFace(){
        if (!this.#navigator) return;
        const result = this.#navigator.stepForward(); // "turn"
        if (result.success) {
            // console.log(`進む: ${result.operationId} 適用 => ${navigator.currentTransformCSS}`);
            this.#navigator.applyToElement(this.#rboxContainer);

        }
    };
    backFace(){
        if (!this.#navigator) return;
        const result = this.#navigator.stepBackward(); // "return"
        if (result.success) {
            // console.log(`戻る: ${result.undoneOperationId} 解除 => ${navigator.currentTransformCSS}`);
            this.#navigator.applyToElement(this.#rboxContainer);
        }
       
    }

        /** ポリゴンの重心を計算 */
    #calculateCentroid(vertices) {
        let sumX = 0, sumY = 0;
        const verts = this.#config.vertices;
        vertices.forEach(vid => { 
            const v = verts[vid+1];
            sumX += v[0]; sumY += v[1]; 
        });
        const n = vertices.length;
        return { x: n > 0 ? sumX / n : 0, y: n > 0 ? sumY / n : 0 };
    }

    /** 2点間の距離を計算 */
    #calculateDistance(point1, point2) {
        const verts = this.#config.vertices;
        
        const dx = verts[point1+1][0] - point2.x;
        const dy = verts[point1+1][1] - point2.y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    /** 重心から最も遠い頂点までの距離を計算 */
    #calculateMaxDistance(vertices, centroid) {
        let maxDist = 0;
        vertices.forEach(vertex => {
            const dist = this.#calculateDistance(vertex, centroid);
            if (dist > maxDist) maxDist = dist;
        });
        return maxDist;
    }

    /** 絶対座標を重心基準のパーセンテージ座標に変換 */
    #convertToCentroidPercentage(v, centroid, maxDist) {
        
        const percentX = maxDist === 0 ? 50 : 50 + ((v[0] - centroid.x) / maxDist) * 50;
        const percentY = maxDist === 0 ? 50 : 50 + ((v[1] - centroid.y) / maxDist) * 50;
        return[percentX, percentY ];
    }

    /** 重心基準のパーセンテージ座標の配列を計算 */
    #getCentroidRelativePercentages(vertices, centroid, maxDist) {
        if (!vertices || vertices.length === 0) return [];
        return vertices.map(vid =>{
            const v = this.#config.vertices[vid+1];
            return this.#convertToCentroidPercentage(v, centroid, maxDist);
        });
    }

    #createOrbit(){
      if(this.#orbit == null){
          this.#orbit = new Orbit(this.axisContainer,[this.#rboxContainer]);
      }else{
          //delete this.#oribit;
          this.#orbit = null;
      }
    }
    /**
     * 2点の中点を計算する
     * @param {{x: number, y: number}} point1
     * @param {{x: number, y: number}} point2
     * @returns {{x: number, y: number}} 中点の座標
     */
    
    keymap(){
              // --- Switching logic ---
        const self  = this;
        return (finalValue) => {
              var f = finalValue.split(" ");
              switch (f[0].toLowerCase()) {
                  case 'load':
                      this.data_num = parseInt(f[1]);
                      this.GetPolyhedron().then(data => {
                        this.config = data;
                      });
                      break;
                  case 'fold':
                      console.log('Folding polyhedron...');
                      if (typeof self.foldAll === 'function') {
                          self.foldAll();
                      } else {
                          console.error('polyhedronComp.foldAll is not a function');
                      }
                      break;
                  case 'unfold':
                      console.log('Unfolding polyhedron...');
                       if (typeof self.unfoldAll === 'function') {
                          self.unfoldAll();
                      } else {
                           console.error('polyhedronComp.unfoldAll is not a function');
                      }
                      break;
                  case 'next':
                      self.nextFace();
                      break;
                  case 'back':
                      self.backFace();
                      break;
                  case 'orbit':
                      this.#createOrbit();
                      break;
                  default:
                      console.log('No specific action defined for this value.');
              }
         };
    }

    #calculateMidpoint(p1, p2,scale = [1.0,1.0]) {
        return [ (p1[0] + p2[0]) / 2 *scale[0] , (p1[1] + p2[1]) / 2* scale[1]];
    }


}

// Define the custom element

/*
const polyhedronElement = document.getElementById('my-polyhedron');
// Set configuration (could also be done via attributes or other means)

GetPolyhedron().then(data => {
    polyhedronElement.config = data;
    
});
*/
export { PolyhedronComponent };

