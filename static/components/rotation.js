const fs = require('fs').promises;


// ベクトルを正規化する（単位ベクトルにする）
function normalize(v) {
    const len = Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]);
    if (len === 0) {
      // ゼロベクトルは扱えない or 特定の値を返す（ここでは [1, 0, 0] とする）
      console.warn("Zero vector cannot be normalized. Returning [1, 0, 0].");
      return [1, 0, 0];
    }
    return [v[0] / len, v[1] / len, v[2] / len];
  }
  
// ベクトルにスカラーを掛ける
function scale(v, s) {
return [v[0] * s, v[1] * s, v[2] * s];
}

// ベクトルのドット積（内積）
function dot(v1, v2) {
return v1[0] * v2[0] + v1[1] * v2[1] + v1[2] * v2[2];
}

// ベクトルのクロス積（外積）
function cross(v1, v2) {
return [
    v1[1] * v2[2] - v1[2] * v2[1],
    v1[2] * v2[0] - v1[0] * v2[2],
    v1[0] * v2[1] - v1[1] * v2[0]
];
}

// ベクトルの加算
function add(v1, v2) {
    return [v1[0] + v2[0], v1[1] + v2[1], v1[2] + v2[2]];
}


/**
 * 2つの回転（軸と角度）を合成し、単一の等価な回転（軸と角度）を計算します。
 *
 * @param {number[]} axis1 - 最初の回転軸（[x, y, z] の配列）。正規化されていること。
 * @param {number} angle1 - 最初の回転角度（ラジアン）。
 * @param {number[]} axis2 - 2番目の回転軸（[x, y, z] の配列）。正規化されていること。
 * @param {number} angle2 - 2番目の回転角度（ラジアン）。
 * @returns {{axis: number[], angle: number} | null} 合成された回転の軸と角度を含むオブジェクト。
 * 計算不可能な場合は null を返すことがあります。
 */
function composeRotations(axis1, angle1, axis2, angle2) {
    // -------------------------------------------
    // 1. 各回転をクォータニオンに変換
    // -------------------------------------------
    // クォータニオン q = [w, x, y, z] = [cos(angle/2), sin(angle/2)*axis_x, sin(angle/2)*axis_y, sin(angle/2)*axis_z]
  
    // 軸が正規化されていることを確認（必要なら正規化）
    const normAxis1 = normalize(axis1);
    const normAxis2 = normalize(axis2);
  
    const halfAngle1 = angle1 / 2.0;
    const sinHalf1 = Math.sin(halfAngle1);
    const q1_w = Math.cos(halfAngle1);
    const q1_v = scale(normAxis1, sinHalf1); // [x1, y1, z1]
  
    const halfAngle2 = angle2 / 2.0;
    const sinHalf2 = Math.sin(halfAngle2);
    const q2_w = Math.cos(halfAngle2);
    const q2_v = scale(normAxis2, sinHalf2); // [x2, y2, z2]
  
    // -------------------------------------------
    // 2. クォータニオンの積を計算 (q_composite = q2 * q1)
    // -------------------------------------------
    // w = w2*w1 - dot(v2, v1)
    // v = scale(v1, w2) + scale(v2, w1) + cross(v2, v1)
  
    const w_comp = q2_w * q1_w - dot(q2_v, q1_v);
    const v_comp_part1 = scale(q1_v, q2_w);
    const v_comp_part2 = scale(q2_v, q1_w);
    const v_comp_part3 = cross(q2_v, q1_v);
    const v_comp = add(add(v_comp_part1, v_comp_part2), v_comp_part3); // [x_comp, y_comp, z_comp]
  
    // -------------------------------------------
    // 3. 合成クォータニオンから軸と角度を抽出
    // -------------------------------------------
    // 合成クォータニオン q_comp = [w_comp, v_comp[0], v_comp[1], v_comp[2]]
  
    // 念のため合成クォータニオンを正規化（数値誤差対策）
    const len_q_comp = Math.sqrt(w_comp * w_comp + dot(v_comp, v_comp));
     if (len_q_comp < 1e-9) {
          console.warn("Composite quaternion has zero length. Cannot extract axis/angle.");
          // 実質的に回転がないか、計算誤差が大きい場合
          return { axis: [1, 0, 0], angle: 0 }; // デフォルトの軸と角度0を返す
      }
    const norm_w_comp = w_comp / len_q_comp;
    const norm_v_comp = scale(v_comp, 1.0 / len_q_comp);
  
    // 角度を計算 (angle = 2 * acos(w))
    // acos の入力は [-1, 1] の範囲にある必要があるため、クリッピング
    const clamped_w = Math.max(-1.0, Math.min(1.0, norm_w_comp));
    const angle_comp = 2.0 * Math.acos(clamped_w);
  
    // 軸を計算 (axis = v / sin(angle/2))
    const sinHalfAngleComp = Math.sqrt(1.0 - clamped_w * clamped_w); // sin(acos(x)) = sqrt(1-x^2)
  
    let axis_comp;
    // sin(angle/2) がほぼゼロの場合（角度が0または2πに近い）
    if (sinHalfAngleComp < 1e-9) {
      // 回転角度がほぼ0なので、軸は任意。慣例的に [1, 0, 0] や元の軸などを使う。
      // ここでは [1, 0, 0] を返す。
      axis_comp = [1, 0, 0];
      // 角度が非常に小さい場合は0とするのが一般的
      // angle_comp = 0; // 必要であればコメントアウトを外す
    } else {
      // 軸ベクトルを計算
      axis_comp = scale(norm_v_comp, 1.0 / sinHalfAngleComp);
      // 念のため再正規化
      axis_comp = normalize(axis_comp);
    }
  
    // -------------------------------------------
    // 4. 結果を返す
    // -------------------------------------------
    return {
      axis: axis_comp,
      angle: angle_comp
    };
  }
  
  // --- 使用例 ---
  // 例1: x軸周りに90度 (π/2) 回転し、その後 y軸周りに90度 (π/2) 回転
  const axis1 = [1, 0, 0];
  const angle1 = Math.PI / 2.0;
  const axis2 = [0, 1, 0];
  const angle2 = Math.PI / 2.0;
  
  const result1 = composeRotations(axis1, angle1, axis2, angle2);
  if (result1) {
    console.log("例1 合成結果:");
    console.log("軸:", result1.axis.map(x => x.toFixed(5))); // 有効数字5桁で表示
    console.log("角度 (rad):", result1.angle.toFixed(5));
    console.log("角度 (deg):", (result1.angle * 180 / Math.PI).toFixed(5));
    // 期待される結果に近い値: 軸 [0.577, 0.577, 0.577], 角度 2π/3 (120度)
  }
  
  // 例2: z軸周りに30度回転し、その後同じz軸周りに60度回転
  const axis3 = [0, 0, 1];
  const angle3 = Math.PI / 6.0; // 30度
  const axis4 = [0, 0, 1];
  const angle4 = Math.PI / 3.0; // 60度
  
  const result2 = composeRotations(axis3, angle3, axis4, angle4);
  if (result2) {
    console.log("\n例2 合成結果:");
    console.log("軸:", result2.axis.map(x => x.toFixed(5)));
    console.log("角度 (rad):", result2.angle.toFixed(5));
    console.log("角度 (deg):", (result2.angle * 180 / Math.PI).toFixed(5));
    // 期待される結果: 軸 [0, 0, 1], 角度 π/2 (90度)
  }
  
  // 例3: 回転がない場合
  const axis5 = [1, 0, 0];
  const angle5 = 0;
  const axis6 = [0, 1, 0];
  const angle6 = 0;
  
  const result3 = composeRotations(axis5, angle5, axis6, angle6);
  if (result3) {
      console.log("\n例3 合成結果 (ゼロ回転):");
      console.log("軸:", result3.axis.map(x => x.toFixed(5)));
      console.log("角度 (rad):", result3.angle.toFixed(5));
      console.log("角度 (deg):", (result3.angle * 180 / Math.PI).toFixed(5));
       // 期待される結果: 軸 [1, 0, 0] (デフォルト), 角度 0
  }


async function fetchData(data_num) {
    try {

        const filePath = `D:\\WorkSpace\\githubApp\\webdriver\\copilot-web-demo\\static\\components\\hedron\\${data_num}.json`;
        const _data = await fs.readFile(filePath, 'utf-8');
        const data = JSON.parse(_data);
        const jsonData = {
            "net" :data.net,
            "hinges":data.hinges,
            "vertices":data.vertices,
        }
       
        return jsonData;
        console.log('GET Response:', data);
    } catch (error) {
        console.error('Error with GET request:', error);
    }
}

class hedronTest {
    #rboxContainer;
    #config;
    #elements;
    #rotatedState;
    #faceTree;
    #hinge_done;
    constructor(data) {
      
        this.#config = null;
        this.#elements = new Map();
        this.#rotatedState = new Map();
        this.#faceTree = null;
        this.#hinge_done = new Map();
        this.scale = 1.0;
        this.width = 0.0;
    }

    async init() {
        const data_num = 0;
        const data = await fetchData(data_num);
        this.#config = data;
        if("solid" in data){
          this.#buildElementRecursive(0,this.#config.hinges[1],{x:0.,y:0.},null);
        }else{
          console.error(`No solid data found in the configuration.  ${data_num}`);
        }
    }

    #buildElementRecursive(i,hinge,parentPos,parentNode) {
      const data_id = `face-${i}`;
      var centroid  = null; 
      let currentNode = null; 
      if(!this.#elements.get(data_id)){
          
          const verts    = this.#config.net[i+1].slice(1);
          centroid = this.#calculateCentroid(verts);
          const maxDist  = this.#calculateMaxDistance(verts, centroid);
          if(i ==0){
            const v0 = this.#config.vertices[parseInt(verts[0])+1];
            const length = 2.*Math.sqrt(v0[0]*v0[0] +v0[1]*v0[1]);
            this.scale   = this.width/length;
          }
          
          /*
          const elementWrapper = document.createElement('div');
          elementWrapper.className = 'rbox-element';
          elementWrapper.dataset.id = `face-${i}`; // Store id for later reference
          const boxContent = document.createElement('div');
          boxContent.className = 'box-content';
          //boxContent.textContent = elementConfig.content || '';
          elementWrapper.appendChild(boxContent);
          */
          const pathData = this.#getCentroidRelativePercentages(verts, centroid,maxDist);
          /*boxContent.style.clipPath = `polygon(${pathData
          .map(p => `${p[0].toFixed(2)}% ${p[1].toFixed(2)}%`)
          .join(', ')})`;
          */
          const dst = this.#toViewport(centroid.x - parentPos.x,centroid.y - parentPos.y);
          //elementWrapper.style.transform = elementWrapper.transformTranslate = `translate3d(${Math.round(dst.x)}px,${Math.round(dst.y)}px,0px) `;
          
          currentNode = {
                      id: data_id,
                      children: [],
                      
          };
          if (parentNode) {
              //parentNode.element.appendChild(elementWrapper);
              parentNode.children.push(currentNode);
          } else {
              // This is the root node (face 0)
              //this.#rboxContainer.appendChild(elementWrapper);
              this.#faceTree = currentNode;
          }
          // Store reference and initial state
          //this.#elements.set(elementWrapper.dataset.id, elementWrapper);
          //this.#rotatedState.set(elementWrapper.dataset.id, false); // Initially not rotated
                  


          if(i==0 ){
              //[12.0, 5.0], // [面の数, 1面の頂点]
              //[5.0, 10.0, 16.0, 23.0, 24.0, 17.0], // Face 0
              //elementWrapper.style.transformOrigin = `50% 50%`;
              //elementWrapper.transformRotate    = `rotate3d(0, 1, 1,60deg)`;
          }else{
              const vertices = this.#config.vertices;

              const fid  = parseInt(hinge[2]) + 1;
              const n    = this.#config.net[fid][0];
              const vid  = parseInt(hinge[3]) + 1;
              const v1   = vertices[ (this.#config.net[fid][vid]) + 1 ];
              const v2   = vertices[ parseInt(this.#config.net[fid][(vid==n)?1:vid+1]) + 1 ];
              const mid  = this.#calculateMidpoint(v1,v2);
              const midper = this.#convertToCentroidPercentage(mid, centroid, maxDist);
              
              const hingeAxis = [v1[0] - mid[0], v1[1] - mid[1], 0];
              //elementWrapper.style.transformOrigin = `${midper[0]}% ${midper[1]}%`;
              //elementWrapper.transformRotate       = `rotate3d(${v1[0] - mid[0]}, ${v1[1] - mid[1]},0, ${180- (hinge[4] * 180 / Math.PI)}deg)`;
          }
      }


      //const elementWrapper = this.#elements.get(data_id);
    
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

   #toViewport(vx,vy){
    return {
     x: (vx * this.scale),
     y: (vy * this.scale)
 }; 
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

    #calculateMidpoint(p1, p2,scale = [1.0,1.0]) {
        return [ (p1[0] + p2[0]) / 2 *scale[0] , (p1[1] + p2[1]) / 2* scale[1]];
    }
}



var h = new hedronTest();
h.init();