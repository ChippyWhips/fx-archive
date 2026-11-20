/**
 * Minimal WebGL2 helpers: a full-screen triangle, textures and render targets.
 *
 * This folder keeps its own copy rather than importing a shared one, so it can
 * be lifted whole into any project with no other files to chase.
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
 * Builds a program that draws one triangle covering the viewport.
 * @param {WebGL2RenderingContext} gl
 * @param {string} fragmentSource
 */
export function createQuadProgram(gl, fragmentSource) {
	const vertexSource = /* glsl */ `#version 300 es
		out vec2 vUv;
		void main() {
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

/**
 * A texture sampled by exact texel, never filtered.
 * @param {WebGL2RenderingContext} gl
 */
export function createTexture(gl) {
	const texture = /** @type {WebGLTexture} */ (gl.createTexture());
	gl.bindTexture(gl.TEXTURE_2D, texture);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
	return texture;
}

/**
 * An RGBA8 texture with a framebuffer attached, so a pass can render into it.
 * @param {WebGL2RenderingContext} gl
 * @param {number} width
 * @param {number} height
 */
export function createTarget(gl, width, height) {
	const texture = createTexture(gl);
	gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
	const framebuffer = /** @type {WebGLFramebuffer} */ (gl.createFramebuffer());
	gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
	gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
	gl.bindFramebuffer(gl.FRAMEBUFFER, null);
	return {
		texture,
		framebuffer,
		destroy() {
			gl.deleteFramebuffer(framebuffer);
			gl.deleteTexture(texture);
		}
	};
}
