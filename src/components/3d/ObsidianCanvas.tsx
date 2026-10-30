"use client";

import { useEffect, useRef } from 'react';
import * as THREE from 'three';

/**
 * Painterly 3D obsidian command deck:
 *  · drifting star/dust field
 *  · glowing cybernetic grid plane (perspective floor)
 *  · slowly counter-rotating wireframe "justice core" (icosahedron + inner torus)
 *  · cursor-parallax camera, capped DPR, auto-pauses on hidden tabs
 */
export default function ObsidianCanvas({ className = '' }: { className?: string }) {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x05070d, 0.016);
    scene.background = new THREE.Color(0x05070d);

    const camera = new THREE.PerspectiveCamera(58, 1, 0.1, 140);
    camera.position.set(0, 3.6, 14);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
    renderer.setClearColor(0x05070d, 1);
    mount.appendChild(renderer.domElement);
    renderer.domElement.style.position = 'fixed';
    renderer.domElement.style.inset = '0';
    renderer.domElement.style.width = '100vw';
    renderer.domElement.style.height = '100vh';
    renderer.domElement.style.display = 'block';
    renderer.domElement.style.pointerEvents = 'none';
    renderer.domElement.style.zIndex = '0';

    // ---------- Lights (for any standard materials)
    scene.add(new THREE.AmbientLight(0x334466, 1.4));
    const lime = new THREE.PointLight(0xa3e635, 60, 60, 1.6);
    lime.position.set(-9, 6, 2);
    scene.add(lime);
    const cyan = new THREE.PointLight(0x22d3ee, 60, 60, 1.6);
    cyan.position.set(10, 5, -4);
    scene.add(cyan);

    // ---------- Cyber grid floor (two interleaved grids for depth)
    const gridGroup = new THREE.Group();
    const gridA = new THREE.GridHelper(90, 60, 0x22d3ee, 0x12202e);
    gridA.position.y = -3.4;
    (gridA.material as THREE.Material).transparent = true;
    (gridA.material as THREE.Material).opacity = 0.5;
    const gridB = new THREE.GridHelper(90, 18, 0xa3e635, 0x0e1a12);
    gridB.position.y = -3.38;
    (gridB.material as THREE.Material).transparent = true;
    (gridB.material as THREE.Material).opacity = 0.5;
    gridGroup.add(gridA, gridB);
    scene.add(gridGroup);

    // Horizon glow disc (fake volumetric bloom)
    const glowCanvas = document.createElement('canvas');
    glowCanvas.width = glowCanvas.height = 128;
    const gctx = glowCanvas.getContext('2d')!;
    const grad = gctx.createRadialGradient(64, 64, 4, 64, 64, 64);
    grad.addColorStop(0, 'rgba(34,211,238,0.85)');
    grad.addColorStop(0.4, 'rgba(163,230,53,0.28)');
    grad.addColorStop(1, 'rgba(5,7,13,0)');
    gctx.fillStyle = grad;
    gctx.fillRect(0, 0, 128, 128);
    const glowTex = new THREE.CanvasTexture(glowCanvas);
    const glow = new THREE.Sprite(
      new THREE.SpriteMaterial({ map: glowTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }),
    );
    glow.scale.set(46, 22, 1);
    glow.position.set(0, -1.4, -18);
    scene.add(glow);

    // ---------- Justice core: wireframe icosahedron + inner torus + core sphere
    const core = new THREE.Group();
    const ico = new THREE.LineSegments(
      new THREE.EdgesGeometry(new THREE.IcosahedronGeometry(2.35, 1)),
      new THREE.LineBasicMaterial({ color: 0xa3e635, transparent: true, opacity: 0.9 }),
    );
    const icoInner = new THREE.LineSegments(
      new THREE.EdgesGeometry(new THREE.IcosahedronGeometry(1.35, 0)),
      new THREE.LineBasicMaterial({ color: 0x22d3ee, transparent: true, opacity: 0.85 }),
    );
    const torus = new THREE.Mesh(
      new THREE.TorusGeometry(3.35, 0.055, 8, 72),
      new THREE.MeshBasicMaterial({ color: 0x22d3ee, transparent: true, opacity: 0.75 }),
    );
    torus.rotation.x = Math.PI / 2.35;
    const torus2 = new THREE.Mesh(
      new THREE.TorusGeometry(4.15, 0.03, 8, 72),
      new THREE.MeshBasicMaterial({ color: 0xa3e635, transparent: true, opacity: 0.55 }),
    );
    torus2.rotation.x = Math.PI / 1.72;
    torus2.rotation.y = 0.5;
    const coreBall = new THREE.Mesh(
      new THREE.SphereGeometry(0.62, 24, 24),
      new THREE.MeshBasicMaterial({ color: 0xd9f99d }),
    );
    const coreHalo = new THREE.Sprite(
      new THREE.SpriteMaterial({ map: glowTex, color: 0xa3e635, transparent: true, opacity: 0.9, depthWrite: false, blending: THREE.AdditiveBlending }),
    );
    coreHalo.scale.set(4.6, 4.6, 1);
    core.add(ico, icoInner, torus, torus2, coreBall, coreHalo);
    core.position.set(0, 1.15, 0);
    scene.add(core);

    // ---------- Particle dust field (two layers, parallax speeds)
    const makeCloud = (count: number, rMin: number, rMax: number, color: number, size: number, opacity: number) => {
      const pos = new Float32Array(count * 3);
      for (let i = 0; i < count; i++) {
        const r = rMin + Math.random() * (rMax - rMin);
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
        pos[i * 3 + 1] = Math.abs(r * Math.cos(phi)) * 0.75 - 2.5;
        pos[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
      }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      const mat = new THREE.PointsMaterial({ color, size, transparent: true, opacity, depthWrite: false, blending: THREE.AdditiveBlending });
      const pts = new THREE.Points(geo, mat);
      scene.add(pts);
      return pts;
    };
    const dustNear = makeCloud(650, 8, 26, 0x7dd3fc, 0.075, 0.85);
    const dustFar = makeCloud(900, 24, 52, 0xc4b5fd, 0.05, 0.6);

    // ---------- Floating "data motes" rising from the grid
    const moteCount = 90;
    const motePos = new Float32Array(moteCount * 3);
    const moteSpeed = new Float32Array(moteCount);
    for (let i = 0; i < moteCount; i++) {
      motePos[i * 3] = (Math.random() - 0.5) * 46;
      motePos[i * 3 + 1] = -3.2 + Math.random() * 9;
      motePos[i * 3 + 2] = (Math.random() - 0.5) * 46;
      moteSpeed[i] = 0.008 + Math.random() * 0.02;
    }
    const moteGeo = new THREE.BufferGeometry();
    moteGeo.setAttribute('position', new THREE.BufferAttribute(motePos, 3));
    const motes = new THREE.Points(
      moteGeo,
      new THREE.PointsMaterial({ color: 0xa3e635, size: 0.09, transparent: true, opacity: 0.9, depthWrite: false, blending: THREE.AdditiveBlending }),
    );
    scene.add(motes);

    // ---------- Interaction: cursor parallax
    const pointer = { x: 0, y: 0 };
    const onPointer = (e: PointerEvent) => {
      pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
      pointer.y = (e.clientY / window.innerHeight) * 2 - 1;
    };
    window.addEventListener('pointermove', onPointer, { passive: true });

    const resize = () => {
      const w = mount.clientWidth || 1;
      const h = mount.clientHeight || 1;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h, false);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(mount);

    // ---------- Animation loop
    const clock = new THREE.Clock();
    let raf = 0;
    let running = true;
    const onVis = () => {
      running = document.visibilityState === 'visible';
      if (running) tick();
    };
    const tick = () => {
      if (!running) return;
      raf = requestAnimationFrame(tick);
      const t = clock.getElapsedTime();

      core.rotation.y = t * 0.16;
      ico.rotation.x = t * 0.24;
      icoInner.rotation.y = -t * 0.4;
      icoInner.rotation.x = t * 0.31;
      torus.rotation.z = t * 0.35;
      torus2.rotation.z = -t * 0.22;
      coreBall.scale.setScalar(1 + Math.sin(t * 1.6) * 0.07);
      core.position.y = 1.15 + Math.sin(t * 0.85) * 0.32;

      dustNear.rotation.y = t * 0.012;
      dustFar.rotation.y = -t * 0.008;

      const mp = moteGeo.attributes.position as THREE.BufferAttribute;
      for (let i = 0; i < moteCount; i++) {
        let y = mp.getY(i) + moteSpeed[i];
        if (y > 6.5) y = -3.2;
        mp.setY(i, y);
      }
      mp.needsUpdate = true;

      // Subtle grid pulse drift
      gridA.position.z = (t * 0.9) % 3;
      gridB.position.z = (t * 0.9) % 10;

      camera.position.x += (pointer.x * 1.7 - camera.position.x) * 0.028;
      camera.position.y += (4.2 - pointer.y * 0.85 - camera.position.y) * 0.028;
      camera.lookAt(0, 0.6, 0);

      renderer.render(scene, camera);
    };
    tick();
    document.addEventListener('visibilitychange', onVis);

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      document.removeEventListener('visibilitychange', onVis);
      window.removeEventListener('pointermove', onPointer);
      ro.disconnect();
      mount.removeChild(renderer.domElement);
      scene.traverse((obj) => {
        const anyObj = obj as THREE.Mesh & THREE.Points & THREE.LineSegments;
        if (anyObj.geometry) anyObj.geometry.dispose();
        const mat = anyObj.material as THREE.Material | THREE.Material[] | undefined;
        if (Array.isArray(mat)) mat.forEach((m) => m.dispose());
        else if (mat) mat.dispose();
      });
      glowTex.dispose();
      renderer.dispose();
    };
  }, []);

  return <div ref={mountRef} className={`pointer-events-none fixed inset-0 overflow-hidden z-0 ${className}`} aria-hidden="true" />;
}
