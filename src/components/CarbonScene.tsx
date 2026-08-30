import { Canvas, useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import type { Group, Mesh } from "three";

function FloatingLeafOrb({
  position,
  scale,
  color,
  speed,
  shape,
}: {
  position: [number, number, number];
  scale: number;
  color: string;
  speed: number;
  shape: "sphere" | "torus" | "icosa";
}) {
  const ref = useRef<Mesh>(null);
  const offset = useMemo(() => Math.random() * Math.PI * 2, []);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (!ref.current) return;
    ref.current.position.y = position[1] + Math.sin(t * speed + offset) * 0.45;
    ref.current.rotation.x = t * speed * 0.4 + offset;
    ref.current.rotation.y = t * speed * 0.6;
  });

  return (
    <mesh ref={ref} position={position} scale={scale}>
      {shape === "sphere" && <sphereGeometry args={[1, 48, 48]} />}
      {shape === "torus" && <torusGeometry args={[0.85, 0.3, 32, 96]} />}
      {shape === "icosa" && <icosahedronGeometry args={[1, 1]} />}
      <meshStandardMaterial color={color} roughness={0.22} metalness={0.65} />
    </mesh>
  );
}

function Cluster() {
  const group = useRef<Group>(null);
  useFrame(({ clock, pointer }) => {
    if (!group.current) return;
    group.current.rotation.y = clock.getElapsedTime() * 0.12 + pointer.x * 0.35;
    group.current.rotation.x = pointer.y * 0.18;
  });

  return (
    <group ref={group}>
      <FloatingLeafOrb position={[-2.6, 0.4, -1]} scale={1.05} color="#3fd98a" speed={0.7} shape="icosa" />
      <FloatingLeafOrb position={[2.5, -0.5, -0.5]} scale={0.9} color="#e8c87a" speed={0.55} shape="torus" />
      <FloatingLeafOrb position={[0.2, 1.2, -2]} scale={1.5} color="#1f8a5c" speed={0.4} shape="sphere" />
      <FloatingLeafOrb position={[1.2, 1.5, 1.2]} scale={0.45} color="#8ef0bd" speed={0.9} shape="sphere" />
      <FloatingLeafOrb position={[-1.4, -1.4, 1]} scale={0.55} color="#e8c87a" speed={1.05} shape="icosa" />
      <FloatingLeafOrb position={[-3.4, 1.8, 0.6]} scale={0.35} color="#3fd98a" speed={1.3} shape="sphere" />
    </group>
  );
}

export default function CarbonScene() {
  return (
    <Canvas
      dpr={[1, 1.8]}
      camera={{ position: [0, 0, 7], fov: 45 }}
      gl={{ antialias: true, alpha: true }}
      style={{ position: "absolute", inset: 0, pointerEvents: "none" }}
    >
      <ambientLight intensity={0.6} />
      <directionalLight position={[4, 6, 5]} intensity={2.1} color="#ffffff" />
      <pointLight position={[-6, -3, 2]} intensity={30} color="#3fd98a" />
      <pointLight position={[6, 4, -2]} intensity={22} color="#e8c87a" />
      <Cluster />
    </Canvas>
  );
}
