// The regrade pass in WebGL2. One full-screen triangle; the source (image or <video>) is a texture.
// Each pixel moves by a soft blend of the offsets of the centres near it (README, "How the regrade
// works"). A second, small framebuffer gives the clustering an unmodified low-res copy to sample.
import { K_MAX } from './kmeans.js';

const VS = `#version 300 es
out vec2 uv;
void main() {
  vec2 p = vec2((gl_VertexID << 1) & 2, gl_VertexID & 2);
  uv = vec2(p.x, 1.0 - p.y);   // image row 0 is the top of the screen
  gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0);
}`;

// Mode 0: regrade. 1: flat (each pixel becomes its nearest centre, plus that centre's offset).
// 2: passthrough (the original, for the clustering copy and for comparing).
const FS = `#version 300 es
precision highp float;
in vec2 uv;
out vec4 o;
uniform sampler2D src;
uniform vec3 C[${K_MAX}];
uniform vec3 OFF[${K_MAX}];
uniform int K;
uniform float invS2;
uniform int mode;
vec3 toLin(vec3 c) { return mix(c / 12.92, pow((c + 0.055) / 1.055, vec3(2.4)), step(0.04045, c)); }
vec3 toSrgb(vec3 x) { return mix(12.92 * x, 1.055 * pow(x, vec3(1.0 / 2.4)) - 0.055, step(0.0031308, x)); }
vec3 toLab(vec3 c) {
  vec3 lin = toLin(c);
  vec3 lms = vec3(
    dot(lin, vec3(0.4122214708, 0.5363325363, 0.0514459929)),
    dot(lin, vec3(0.2119034982, 0.6806995451, 0.1073969566)),
    dot(lin, vec3(0.0883024619, 0.2817188376, 0.6299787005)));
  lms = sign(lms) * pow(abs(lms), vec3(1.0 / 3.0));
  return vec3(
    dot(lms, vec3(0.2104542553, 0.793617785, -0.0040720468)),
    dot(lms, vec3(1.9779984951, -2.428592205, 0.4505937099)),
    dot(lms, vec3(0.0259040371, 0.7827717662, -0.808675766)));
}
vec3 fromLab(vec3 p) {
  vec3 lms = vec3(
    p.x + 0.3963377774 * p.y + 0.2158037573 * p.z,
    p.x - 0.1055613458 * p.y - 0.0638541728 * p.z,
    p.x - 0.0894841775 * p.y - 1.291485548 * p.z);
  lms = lms * lms * lms;
  vec3 lin = vec3(
    dot(lms, vec3(4.0767416621, -3.3077115913, 0.2309699292)),
    dot(lms, vec3(-1.2684380046, 2.6097574011, -0.3413193965)),
    dot(lms, vec3(-0.0041960863, -0.7034186147, 1.707614701)));
  return toSrgb(clamp(lin, 0.0, 1.0));
}
void main() {
  vec3 c = texture(src, uv).rgb;
  if (mode == 2) { o = vec4(c, 1.0); return; }
  vec3 p = toLab(c);
  float dmin = 1e9; int jmin = 0;
  for (int j = 0; j < ${K_MAX}; j++) {
    if (j >= K) break;
    vec3 d = p - C[j]; float dd = dot(d, d);
    if (dd < dmin) { dmin = dd; jmin = j; }
  }
  if (mode == 1) { o = vec4(fromLab(C[jmin] + OFF[jmin]), 1.0); return; }
  vec3 shift = vec3(0.0); float wsum = 0.0;
  for (int j = 0; j < ${K_MAX}; j++) {
    if (j >= K) break;
    vec3 d = p - C[j];
    float w = exp(-(dot(d, d) - dmin) * invS2);   // relative to the nearest: never all zero
    shift += w * OFF[j]; wsum += w;
  }
  o = vec4(fromLab(p + shift / wsum), 1.0);
}`;

// The same formula in JS, for checking the shader against (mode 0 only).
export function regradeRef(lab, C, OFF, K, invS2) {
  let dmin = Infinity;
  for (let j = 0; j < K; j++) {
    const d =
      (lab[0] - C[j * 3]) ** 2 +
      (lab[1] - C[j * 3 + 1]) ** 2 +
      (lab[2] - C[j * 3 + 2]) ** 2;
    if (d < dmin) dmin = d;
  }
  const s = [0, 0, 0];
  let wsum = 0;
  for (let j = 0; j < K; j++) {
    const d =
      (lab[0] - C[j * 3]) ** 2 +
      (lab[1] - C[j * 3 + 1]) ** 2 +
      (lab[2] - C[j * 3 + 2]) ** 2;
    const w = Math.exp(-(d - dmin) * invS2);
    for (let t = 0; t < 3; t++) s[t] += w * OFF[j * 3 + t];
    wsum += w;
  }
  return [lab[0] + s[0] / wsum, lab[1] + s[1] / wsum, lab[2] + s[2] / wsum];
}

export function createRegrade(canvas, { sampleW = 160 } = {}) {
  const gl = canvas.getContext('webgl2', {
    antialias: false,
    preserveDrawingBuffer: true,
  });
  if (!gl) throw new Error('WebGL2 is not available');
  const sh = (type, text) => {
    const s = gl.createShader(type);
    gl.shaderSource(s, text);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS))
      throw new Error(gl.getShaderInfoLog(s));
    return s;
  };
  const prog = gl.createProgram();
  gl.attachShader(prog, sh(gl.VERTEX_SHADER, VS));
  gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FS));
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS))
    throw new Error(gl.getProgramInfoLog(prog));
  gl.useProgram(prog);
  gl.bindVertexArray(gl.createVertexArray());
  const U = Object.fromEntries(
    ['src', 'C', 'OFF', 'K', 'invS2', 'mode'].map((n) => [
      n,
      gl.getUniformLocation(prog, n),
    ])
  );
  gl.uniform1i(U.src, 0);

  const tex = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, tex);
  for (const [k, v] of [
    [gl.TEXTURE_MIN_FILTER, gl.LINEAR],
    [gl.TEXTURE_MAG_FILTER, gl.LINEAR],
    [gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE],
    [gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE],
  ])
    gl.texParameteri(gl.TEXTURE_2D, k, v);

  // The clustering copy: a small RGBA8 target, read back synchronously.
  const fbo = gl.createFramebuffer(),
    small = gl.createTexture();
  let sw = 0,
    sh2 = 0,
    readBuf = null;
  const sizeSmall = (w, h) => {
    sw = Math.min(sampleW, w);
    sh2 = Math.max(1, Math.round((h * sw) / w));
    gl.bindTexture(gl.TEXTURE_2D, small);
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA8,
      sw,
      sh2,
      0,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      null
    );
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.framebufferTexture2D(
      gl.FRAMEBUFFER,
      gl.COLOR_ATTACHMENT0,
      gl.TEXTURE_2D,
      small,
      0
    );
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    readBuf = new Uint8Array(sw * sh2 * 4);
  };

  let w = 0,
    h = 0;
  const state = { K: 0, invS2: 1, mode: 0 };
  return {
    gl,
    // Upload a frame. `el` is an <img>, <video>, ImageBitmap or canvas.
    upload(el, ew, eh) {
      if (ew !== w || eh !== h) {
        w = ew;
        h = eh;
        canvas.width = w;
        canvas.height = h;
        sizeSmall(w, h);
      }
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, gl.RGBA, gl.UNSIGNED_BYTE, el);
    },
    setCentres(C, OFF, K, sigma) {
      if (!(K >= 1 && K <= K_MAX))
        throw new Error(`K=${K} outside 1..${K_MAX}`);
      if (!(sigma > 0)) throw new Error('sigma must be > 0');
      gl.uniform3fv(U.C, C, 0, K * 3);
      gl.uniform3fv(U.OFF, OFF, 0, K * 3);
      state.K = K;
      state.invS2 = 1 / (sigma * sigma);
    },
    setMode(m) {
      if (![0, 1, 2].includes(m)) throw new Error('mode 0..2');
      state.mode = m;
    },
    draw() {
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.uniform1i(U.K, state.K);
      gl.uniform1f(U.invS2, state.invS2);
      gl.uniform1i(U.mode, state.mode);
      gl.viewport(0, 0, w, h);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    },
    // The unmodified frame at low resolution, as RGBA bytes. Synchronous: it stalls the GPU.
    readSmall() {
      gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.uniform1i(U.mode, 2);
      gl.uniform1i(U.K, Math.max(1, state.K));
      gl.viewport(0, 0, sw, sh2);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      gl.readPixels(0, 0, sw, sh2, gl.RGBA, gl.UNSIGNED_BYTE, readBuf);
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      return { data: readBuf, pixels: sw * sh2 };
    },
    // Read back pixels of the drawn canvas (bottom-left origin), for the shader check.
    readCanvas(x, y) {
      const px = new Uint8Array(4);
      gl.readPixels(x, h - 1 - y, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px);
      return px;
    },
    get size() {
      return [w, h];
    },
  };
}
