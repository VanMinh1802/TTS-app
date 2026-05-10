"use client";

import { useEffect, useRef } from "react";

export function WebGLBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const active = { current: true };
    const mouse = { x: 0.5, y: 0.5, tx: 0.5, ty: 0.5 };

    const gl = canvas.getContext("webgl");
    if (!gl) {
      console.error("WebGL not supported");
      return;
    }

    const vsSource = `
      attribute vec4 aVertexPosition;
      void main() { gl_Position = aVertexPosition; }
    `;

    const fsSource = `
      precision highp float;
      uniform vec2 u_resolution;
      uniform float u_time;
      uniform vec2 u_mouse;

      void main() {
          vec2 uv = gl_FragCoord.xy / u_resolution.xy;
          vec2 p = uv * 2.0 - 1.0;
          p.x *= u_resolution.x / u_resolution.y;

          // Mouse influence: subtle ring offset
          float mx = (u_mouse.x - 0.5) * 0.15;
          float my = (u_mouse.y - 0.5) * 0.1;

          p.x += mx;
          p.y += 0.8 + my;

          // Breathing pulse
          float breath = sin(u_time * 0.3) * 0.06 + 1.0;
          float radius = 1.6 * breath;
          float thickness = 0.5;

          float r = length(p);
          float a = atan(p.y, p.x);
          float dist = abs(r - radius);

          // Warp with time and mouse
          float warp = sin(r * 4.0 - u_time * 0.5 + mx * 2.0) * 0.3;
          float lineFreq = 80.0;
          float lines = sin((a + warp) * lineFreq + u_time * 2.0);
          lines = smoothstep(0.85, 1.0, lines);

          float mask = smoothstep(thickness, 0.0, dist);
          float coreGlow = 0.06 / (dist * dist + 0.04);
          float pattern = lines * mask;

          // Color shift with mouse
          float colorShift = mx * 0.3;
          vec3 col1 = vec3(0.3 + colorShift, 0.4, 1.0);
          vec3 col2 = vec3(0.5, 0.2 + colorShift * 0.5, 0.9);
          vec3 baseColor = mix(col1, col2, sin(a * 2.0 + u_time * 0.5) * 0.5 + 0.5);
          vec3 lineColor = mix(baseColor, vec3(1.0), 0.4);

          vec3 finalColor = lineColor * pattern * 2.5 + baseColor * coreGlow * 2.0;
          finalColor *= smoothstep(1.5, -0.5, p.y);
          finalColor *= smoothstep(3.0, 1.0, r);

          float brightness = max(max(finalColor.r, finalColor.g), finalColor.b);
          float alpha = clamp(brightness * 2.5, 0.0, 1.0);
          gl_FragColor = vec4(finalColor, alpha);
      }
    `;

    function loadShader(gl: WebGLRenderingContext, type: number, source: string) {
      const shader = gl.createShader(type);
      if (!shader) return null;
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error("Shader compile error:", gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
      }
      return shader;
    }

    const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vsSource);
    const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fsSource);
    if (!vertexShader || !fragmentShader) return;

    const shaderProgram = gl.createProgram();
    if (!shaderProgram) return;
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram);
    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) return;

    const positions = new Float32Array([-1.0, 1.0, 1.0, 1.0, -1.0, -1.0, 1.0, -1.0]);
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);

    const vertexPosition = gl.getAttribLocation(shaderProgram, "aVertexPosition");
    const resolutionLocation = gl.getUniformLocation(shaderProgram, "u_resolution");
    const timeLocation = gl.getUniformLocation(shaderProgram, "u_time");
    const mouseLocation = gl.getUniformLocation(shaderProgram, "u_mouse");

    const handleResize = () => {
      const dpr = window.devicePixelRatio || 1;
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      if (canvas.width !== w * dpr || canvas.height !== h * dpr) {
        canvas.width = w * dpr;
        canvas.height = h * dpr;
        gl.viewport(0, 0, canvas.width, canvas.height);
      }
    };

    handleResize();
    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(canvas);

    const handleMouse = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouse.tx = (e.clientX - rect.left) / rect.width;
      mouse.ty = 1.0 - (e.clientY - rect.top) / rect.height;
    };
    window.addEventListener("mousemove", handleMouse);

    let animationFrameId: number;

    function render(time: number) {
      if (!active.current) return;
      mouse.x += (mouse.tx - mouse.x) * 0.05;
      mouse.y += (mouse.ty - mouse.y) * 0.05;

      gl!.clearColor(0.0, 0.0, 0.0, 0.0);
      gl!.clear(gl!.COLOR_BUFFER_BIT);
      gl!.useProgram(shaderProgram!);
      gl!.bindBuffer(gl!.ARRAY_BUFFER, positionBuffer);
      gl!.vertexAttribPointer(vertexPosition, 2, gl!.FLOAT, false, 0, 0);
      gl!.enableVertexAttribArray(vertexPosition);
      gl!.uniform2f(resolutionLocation, canvas!.width, canvas!.height);
      gl!.uniform1f(timeLocation, time * 0.001);
      gl!.uniform2f(mouseLocation, mouse.x, mouse.y);
      gl!.drawArrays(gl!.TRIANGLE_STRIP, 0, 4);

      animationFrameId = requestAnimationFrame(render);
    }

    const handleVisibility = () => {
      active.current = !document.hidden;
      if (active.current) animationFrameId = requestAnimationFrame(render);
    };
    document.addEventListener("visibilitychange", handleVisibility);
    animationFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("mousemove", handleMouse);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      id="heroCanvas"
      className="absolute inset-0 w-full h-full pointer-events-none z-0"
    />
  );
}
