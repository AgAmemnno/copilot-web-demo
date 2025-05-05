// matrix-utils.js
import * as glMatrix  from 'https://cdn.jsdelivr.net/npm/gl-matrix@3.4.3/+esm'
// Requires gl-matrix library (loaded via CDN in html)

const mat4 = glMatrix.mat4; // 4x4 matrix functions
const vec3 = glMatrix.vec3; // 3D vector functions
const vec4 = glMatrix.vec4; // 3D vector functions
const EPSILON = 1e-5; // Tolerance for float comparisons

/**
 * Generates a 4x4 rotation matrix from axis and angle.
 * @param {number[]} axis - The rotation axis (will be normalized).
 * @param {number} angleDeg - The rotation angle in degrees.
 * @returns {mat4} The calculated 4x4 matrix.
 */
export function generateMatrixFromAxisAngle(axis, angleDeg) {
    const out = mat4.create(); // Create identity matrix
    const rad = angleDeg * Math.PI / 180.0;
    const normalizedAxis = vec3.normalize([], axis);
    if (vec3.length(normalizedAxis) < EPSILON && angleDeg !== 0) {
         console.warn("Axis vector is near zero, returning identity for non-zero angle:", axis);
         // Or handle axis=[0,0,0] specifically for Identity
    }
    // Handle potential NaN axis components if input axis was zero vector
    if (normalizedAxis.some(isNaN)) {
        // If axis was [0,0,0], treat as identity
         console.warn("Axis vector resulted in NaN, returning identity:", axis);
        return mat4.identity(out);
    }
     try {
        // Use quaternion rotation for robustness maybe? or direct rotation
        mat4.fromRotation(out, rad, normalizedAxis);
        // Or using quaternion:
        // const q = quat.setAxisAngle([], normalizedAxis, rad);
        // mat4.fromQuat(out, q);
     } catch (e) {
         console.error("Error generating matrix for axis:", axis, "angle:", angleDeg, e);
         mat4.identity(out); // Return identity on error
     }
    return out;
}

/**
 * Checks if two vectors are close within a tolerance.
 * @param {vec3} v1
 * @param {vec3} v2
 * @param {number} epsilon
 * @returns {boolean}
 */
export function AproxVec3Equals(v1, v2, epsilon = EPSILON) {
    return vec3.distance(v1, v2) < epsilon;
}

/**
 * Applies a matrix transformation to a vertex.
 * @param {vec3} vertex The input vertex (3 components).
 * @param {mat4} matrix The 4x4 transformation matrix.
 * @returns {vec3} The transformed vertex (3 components).
 */
export function applyOpToVertex(vertex, matrix) {
    const vec4Vertex = [vertex[0], vertex[1], vertex[2], 1.0]; // Convert to vec4 for mat4 multiplication
    const transformedVec4 = [];
    vec4.transformMat4(transformedVec4, vec4Vertex, matrix);
    // Convert back to vec3 (perspective divide if needed, usually w=1 for rotations)
    if (Math.abs(transformedVec4[3]) < EPSILON) {
        console.warn("Transformed w component is near zero.");
        return [transformedVec4[0], transformedVec4[1], transformedVec4[2]];
    }
    const w = transformedVec4[3];
    return [transformedVec4[0] / w, transformedVec4[1] / w, transformedVec4[2] / w];
}

/**
 * Checks if a 4x4 matrix represents an orthogonal transformation (like rotation).
 * Checks if M^T * M is close to the identity matrix.
 * @param {mat4} matrix The matrix to check.
 * @param {number} epsilon Tolerance.
 * @returns {boolean}
 */
export function isOrthogonal(matrix, epsilon = EPSILON) {
    const transpose = mat4.transpose([], matrix);
    const product = mat4.multiply([], transpose, matrix);
    const identity = mat4.create();
    // Check if product is close to identity
    for (let i = 0; i < 16; i++) {
        if (Math.abs(product[i] - identity[i]) > epsilon) {
            // console.log(`Orthogonality check fail at index ${i}: ${product[i]} vs ${identity[i]}`);
            return false;
        }
    }
    return true;
}

/**
 * Checks if a 4x4 matrix determinant is close to 1 (characteristic of rotation).
 * @param {mat4} matrix
 * @param {number} epsilon
 * @returns {boolean}
 */
export function isRotationMatrix(matrix, epsilon = EPSILON) {
    const det = mat4.determinant(matrix);
    // console.log("Determinant:", det); // Debug
    return Math.abs(det - 1.0) < epsilon;
}