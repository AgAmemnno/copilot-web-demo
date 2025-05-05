// test-runner.js
import { vertices, rotationParams } from '/static/platonic-data.js';
import {
    generateMatrixFromAxisAngle,
    applyOpToVertex,
    AproxVec3Equals,
    isOrthogonal,
    isRotationMatrix
} from './matrix-utils.js';
import * as glMatrix  from 'https://cdn.jsdelivr.net/npm/gl-matrix@3.4.3/+esm'
// Requires gl-matrix library (loaded via CDN in html)

const mat4 = glMatrix.mat4; // 4x4 matrix functions
// gl-matrix functions (assuming global availability from CDN)


let resultsHTML = ''; // Variable to store HTML results

function logResult(group, testName, pass, details = '') {
    const status = pass ? '<span class="pass">PASS</span>' : '<span class="fail">FAIL</span>';
    resultsHTML += `<p><strong>[${group}] ${testName}:</strong> ${status} ${details ? `- ${details}` : ''}</p>`;
}

function runTests() {
    resultsHTML = ''; // Clear previous results

    for (const groupName of ['T', 'O', 'I']) {
        resultsHTML += `<h3>${groupName} Group Tests</h3>`;
        const ops = rotationParams[groupName];
        const verts = vertices[groupName] || vertices[Object.keys(vertices).find(k=>k[0]===groupName)] || []; // Get corresponding vertices

        // Test 1: Operation Count
        const expectedCounts = { T: 12, O: 24, I: 60 };
        const actualCount = Object.keys(ops).length;
        logResult(groupName, 'Operation Count', actualCount === expectedCounts[groupName], `Expected ${expectedCounts[groupName]}, Found ${actualCount}`);

        let generatedMatrices = {}; // Store generated matrices for later tests

        // Test 2 & 3: Matrix Generation & Properties
        let generationOk = true;
        let propertiesOk = true;
        for (const opId in ops) {
            const params = ops[opId];
            const matrix = generateMatrixFromAxisAngle(params.axis, params.angle);
            generatedMatrices[opId] = matrix;

            if (!matrix) { generationOk = false; continue; } // Should not happen if generateMatrix handles errors

            const isOrt = isOrthogonal(matrix);
            const isRot = isRotationMatrix(matrix);
            if (!isOrt || !isRot) {
                propertiesOk = false;
                 logResult(groupName, `Matrix Properties (${opId})`, false, `Orthogonal: ${isOrt}, Determinant ~1: ${isRot}`);
            }
        }
        logResult(groupName, 'Matrix Generation', generationOk, generationOk ? 'All matrices generated.' : 'Failed to generate some matrices.');
        if(generationOk) { // Only run property test if generation was ok
            logResult(groupName, 'Matrix Properties (Combined)', propertiesOk, propertiesOk ? 'All matrices passed property checks.' : 'Some matrices failed property checks.');
        }


        // Test 4: Vertex Transformation (Basic Check)
        if (verts.length > 0 && generationOk) {
            let transformOk = true;
            const startVertex = verts[0]; // Take the first vertex
             let failedOps = [];

            for (const opId in generatedMatrices) {
                if (opId.includes('Placeholder')) continue; // Skip placeholders for this test

                const matrix = generatedMatrices[opId];
                const transformedVertex = applyOpToVertex(startVertex, matrix);

                // Check if transformed vertex is close to ANY original vertex
                const foundMatch = verts.some(v => AproxVec3Equals(transformedVertex, v));
                if (!foundMatch) {
                    transformOk = false;
                    failedOps.push(opId);
                     // console.log(`Vertex test fail: ${opId}, Start: ${startVertex}, End: ${transformedVertex.map(n=>n.toFixed(3))}`);
                }
            }
             logResult(groupName, 'Vertex Transformation', transformOk, transformOk ? 'All ops mapped vertex to another vertex.' : `Failed for: ${failedOps.slice(0,5).join(', ')}${failedOps.length > 5 ? '...' : ''}`);
        } else if (verts.length === 0) {
            logResult(groupName, 'Vertex Transformation', false, 'Vertex data not available for testing.');
        }

        // Test 5: Group Properties (Example: C3^3 = E for T group)
        if (groupName === 'T' && generatedMatrices['T_C3_111_120']) {
            const c3 = generatedMatrices['T_C3_111_120'];
            const c3_squared = mat4.multiply([], c3, c3);
            const c3_cubed = mat4.multiply([], c3_squared, c3);
            const identity = mat4.create();
            const isIdentity = mat4.equals(c3_cubed, identity); // Use gl-matrix built-in comparison
            logResult(groupName, 'Group Property (C3^3 = E)', isIdentity, `C3^3 equals Identity: ${isIdentity}`);
        }
        // Add more group property tests for O and I if needed...

    } // End loop through groups

    return resultsHTML;
}

// Export the function that runs tests and returns HTML string
export { runTests };