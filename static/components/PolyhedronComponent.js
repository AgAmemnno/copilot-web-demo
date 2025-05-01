import BaseHTMLComponentWithEvent from './base/BaseHTMLComponentWithEvent.js';


// --- 共通関数定義 ---
class PolyhedronComponent extends BaseHTMLComponentWithEvent {
    #shadowRoot;
    #config = null;
    #elements = new Map(); // Store references to created elements
    #rotatedState = new Map(); // Store rotated state for each element id
    #hinge_done = new Map();
    constructor() {
        super();
    }

    // Configuration data can be set via property
    set config(newConfig) {
        if (!this.#isValidConfig(newConfig)) {
            console.error('Invalid configuration provided to polyhedron-rotator.');
            return;
        }
        this.#config = newConfig;
        this.#rotatedState.clear(); // Reset state when config changes
        this.#render();
    }

    get config() {
        return this.#config;
    }

    async GetPolyhedron() {
      async function fetchData() {
          try {
              const response = await fetch('/githubApp/copilot-web-demo%20copy/static/components/data/6.json');
              const data = await response.json();
              const jsonData = {
                  "settings": {
                          width: '150px',
                          height: '150px',
                          perspective: '80000px', // Perspectiveを調整
                          transitionDuration: '0.1s',
                          margin:"0%"
                      },
                  "net" :data.net,
                  "hinges":data.hinges,
                  "vertices":data.vertices,
              }
              this.#config = jsonData;
              return jsonData;
              console.log('GET Response:', data);
          } catch (error) {
              console.error('Error with GET request:', error);
          }
      }
      return  fetchData();
  };
  
    #isValidConfig(config) {
        return config && config.settings && config.net && config.hinges && config.vertices;
    }

    connectedCallback() {
        this.#shadowRoot = this.#shadowRoot;
        // Optionally set a default config if none is provided
        /*
        if (!this.#config) {
            console.warn("Polyhedron configuration not set. Using default.");
            this.config = cubeLikeConfig; // Set default here
        }
            */
    }

    #render() {
        if (!this.#config) return;


        const { width, height, perspective, transitionDuration,margin } = this.#config.settings;
        this.width  = parseInt(width.replace("px","")); // Default width
        this.height = parseInt(height.replace("px","")); // Default width
        this.margin = margin || '0%'; // Default margin
        // --- Create Styles ---

        // --- Create Structure ---
        this.#shadowRoot.innerHTML = ''; // Clear previous content
        this.#elements.clear();
        this.#hinge_done.clear();
        const scene = document.createElement('div');
        scene.className = 'scene';

        // Build the element tree recursively

        const rootContainer = document.createElement('div');
        rootContainer.className = 'rbox-container'; // Container for positioning
        scene.appendChild(rootContainer);
        this.#buildElementRecursive(0,this.#config.hinges[1],{x:0.,y:0.},rootContainer);

        const style = document.createElement('style');
        style.textContent = `
            :host { /* Style the component host itself */
                display: inline-block; /* Allow component to size itself */
                --w: ${width};
                --h: ${height};
                --m:${margin};
                --transition-duration: ${transitionDuration || '0.8s'};
                background-color: #00ffff00;
            }
            .scene {
                position:fixed;
                top:50%;
                left:50%;
                width: calc(var(--w) * 3); /* Adjust scene size based on element size */
                height: calc(var(--h) * 3);
                transform: scale(1.0);
                perspective: ${perspective || '800px'};
            }
            .rbox-container { /* Container for the root element */
                 position: relative; /* Needed for absolute children */
                 transform-style: preserve-3d;

                
                 /* Optional: Center the root visually */
                 /* transform: translateZ(calc(-1 * var(--h))); */
            }
            .rbox-element {
                position: absolute;

                width: var(--w);
                height: var(--h);
                transform-style: preserve-3d;
                transition: transform var(--transition-duration) ease-in-out;
                /* transform-origin and transform set by JS */
                background-color: #00ffff00;
                box-shadow:
                0 0 5px rgba(0, 255, 255, 0.382),
                0 0 10px rgba(217, 255, 0, 0.452),
                0 0 20px rgba(255, 77, 0, 0.685),
                0 0 30px rgba(89, 0, 255, 0.673),
                0 0 40px rgba(98, 255, 0, 0.801),
                0 0 50px rgba(0, 229, 255, 0.636),
                0 0 75px rgba(255, 247, 0, 0.793);
            }
            .box-content {
                position: absolute;
                width: 100%;
                height: 100%;
                background-image: conic-gradient(from 0deg, orange, purple, pink, orange);
                border-radius: 10px;
                border: 25px ridge linear-gradient(rgba(255, 0, 0, 0.444), rgb(0, 81, 255));
                color: white;
                box-sizing:border-box;
                margin: var(--m);
                padding: 25px;
                font-weight: bold;
                cursor: pointer;
                //clip-path: polygon(50% 13.4%, 0% 100%, 100% 100%);
                user-select: none; /* Prevent text selection on click */

            }
            /* Add different colors for visual distinction if needed */
            [data-id="rbox0"] > .box-content { background-color: steelblue; z-index: 1;}
            [data-id="rbox00"] > .box-content { background-color: coral; z-index: 2;}
            [data-id="rbox000"] > .box-content { background-color: lightcoral; z-index: 3;}
            [data-id="rbox01"] > .box-content { background-color: lightgreen; z-index: 2;}
            [data-id="rbox02"] > .box-content { background-color: lightblue; z-index: 2;}
            [data-id="rbox03"] > .box-content { background-color: lightpink; z-index: 2;}
        `;

        this.#shadowRoot.appendChild(style);
        this.#shadowRoot.appendChild(scene);

        // Apply initial transforms after elements are in the DOM
        //this.#updateAllTransforms();
    }
    #toViewport(vx,vy){
           return {
            x: (vx * this.scale),
            y: (vy * this.scale)
        }; 
    }
    #buildElementRecursive(i,hinge,parentPos,parentDomElement) {
        const data_id = `face-${i}`;
        var centroid  = null; 
        if(!this.#elements.get(data_id)){

            const verts    = this.#config.net[i+1].slice(1);
            centroid = this.#calculateCentroid(verts);
            const maxDist  = this.#calculateMaxDistance(verts, centroid);
            if(i ==0){
               const v0 = this.#config.vertices[parseInt(verts[0])+1];
               const length = 2.*Math.sqrt(v0[0]*v0[0] +v0[1]*v0[1]);
               this.scale   = this.width/length;
            }

            const elementWrapper = document.createElement('div');
            elementWrapper.className = 'rbox-element';
            elementWrapper.dataset.id = `face-${i}`; // Store id for later reference

            const boxContent = document.createElement('div');
            boxContent.className = 'box-content';
            //boxContent.textContent = elementConfig.content || '';

            elementWrapper.appendChild(boxContent);
            parentDomElement.appendChild(elementWrapper);


            const pathData = this.#getCentroidRelativePercentages(verts, centroid,maxDist);
            boxContent.style.clipPath = `polygon(${pathData
            .map(p => `${p[0].toFixed(2)}% ${p[1].toFixed(2)}%`)
            .join(', ')})`;
            const dst = this.#toViewport(centroid.x - parentPos.x,centroid.y - parentPos.y);
            elementWrapper.style.transform = elementWrapper.transformTranslate = `translate3d(${Math.round(dst.x)}px,${Math.round(dst.y)}px,0px) `;
            
            // Store reference and initial state
            this.#elements.set(elementWrapper.dataset.id, elementWrapper);
            this.#rotatedState.set(elementWrapper.dataset.id, false); // Initially not rotated
                     
            boxContent.addEventListener('click', (e) => {
                e.stopPropagation(); // Prevent event bubbling to parent elements
                this.#toggleRotation(elementWrapper.dataset.id);
            });

            if(i==0 ){
                //[12.0, 5.0], // [面の数, 1面の頂点]
                //[5.0, 10.0, 16.0, 23.0, 24.0, 17.0], // Face 0
                elementWrapper.style.transformOrigin = `50% 50%`;
                elementWrapper.transformRotate    = `rotate3d(0, 1, 1,60deg)`;
            }else{
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
            }
        }


        const elementWrapper = this.#elements.get(data_id);
      
        this.#config.hinges.slice(1).forEach((hinge, hingeIndex) => {
            if(this.#hinge_done.get(hingeIndex)){
                return;
            }
            if(i == hinge[0]){
                this.#hinge_done.set(hingeIndex,true);
                this.#buildElementRecursive(hinge[2],hinge,centroid,elementWrapper);
            }
            if(this.#hinge_done.get(hingeIndex)){
                return;
            }
            if(i == hinge[2]){
                this.#hinge_done.set(hingeIndex,true);
                this.#buildElementRecursive(hinge[0],[hinge[2],hinge[3],hinge[0],hinge[1],hinge[4]],centroid,elementWrapper);
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

    /**
     * 2点の中点を計算する
     * @param {{x: number, y: number}} point1
     * @param {{x: number, y: number}} point2
     * @returns {{x: number, y: number}} 中点の座標
     */
    
    #calculateMidpoint(p1, p2,scale = [1.0,1.0]) {
        return [ (p1[0] + p2[0]) / 2 *scale[0] , (p1[1] + p2[1]) / 2* scale[1]];
    }

}

// Define the custom element
customElements.define('polyhedron-component', PolyhedronComponent);

/*
const polyhedronElement = document.getElementById('my-polyhedron');
// Set configuration (could also be done via attributes or other means)

GetPolyhedron().then(data => {
    polyhedronElement.config = data;
    
});
*/
export { PolyhedronComponent };

