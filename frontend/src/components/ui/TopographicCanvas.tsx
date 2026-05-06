'use client';

import { useEffect, useRef } from 'react';

const vertexShaderSource = `
  attribute vec2 position;
  void main() {
    gl_Position = vec4(position, 0.0, 1.0);
  }
`;

const fragmentShaderSource = `
  precision highp float;
  uniform vec2 u_resolution;
  uniform float u_time;
  uniform vec2 u_mouse;

  float random (in vec2 st) {
      return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
  }

  float noise (in vec2 st) {
      vec2 i = floor(st);
      vec2 f = fract(st);
      float a = random(i);
      float b = random(i + vec2(1.0, 0.0));
      float c = random(i + vec2(0.0, 1.0));
      float d = random(i + vec2(1.0, 1.0));
      vec2 u = f * f * (3.0 - 2.0 * f);
      return mix(a, b, u.x) + (c - a)* u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
  }

  #define NUM_OCTAVES 5

  float fbm (in vec2 st) {
      float v = 0.0;
      float a = 0.5;
      vec2 shift = vec2(100.0);
      mat2 rot = mat2(cos(0.5), sin(0.5), -sin(0.5), cos(0.5));
      for (int i = 0; i < NUM_OCTAVES; ++i) {
          v += a * noise(st);
          st = rot * st * 2.0 + shift;
          a *= 0.5;
      }
      return v;
  }

  void main() {
      // Normalize coordinates
      vec2 st = gl_FragCoord.xy / u_resolution.xy;
      st.x *= u_resolution.x / u_resolution.y;
      
      // Pointer-reactive drift (subtle parallax)
      vec2 mouseDrift = (u_mouse / u_resolution.xy - 0.5) * 0.4;
      st += mouseDrift;

      // Scale coordinates
      st *= 2.5;

      // Domain warping
      vec2 q = vec2(0.0);
      q.x = fbm(st + 0.02 * u_time);
      q.y = fbm(st + vec2(1.0));

      vec2 r = vec2(0.0);
      r.x = fbm(st + 1.0 * q + vec2(1.7, 9.2) + 0.05 * u_time);
      r.y = fbm(st + 1.0 * q + vec2(8.3, 2.8) + 0.04 * u_time);

      float f = fbm(st + r);

      // "Sparse spacing": mostly black, we threshold the noise
      f = smoothstep(0.4, 0.8, f);
      
      // "Slow breathing pulse"
      float pulse = sin(u_time * 0.5) * 0.5 + 0.5;
      float intensity = 0.5 + 0.5 * pulse;

      // Colors
      // Surface: #050604
      vec3 base = vec3(5.0/255.0, 6.0/255.0, 4.0/255.0);
      // Primary haze: #7A9A6E
      vec3 colHaze = vec3(122.0/255.0, 154.0/255.0, 110.0/255.0);

      // Mix
      vec3 color = mix(base, colHaze, f * intensity * 0.6);

      // Grain noise for atmospheric haze
      float grain = random(st * u_time) * 0.02;
      color += grain;

      gl_FragColor = vec4(color, 1.0);
  }
`;

export function TopographicCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mousePos = useRef({ x: 0, y: 0 });
  const targetMousePos = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext('webgl', { alpha: true });
    if (!gl) return;

    // Compile shader
    const compileShader = (type: number, source: string) => {
      const shader = gl.createShader(type);
      if (!shader) return null;
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error(gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
      }
      return shader;
    };

    const vs = compileShader(gl.VERTEX_SHADER, vertexShaderSource);
    const fs = compileShader(gl.FRAGMENT_SHADER, fragmentShaderSource);

    const program = gl.createProgram();
    if (!program || !vs || !fs) return;

    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    gl.useProgram(program);

    // Full screen quad
    const vertices = new Float32Array([
      -1, -1,
       1, -1,
      -1,  1,
      -1,  1,
       1, -1,
       1,  1,
    ]);

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

    const positionLoc = gl.getAttribLocation(program, 'position');
    gl.enableVertexAttribArray(positionLoc);
    gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, false, 0, 0);

    const timeLoc = gl.getUniformLocation(program, 'u_time');
    const resLoc = gl.getUniformLocation(program, 'u_resolution');
    const mouseLoc = gl.getUniformLocation(program, 'u_mouse');

    let animationFrameId: number;
    const startTime = Date.now();

    const resize = () => {
      const parent = canvas.parentElement;
      if (parent) {
        // DPR clamp
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        canvas.width = parent.clientWidth * dpr;
        canvas.height = parent.clientHeight * dpr;
        gl.viewport(0, 0, canvas.width, canvas.height);
        gl.uniform2f(resLoc, canvas.width, canvas.height);
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      targetMousePos.current = { x: e.clientX, y: e.clientY };
    };

    window.addEventListener('resize', resize);
    window.addEventListener('mousemove', handleMouseMove);
    
    // Initialize center
    if (typeof window !== 'undefined') {
      targetMousePos.current = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
      mousePos.current = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    }
    
    resize();

    const render = () => {
      const time = (Date.now() - startTime) / 1000.0;
      
      // Lerp mouse position for smooth drift
      mousePos.current.x += (targetMousePos.current.x - mousePos.current.x) * 0.05;
      mousePos.current.y += (targetMousePos.current.y - mousePos.current.y) * 0.05;
      
      gl.uniform1f(timeLoc, time);
      gl.uniform2f(mouseLoc, mousePos.current.x, mousePos.current.y);
      
      gl.drawArrays(gl.TRIANGLES, 0, 6);
      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div className="absolute inset-0 w-full h-full -z-10 bg-[#050604]">
      <canvas 
        ref={canvasRef} 
        className="w-full h-full object-cover"
        style={{ opacity: 0.8 }}
      />
      {/* DOM Fallback overlay - subtle gradient noise mask */}
      <div 
        className="absolute inset-0 pointer-events-none mix-blend-overlay"
        style={{
          background: 'radial-gradient(circle at center, transparent 0%, #050604 100%)',
          opacity: 0.5
        }}
      />
    </div>
  );
}
