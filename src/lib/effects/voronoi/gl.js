/**
 * Minimal WebGL2 full-screen-quad helper.
 *
 * This folder keeps its own copy rather than importing a shared one. Forty
 * duplicated lines are a fair price for a folder you can lift whole into any
 * project with no other files to chase.
 */

/**
 * @param {WebGL2RenderingContext} gl
 * @param {number} type
 * @param {string} source
 */
function compile(gl, type, source) {
	const shader = /** @type {WebGLShader} */ (gl.createShader(type));
	gl.shaderSource(shader, source);
	gl.compileShader(shader);
	if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
		const log = gl.getShaderInfoLog(shader);
		gl.deleteShader(shader);
		throw new Error(`Shader failed to compile: ${log}`);
	}
	return shader;
}

/**
 * Builds a program that draws one triangle covering the viewport. A single
 * oversized triangle beats two triangles: no diagonal seam, one fewer vertex.
 * @param {WebGL2RenderingContext} gl
 * @param {string} fragmentSource
 */
export function createQuadProgram(gl, fragmentSource) {
	const vertexSource = /* glsl */ `#version 300 es
		out vec2 vUv;
		void main() {
			// Vertex 0,1,2 -> (-1,-1), (3,-1), (-1,3): one triangle that covers
			// the clip-space square with room to spare.
			vec2 pos = vec2((gl_VertexID << 1) & 2, gl_VertexID & 2);
			vUv = pos;
			gl_Position = vec4(pos * 2.0 - 1.0, 0.0, 1.0);
		}
	`;

	const program = /** @type {WebGLProgram} */ (gl.createProgram());
	const vertex = compile(gl, gl.VERTEX_SHADER, vertexSource);
	const fragment = compile(gl, gl.FRAGMENT_SHADER, fragmentSource);
	gl.attachShader(program, vertex);
	gl.attachShader(program, fragment);
	gl.linkProgram(program);
	gl.deleteShader(vertex);
	gl.deleteShader(fragment);

	if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
		throw new Error(`Program failed to link: ${gl.getProgramInfoLog(program)}`);
	}

	// WebGL2 still needs a bound VAO even when the vertices come from gl_VertexID.
	const vao = gl.createVertexArray();

	/** @type {Map<string, WebGLUniformLocation|null>} */
	const uniforms = new Map();

	return {
		program,
		/** @param {string} name */
		uniform(name) {
			if (!uniforms.has(name)) uniforms.set(name, gl.getUniformLocation(program, name));
			return uniforms.get(name) ?? null;
		},
		draw() {
			gl.useProgram(program);
			gl.bindVertexArray(vao);
			gl.drawArrays(gl.TRIANGLES, 0, 3);
		},
		destroy() {
			gl.deleteProgram(program);
			gl.deleteVertexArray(vao);
		}
	};
}
