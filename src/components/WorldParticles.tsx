"use client";

import { Component, useMemo, useRef, type ReactNode } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

class GraphicsBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() { return this.state.failed ? null : this.props.children; }
}

function Particles() {
  const points = useRef<THREE.Points>(null);
  const positions = useMemo(() => {
    const data = new Float32Array(120 * 3);
    for (let index = 0; index < 120; index++) {
      const seed = Math.sin(index * 127.1 + 311.7) * 43758.5453;
      const fraction = seed - Math.floor(seed);
      data[index * 3] = (fraction - 0.5) * 16;
      data[index * 3 + 1] = (Math.sin(index * 2.399) * 0.5) * 8;
      data[index * 3 + 2] = (Math.cos(index * 1.73) - 1) * 2;
    }
    return data;
  }, []);
  useFrame((state, delta) => {
    if (!points.current) return;
    points.current.rotation.z += Math.min(delta, 0.04) * 0.006;
    points.current.position.y = Math.sin(state.clock.elapsedTime * 0.08) * 0.09;
  });
  return <points ref={points}>
    <bufferGeometry><bufferAttribute attach="attributes-position" args={[positions, 3]} /></bufferGeometry>
    <pointsMaterial size={0.018} color="#65dcff" transparent opacity={0.42} sizeAttenuation depthWrite={false} blending={THREE.AdditiveBlending} />
  </points>;
}

export default function WorldParticles() {
  return <GraphicsBoundary>
    <Canvas camera={{ position: [0, 0, 9], fov: 45 }} dpr={[1, 1.25]} gl={{ alpha: true, antialias: false, powerPreference: "low-power", failIfMajorPerformanceCaveat: true }} onCreated={({ gl }) => { gl.setClearColor(0x000000, 0); }} fallback={<span />}>
      <Particles />
    </Canvas>
  </GraphicsBoundary>;
}
