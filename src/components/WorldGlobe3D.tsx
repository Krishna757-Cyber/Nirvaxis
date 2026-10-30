"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import * as THREE from "three";
import type { RegionId } from "@/types/resolve";
import { mockScenarios } from "@/lib/mockScenarios";
import { Navigation, Play, Pause, RotateCcw, Sun, Moon, Sunrise, Sparkles } from "lucide-react";

interface NodeData {
  id: RegionId;
  label: string;
  sub: string;
  color: string;
  lat: number;
  lng: number;
  timeZone: string;
}

const REGION_NODES: NodeData[] = [
  { id: "INDIA", label: "INDIA", sub: "4 ACTIVE CASES", color: "#f6c35b", lat: 21.76, lng: 78.87, timeZone: "Asia/Kolkata" },
  { id: "MIDDLE EAST", label: "MIDDLE EAST", sub: "2 ACTIVE CASES", color: "#ff5b72", lat: 24.45, lng: 54.37, timeZone: "Asia/Dubai" },
  { id: "EUROPE", label: "EUROPE", sub: "4 ACTIVE CASES", color: "#39e8b2", lat: 48.85, lng: 10.35, timeZone: "Europe/Paris" },
  { id: "USA", label: "USA", sub: "3 ACTIVE CASES", color: "#4c9dff", lat: 38.5, lng: -96.5, timeZone: "America/New_York" },
  { id: "SE ASIA", label: "SE ASIA", sub: "1 ACTIVE CASE", color: "#39e8b2", lat: 1.35, lng: 103.82, timeZone: "Asia/Singapore" },
  { id: "AUSTRALIA", label: "AUSTRALIA", sub: "1 ACTIVE CASE", color: "#6da7ff", lat: -33.86, lng: 151.21, timeZone: "Australia/Sydney" },
];

const ROUTE_CONNECTIONS: [RegionId, RegionId][] = [
  ["USA", "EUROPE"],
  ["EUROPE", "MIDDLE EAST"],
  ["MIDDLE EAST", "INDIA"],
  ["INDIA", "SE ASIA"],
  ["SE ASIA", "AUSTRALIA"],
  ["USA", "INDIA"],
];

function latLngToVector3(lat: number, lng: number, radius = 1.0): THREE.Vector3 {
  const phi = (lng + 180) * (Math.PI / 180);
  const theta = (90 - lat) * (Math.PI / 180);
  const x = -radius * Math.cos(phi) * Math.sin(theta);
  const y = radius * Math.cos(theta);
  const z = radius * Math.sin(phi) * Math.sin(theta);
  return new THREE.Vector3(x, y, z);
}

function createArcCurve(p1: THREE.Vector3, p2: THREE.Vector3, elevation = 0.22): THREE.QuadraticBezierCurve3 {
  const mid = new THREE.Vector3().addVectors(p1, p2).multiplyScalar(0.5);
  const distance = p1.distanceTo(p2);
  const altitude = 1 + distance * elevation;
  mid.normalize().multiplyScalar(mid.length() * altitude);
  return new THREE.QuadraticBezierCurve3(p1, mid, p2);
}

function getLocalSunVector(): THREE.Vector3 {
  const now = new Date();
  const utcHours = now.getUTCHours() + now.getUTCMinutes() / 60 + now.getUTCSeconds() / 3600;
  const sunLng = (12 - utcHours) * 15;
  const declination = -13.5;
  return latLngToVector3(declination, sunLng, 1.0).normalize();
}

interface WorldGlobe3DProps {
  selectedRegion: RegionId | null;
  onSelect: (region: RegionId) => void;
  playing?: boolean;
}

export default function WorldGlobe3D({ selectedRegion, onSelect, playing = true }: WorldGlobe3DProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoveredNode, setHoveredNode] = useState<NodeData | null>(null);
  const [screenCoords, setScreenCoords] = useState<{ x: number; y: number } | null>(null);
  const [userPaused, setUserPaused] = useState(false);
  const [sunMode, setSunMode] = useState<"live" | "cycle">("live");
  const [liveInfo, setLiveInfo] = useState<Record<RegionId, { time: string; phase: "day" | "twilight" | "night" }>>({} as Record<RegionId, { time: string; phase: "day" | "twilight" | "night" }>);

  const autoRotate = playing && !userPaused;

  const globeGroupRef = useRef<THREE.Group | null>(null);
  const cloudsMeshRef = useRef<THREE.Mesh | null>(null);
  const earthMatRef = useRef<THREE.ShaderMaterial | null>(null);
  const cloudsMatRef = useRef<THREE.ShaderMaterial | null>(null);
  const targetRotationRef = useRef<{ x: number; y: number } | null>(null);
  const isDraggingRef = useRef(false);
  const prevMouseRef = useRef({ x: 0, y: 0 });
  const velocityRef = useRef({ x: 0, y: 0 });
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const sunCycleAngleRef = useRef(0);

  // Compute live local clocks and physical solar altitude for each country
  useEffect(() => {
    const updateTimes = () => {
      const now = new Date();
      const sunVec = getLocalSunVector();
      const updated: Record<RegionId, { time: string; phase: "day" | "twilight" | "night" }> = {} as Record<RegionId, { time: string; phase: "day" | "twilight" | "night" }>;

      REGION_NODES.forEach((node) => {
        try {
          const formatter = new Intl.DateTimeFormat("en-US", {
            timeZone: node.timeZone,
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
          });
          const timeStr = formatter.format(now);

          const nodeVec = latLngToVector3(node.lat, node.lng, 1.0).normalize();
          const dotSun = nodeVec.dot(sunVec);

          let phase: "day" | "twilight" | "night" = "night";
          if (dotSun > 0.08) phase = "day";
          else if (dotSun >= -0.08) phase = "twilight";
          else phase = "night";

          updated[node.id] = { time: timeStr, phase };
        } catch {
          updated[node.id] = { time: "--:--", phase: "day" };
        }
      });
      setLiveInfo(updated);
    };

    updateTimes();
    const interval = setInterval(updateTimes, 1000);
    return () => clearInterval(interval);
  }, []);

  const rotateToRegion = useCallback((regionId: RegionId) => {
    const node = REGION_NODES.find((n) => n.id === regionId);
    if (!node || !globeGroupRef.current) return;
    const targetY = -((node.lng + 90) * Math.PI) / 180;
    const targetX = ((node.lat * Math.PI) / 180) * 0.75;
    targetRotationRef.current = { x: targetX, y: targetY };
  }, []);

  useEffect(() => {
    if (selectedRegion) {
      rotateToRegion(selectedRegion);
    }
  }, [selectedRegion, rotateToRegion]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth || 800;
    const height = container.clientHeight || 450;

    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 0, 4.9);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);

    // Film-grade ACES Tonemapping prevents color blowout and preserves crisp, cinematic hues
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    rendererRef.current = renderer;
    container.appendChild(renderer.domElement);

    const globeGroup = new THREE.Group();
    globeGroupRef.current = globeGroup;
    scene.add(globeGroup);

    // Deep Space Starfield
    const starCount = 500;
    const starGeo = new THREE.BufferGeometry();
    const starPos = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount * 3; i += 3) {
      starPos[i] = (Math.random() - 0.5) * 45;
      starPos[i + 1] = (Math.random() - 0.5) * 30;
      starPos[i + 2] = -5 - Math.random() * 25;
    }
    starGeo.setAttribute("position", new THREE.BufferAttribute(starPos, 3));
    const starMat = new THREE.PointsMaterial({
      color: 0x82e0f5,
      size: 0.04,
      transparent: true,
      opacity: 0.55,
      blending: THREE.AdditiveBlending,
    });
    scene.add(new THREE.Points(starGeo, starMat));

    // High-Resolution NASA Textures with Max Anisotropic Filtering
    const textureLoader = new THREE.TextureLoader();
    const dayTexture = textureLoader.load("/images/day-earth.jpg");
    const nightTexture = textureLoader.load("/images/night-earth.jpg");
    const cloudsTexture = textureLoader.load("/images/clouds-earth.jpg");

    const maxAniso = renderer.capabilities.getMaxAnisotropy();

    [dayTexture, nightTexture, cloudsTexture].forEach((tex) => {
      tex.generateMipmaps = true;
      tex.minFilter = THREE.LinearMipmapLinearFilter;
      tex.magFilter = THREE.LinearFilter;
      tex.anisotropy = maxAniso;
    });

    dayTexture.wrapS = THREE.ClampToEdgeWrapping;
    dayTexture.wrapT = THREE.ClampToEdgeWrapping;
    nightTexture.wrapS = THREE.ClampToEdgeWrapping;
    nightTexture.wrapT = THREE.ClampToEdgeWrapping;
    cloudsTexture.wrapS = THREE.RepeatWrapping;
    cloudsTexture.wrapT = THREE.ClampToEdgeWrapping;

    const globeRadius = 1.85;

    // 1. Earth Sphere with Physically-Balanced Daylight, Sunset & Night Shader
    const sphereGeo = new THREE.SphereGeometry(globeRadius, 96, 96);

    const earthShader = {
      uniforms: {
        dayTexture: { value: dayTexture },
        nightTexture: { value: nightTexture },
        localSunDirection: { value: getLocalSunVector() },
      },
      vertexShader: `
        varying vec2 vUv;
        varying vec3 vLocalNormal;
        varying vec3 vViewNormal;
        varying vec3 vViewPosition;

        void main() {
          vUv = uv;
          vLocalNormal = normalize(normal);
          vViewNormal = normalize(normalMatrix * normal);
          vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
          vViewPosition = -mvPos.xyz;
          gl_Position = projectionMatrix * mvPos;
        }
      `,
      fragmentShader: `
        uniform sampler2D dayTexture;
        uniform sampler2D nightTexture;
        uniform vec3 localSunDirection;

        varying vec2 vUv;
        varying vec3 vLocalNormal;
        varying vec3 vViewNormal;
        varying vec3 vViewPosition;

        void main() {
          vec3 localNorm = normalize(vLocalNormal);
          vec3 viewNorm = normalize(vViewNormal);
          vec3 viewDir = normalize(vViewPosition);
          vec3 sunDir = normalize(localSunDirection);

          // Dot product in local Earth geographical coordinates
          float dotNL = dot(localNorm, sunDir);

          // Sample textures
          vec3 dayRGB = texture2D(dayTexture, vUv).rgb;
          vec3 nightRGB = texture2D(nightTexture, vUv).rgb;

          // Rich, crystal clear continental contrast
          dayRGB = pow(dayRGB, vec3(0.96)) * vec3(1.05, 1.03, 1.0);

          // Ocean detection for realistic water glint
          bool isOcean = (dayRGB.b > dayRGB.r * 1.15 && dayRGB.r < 0.26);

          // Specular sun glint off oceans on day side
          vec3 specular = vec3(0.0);
          if (isOcean && dotNL > 0.0) {
            float spec = pow(max(dotNL, 0.0), 32.0);
            specular = vec3(0.9, 0.96, 1.0) * spec * 0.35;
          }

          // Natural daylight diffuse illumination
          vec3 litDay = dayRGB * (0.12 + 0.88 * smoothstep(-0.02, 0.22, dotNL)) + specular;

          // Visually appealing, subtle golden-peach sunset / sunrise twilight (NOT overblown!)
          float twilight = smoothstep(-0.06, 0.0, dotNL) * smoothstep(0.08, 0.0, dotNL);
          vec3 sunsetHues = vec3(1.0, 0.52, 0.20) * 0.32;
          litDay += sunsetHues * twilight;

          // Night side: deep space ocean darkness with warm, crisp city lights
          vec3 nightOcean = vec3(0.005, 0.010, 0.022);
          vec3 cityLights = nightRGB * vec3(1.75, 1.45, 1.05);
          float cityIntensity = max(nightRGB.r, max(nightRGB.g, nightRGB.b));
          vec3 nightScene = mix(nightOcean, cityLights, smoothstep(0.06, 0.45, cityIntensity) * 1.6);

          // Smooth, physical day-to-night transition across terminator
          float nightWeight = smoothstep(0.02, -0.06, dotNL);
          vec3 earthColor = mix(litDay, nightScene, nightWeight);

          // Rayleigh Atmospheric Rim Scattering (soft azure blue along silhouette)
          float fresnel = pow(1.0 - max(dot(viewNorm, viewDir), 0.0), 3.2);
          float dayRim = smoothstep(-0.25, 0.35, dotNL);
          vec3 rimColor = mix(vec3(0.06, 0.18, 0.42), vec3(0.24, 0.65, 1.0), dayRim);
          earthColor += rimColor * fresnel * 0.75;

          gl_FragColor = vec4(earthColor, 1.0);
        }
      `,
    };

    const earthMat = new THREE.ShaderMaterial(earthShader);
    earthMatRef.current = earthMat;

    const globeMesh = new THREE.Mesh(sphereGeo, earthMat);
    globeMesh.rotation.set(0, 0, 0);
    globeGroup.add(globeMesh);

    // 2. Realistic 3D Cloud Layer with True Atmospheric Alpha Blending
    const cloudsGeo = new THREE.SphereGeometry(globeRadius * 1.012, 96, 96);
    const cloudsShader = {
      uniforms: {
        cloudsTexture: { value: cloudsTexture },
        localSunDirection: { value: getLocalSunVector() },
      },
      vertexShader: `
        varying vec2 vUv;
        varying vec3 vLocalNormal;
        void main() {
          vUv = uv;
          vLocalNormal = normalize(normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform sampler2D cloudsTexture;
        uniform vec3 localSunDirection;
        varying vec2 vUv;
        varying vec3 vLocalNormal;

        void main() {
          vec3 localNorm = normalize(vLocalNormal);
          float dotNL = dot(localNorm, normalize(localSunDirection));

          float density = texture2D(cloudsTexture, vUv).r;

          // Pure, fluffy white clouds on day side; soft slate on night side
          float sunLit = smoothstep(-0.04, 0.20, dotNL);
          vec3 cloudColor = mix(vec3(0.12, 0.16, 0.24), vec3(1.0, 1.0, 1.0), sunLit);

          // Subtle peach/golden rim on sunset clouds
          float sunset = smoothstep(-0.06, 0.0, dotNL) * smoothstep(0.08, 0.0, dotNL);
          cloudColor += vec3(1.0, 0.50, 0.20) * sunset * 0.35;

          // Transparent on night side so city lights shine through clearly
          float nightFade = mix(0.18, 0.62, smoothstep(-0.1, 0.15, dotNL));
          float alpha = density * nightFade;

          if (alpha < 0.02) discard;

          gl_FragColor = vec4(cloudColor, alpha);
        }
      `,
      transparent: true,
      blending: THREE.NormalBlending,
      depthWrite: false,
    };

    const cloudsMat = new THREE.ShaderMaterial(cloudsShader);
    cloudsMatRef.current = cloudsMat;

    const cloudsMesh = new THREE.Mesh(cloudsGeo, cloudsMat);
    cloudsMesh.rotation.set(0, 0, 0);
    cloudsMeshRef.current = cloudsMesh;
    globeGroup.add(cloudsMesh);

    // 3. Crisp Electric-Blue Atmospheric Limb Shell
    const atmosGeo = new THREE.SphereGeometry(globeRadius * 1.035, 64, 64);
    const atmosMat = new THREE.ShaderMaterial({
      vertexShader: `
        varying vec3 vNormal;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec3 vNormal;
        void main() {
          float intensity = pow(0.60 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 3.5);
          gl_FragColor = vec4(0.20, 0.65, 1.0, 1.0) * intensity * 0.85;
        }
      `,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
      transparent: true,
      depthWrite: false,
    });
    globeGroup.add(new THREE.Mesh(atmosGeo, atmosMat));

    // 4. Sleek, Minimal High-Tech Pinpoint Markers (Never block the continents)
    const nodeMeshes: { mesh: THREE.Mesh; node: NodeData }[] = [];
    const pulseRings: { mesh: THREE.Mesh }[] = [];

    REGION_NODES.forEach((node) => {
      const surfacePos = latLngToVector3(node.lat, node.lng, globeRadius);
      const tipPos = latLngToVector3(node.lat, node.lng, globeRadius + 0.05);

      // Sleek Glowing Jewel Pinpoint
      const pinGeo = new THREE.SphereGeometry(0.024, 16, 16);
      const pinMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(node.color) });
      const pin = new THREE.Mesh(pinGeo, pinMat);
      pin.position.copy(tipPos);
      globeGroup.add(pin);
      nodeMeshes.push({ mesh: pin, node });

      // Delicate, Thin Holographic Radar Ring
      const haloGeo = new THREE.RingGeometry(0.026, 0.038, 32);
      const haloMat = new THREE.MeshBasicMaterial({
        color: new THREE.Color(node.color),
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.8,
      });
      const halo = new THREE.Mesh(haloGeo, haloMat);
      halo.position.copy(surfacePos.clone().multiplyScalar(1.001));
      halo.lookAt(surfacePos.clone().multiplyScalar(2));
      globeGroup.add(halo);
      pulseRings.push({ mesh: halo });

      // Slender Vertical Laser Stalk
      const linePos = [surfacePos.x, surfacePos.y, surfacePos.z, tipPos.x, tipPos.y, tipPos.z];
      const lineGeo = new THREE.BufferGeometry();
      lineGeo.setAttribute("position", new THREE.Float32BufferAttribute(linePos, 3));
      const lineMat = new THREE.LineBasicMaterial({
        color: new THREE.Color(node.color),
        transparent: true,
        opacity: 0.75,
      });
      globeGroup.add(new THREE.Line(lineGeo, lineMat));
    });

    // 5. Delicate 3D Route Flight Arcs
    const arcPoints: { curve: THREE.QuadraticBezierCurve3; particle: THREE.Mesh }[] = [];
    ROUTE_CONNECTIONS.forEach(([startId, endId]) => {
      const startNode = REGION_NODES.find((n) => n.id === startId);
      const endNode = REGION_NODES.find((n) => n.id === endId);
      if (!startNode || !endNode) return;

      const p1 = latLngToVector3(startNode.lat, startNode.lng, globeRadius + 0.05);
      const p2 = latLngToVector3(endNode.lat, endNode.lng, globeRadius + 0.05);
      const curve = createArcCurve(p1, p2, 0.22);

      const points = curve.getPoints(50);
      const arcGeo = new THREE.BufferGeometry().setFromPoints(points);
      const arcMat = new THREE.LineBasicMaterial({
        color: 0x4fe7ed,
        transparent: true,
        opacity: 0.35,
      });
      globeGroup.add(new THREE.Line(arcGeo, arcMat));

      const particleGeo = new THREE.SphereGeometry(0.015, 8, 8);
      const particleMat = new THREE.MeshBasicMaterial({ color: 0x8affff });
      const particle = new THREE.Mesh(particleGeo, particleMat);
      globeGroup.add(particle);
      arcPoints.push({ curve, particle });
    });

    // Pointer Interactivity
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const handlePointerDown = (e: MouseEvent) => {
      isDraggingRef.current = true;
      targetRotationRef.current = null;
      prevMouseRef.current = { x: e.clientX, y: e.clientY };
    };

    const handlePointerMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(nodeMeshes.map((m) => m.mesh));
      if (intersects.length > 0) {
        const found = nodeMeshes.find((m) => m.mesh === intersects[0].object);
        if (found) {
          setHoveredNode(found.node);
          setScreenCoords({ x: e.clientX - rect.left, y: e.clientY - rect.top });
          container.style.cursor = "pointer";
        }
      } else {
        setHoveredNode(null);
        container.style.cursor = isDraggingRef.current ? "grabbing" : "grab";
      }

      if (!isDraggingRef.current) return;
      const deltaX = e.clientX - prevMouseRef.current.x;
      const deltaY = e.clientY - prevMouseRef.current.y;
      prevMouseRef.current = { x: e.clientX, y: e.clientY };

      velocityRef.current = { x: deltaX * 0.005, y: deltaY * 0.005 };

      if (globeGroupRef.current) {
        globeGroupRef.current.rotation.y += velocityRef.current.x;
        globeGroupRef.current.rotation.x += velocityRef.current.y;
        globeGroupRef.current.rotation.x = Math.max(-Math.PI / 2.3, Math.min(Math.PI / 2.3, globeGroupRef.current.rotation.x));
      }
    };

    const handlePointerUp = (e: MouseEvent) => {
      if (isDraggingRef.current) {
        const rect = container.getBoundingClientRect();
        mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObjects(nodeMeshes.map((m) => m.mesh));
        if (intersects.length > 0) {
          const found = nodeMeshes.find((m) => m.mesh === intersects[0].object);
          if (found) {
            onSelect(found.node.id);
            rotateToRegion(found.node.id);
          }
        }
      }
      isDraggingRef.current = false;
    };

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (!cameraRef.current) return;
      const zoomSpeed = 0.003;
      cameraRef.current.position.z = Math.max(2.8, Math.min(7.5, cameraRef.current.position.z + e.deltaY * zoomSpeed));
    };

    container.addEventListener("mousedown", handlePointerDown);
    window.addEventListener("mousemove", handlePointerMove);
    window.addEventListener("mouseup", handlePointerUp);
    container.addEventListener("wheel", handleWheel, { passive: false });

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width: newW, height: newH } = entry.contentRect;
        if (newW > 0 && newH > 0 && cameraRef.current && rendererRef.current) {
          cameraRef.current.aspect = newW / newH;
          cameraRef.current.updateProjectionMatrix();
          rendererRef.current.setSize(newW, newH);
        }
      }
    });
    resizeObserver.observe(container);

    // Initial View: Center on India, Middle East & Europe
    globeGroup.rotation.y = -2.9;
    globeGroup.rotation.x = 0.28;

    // Animation Loop
    let animationFrameId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      const time = clock.getElapsedTime();

      // Live UTC Sun Position vs Cycle Sun
      let currentLocalSun: THREE.Vector3;
      if (sunMode === "cycle") {
        sunCycleAngleRef.current += delta * 0.18;
        currentLocalSun = latLngToVector3(-13.5, (sunCycleAngleRef.current * 180) / Math.PI, 1.0).normalize();
      } else {
        currentLocalSun = getLocalSunVector();
      }

      if (earthMatRef.current) {
        earthMatRef.current.uniforms.localSunDirection.value.copy(currentLocalSun);
      }
      if (cloudsMatRef.current) {
        cloudsMatRef.current.uniforms.localSunDirection.value.copy(currentLocalSun);
      }

      // Smooth inertia rotation
      if (targetRotationRef.current && globeGroupRef.current) {
        const diffY = targetRotationRef.current.y - globeGroupRef.current.rotation.y;
        const diffX = targetRotationRef.current.x - globeGroupRef.current.rotation.x;
        const wrappedY = Math.atan2(Math.sin(diffY), Math.cos(diffY));

        globeGroupRef.current.rotation.y += wrappedY * 0.08;
        globeGroupRef.current.rotation.x += diffX * 0.08;

        if (Math.abs(wrappedY) < 0.002 && Math.abs(diffX) < 0.002) {
          targetRotationRef.current = null;
        }
      } else if (!isDraggingRef.current && autoRotate && globeGroupRef.current) {
        globeGroupRef.current.rotation.y += delta * 0.06;
      }

      // Gentle cloud drift
      if (cloudsMeshRef.current) {
        cloudsMeshRef.current.rotation.y += delta * 0.012;
      }

      // Pulse halos
      pulseRings.forEach((p, idx) => {
        const scale = 1 + Math.sin(time * 2.5 + idx) * 0.28;
        p.mesh.scale.set(scale, scale, scale);
      });

      // Move photon pulses along flight paths
      arcPoints.forEach(({ curve, particle }, i) => {
        const progress = (time * 0.28 + i * 0.2) % 1;
        const pt = curve.getPoint(progress);
        particle.position.copy(pt);
      });

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      container.removeEventListener("mousedown", handlePointerDown);
      window.removeEventListener("mousemove", handlePointerMove);
      window.removeEventListener("mouseup", handlePointerUp);
      container.removeEventListener("wheel", handleWheel);
      resizeObserver.disconnect();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [onSelect, rotateToRegion, autoRotate, sunMode]);

  return (
    <div className="relative w-full h-full overflow-hidden select-none" ref={containerRef} style={{ minHeight: "420px" }}>
      {/* Top Floating Day/Night Live Status Badges */}
      <div className="absolute top-3 left-3 right-3 z-20 flex items-center justify-between pointer-events-none">
        <div className="flex items-center gap-1.5 overflow-x-auto py-1 scrollbar-none pointer-events-auto">
          {REGION_NODES.map((node) => {
            const info = liveInfo[node.id] || { time: "--:--", phase: "day" };
            const isSelected = selectedRegion === node.id;
            return (
              <button
                key={node.id}
                onClick={() => {
                  onSelect(node.id);
                  rotateToRegion(node.id);
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-mono transition-all border backdrop-blur-md ${
                  isSelected
                    ? "bg-[#0b243d] border-cyan-400 text-cyan-200 shadow-[0_0_15px_rgba(34,211,238,0.4)] scale-105"
                    : "bg-[#040e1be8] border-[#1d435f] text-gray-300 hover:border-cyan-500/70 hover:text-white"
                }`}
                title={`Click to view ${node.label} (${info.phase.toUpperCase()})`}
              >
                <span
                  className="w-2 h-2 rounded-full"
                  style={{
                    backgroundColor:
                      info.phase === "day" ? "#ffc107" : info.phase === "twilight" ? "#ff7043" : "#5c8aff",
                    boxShadow:
                      info.phase === "day"
                        ? "0 0 8px #ffc107"
                        : info.phase === "twilight"
                        ? "0 0 8px #ff7043"
                        : "0 0 8px #5c8aff",
                  }}
                />
                <strong className="text-[10px] tracking-wide text-white">{node.label}</strong>
                <span className="text-cyan-300 font-semibold">{info.time}</span>
                {info.phase === "day" ? (
                  <Sun size={11} className="text-amber-400" />
                ) : info.phase === "twilight" ? (
                  <Sunrise size={11} className="text-orange-400" />
                ) : (
                  <Moon size={10} className="text-blue-300" />
                )}
                <span className="text-[8px] uppercase tracking-wider text-gray-400">
                  {info.phase === "day" ? "Day" : info.phase === "twilight" ? "Dusk" : "Night"}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3D Interactive Floating Tooltip */}
      {hoveredNode && screenCoords && (
        <div
          className="absolute z-30 pointer-events-none transition-all duration-75"
          style={{
            left: `${screenCoords.x + 16}px`,
            top: `${screenCoords.y - 32}px`,
            transform: "translate(0, -50%)",
          }}
        >
          <div className="bg-[#040e1ad9] border border-[#235870] px-3.5 py-2 rounded shadow-2xl backdrop-blur-md">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full animate-ping" style={{ backgroundColor: hoveredNode.color }} />
              <strong className="text-cyan-300 font-mono text-xs tracking-wider">{hoveredNode.label}</strong>
              <span className="text-[10px] font-mono text-amber-300 flex items-center gap-1">
                {liveInfo[hoveredNode.id]?.phase === "day" ? (
                  <Sun size={10} className="text-amber-400" />
                ) : liveInfo[hoveredNode.id]?.phase === "twilight" ? (
                  <Sunrise size={10} className="text-orange-400" />
                ) : (
                  <Moon size={9} className="text-blue-300" />
                )}
                {liveInfo[hoveredNode.id]?.time} (
                {liveInfo[hoveredNode.id]?.phase === "day"
                  ? "DAY"
                  : liveInfo[hoveredNode.id]?.phase === "twilight"
                  ? "SUNSET"
                  : "NIGHT"}
                )
              </span>
            </div>
            <p className="text-[10px] text-gray-300 font-sans mt-0.5">{mockScenarios[hoveredNode.id].shortTitle}</p>
            <span className="text-[9px] font-mono text-cyan-400/80">{hoveredNode.sub}</span>
          </div>
        </div>
      )}

      {/* 3D Globe HUD Status Overlay */}
      <div className="absolute bottom-3 left-3 z-20 flex items-center gap-2 text-[10px] font-mono text-cyan-400 bg-[#030912cc] px-3 py-1.5 border border-[#1b3d52] rounded backdrop-blur">
        <Sparkles size={11} className="text-amber-300" />
        <span>CINEMATIC RAYLEIGH ATMOSPHERE · LIVE DAY/NIGHT TERMINATOR · ROTATE & ZOOM</span>
      </div>

      <div className="absolute bottom-3 right-3 z-20 flex items-center gap-1.5">
        {/* Toggle Real UTC Sun vs Cycle Sun */}
        <button
          onClick={() => setSunMode(sunMode === "live" ? "cycle" : "live")}
          className="bg-[#030d1ccc] hover:bg-[#071c35] text-amber-300 border border-[#214c68] px-2.5 py-1.5 rounded text-[10px] font-mono flex items-center gap-1.5 transition-colors"
          title={sunMode === "live" ? "Switch to Animated Solar Orbit" : "Switch to Real UTC Live Solar Position"}
        >
          <Sun size={11} className={sunMode === "cycle" ? "animate-spin" : ""} style={{ animationDuration: "8s" }} />
          <span>{sunMode === "live" ? "LIVE REAL SUN" : "CYCLE SUN"}</span>
        </button>

        {/* Auto-Spin Toggle */}
        <button
          onClick={() => setUserPaused(!userPaused)}
          className="bg-[#030d1ccc] hover:bg-[#071c35] text-cyan-300 border border-[#214c68] px-2.5 py-1.5 rounded text-[10px] font-mono flex items-center gap-1.5 transition-colors"
          title={autoRotate ? "Pause Globe Rotation" : "Resume Rotation"}
        >
          {autoRotate ? <Pause size={10} /> : <Play size={10} />}
          <span>{autoRotate ? "SPIN" : "STATIC"}</span>
        </button>

        {/* Reset View */}
        <button
          onClick={() => {
            if (cameraRef.current) cameraRef.current.position.set(0, 0, 4.9);
            if (globeGroupRef.current) {
              globeGroupRef.current.rotation.y = -2.9;
              globeGroupRef.current.rotation.x = 0.28;
            }
          }}
          className="bg-[#030d1ccc] hover:bg-[#071c35] text-cyan-300 border border-[#214c68] p-1.5 rounded transition-colors"
          title="Reset Globe View"
        >
          <RotateCcw size={12} />
        </button>
      </div>
    </div>
  );
}
