import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Sky } from '@react-three/drei';
import * as THREE from 'three';
import Avatar from './Avatar';

/* ── Fireflies ─────────────────────────────────────────── */
function Fireflies({ count = 60 }) {
  const mesh = useRef();
  const dummy = useMemo(() => new THREE.Object3D(), []);

  const particles = useMemo(() => {
    const temp = [];
    for (let i = 0; i < count; i++) {
      temp.push({
        x: (Math.random() - 0.5) * 30,
        y: Math.random() * 8 + 1,
        z: (Math.random() - 0.5) * 30,
        speed: 0.3 + Math.random() * 0.5,
        offset: Math.random() * Math.PI * 2,
        scale: 0.04 + Math.random() * 0.06,
      });
    }
    return temp;
  }, [count]);

  useFrame((state) => {
    const time = state.clock.elapsedTime;
    particles.forEach((p, i) => {
      dummy.position.set(
        p.x + Math.sin(time * p.speed + p.offset) * 1.5,
        p.y + Math.sin(time * p.speed * 0.7 + p.offset) * 0.8,
        p.z + Math.cos(time * p.speed + p.offset) * 1.5
      );
      const pulse = 0.8 + Math.sin(time * 3 + p.offset) * 0.2;
      dummy.scale.setScalar(p.scale * pulse);
      dummy.updateMatrix();
      mesh.current.setMatrixAt(i, dummy.matrix);
    });
    mesh.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={mesh} args={[null, null, count]}>
      <sphereGeometry args={[1, 8, 8]} />
      <meshBasicMaterial color="#aaff44" transparent opacity={0.85} />
    </instancedMesh>
  );
}

/* ── Tree ──────────────────────────────────────────────── */
function Tree({ position, scale = 1, swayOffset = 0 }) {
  const groupRef = useRef();

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    groupRef.current.rotation.z = Math.sin(t * 0.5 + swayOffset) * 0.03;
    groupRef.current.rotation.x = Math.cos(t * 0.3 + swayOffset) * 0.02;
  });

  return (
    <group ref={groupRef} position={position} scale={[scale, scale, scale]}>
      {/* Trunk */}
      <mesh position={[0, 1.2, 0]} castShadow>
        <cylinderGeometry args={[0.15, 0.25, 2.4, 8]} />
        <meshStandardMaterial color="#5D4037" roughness={0.9} />
      </mesh>
      {/* Canopy layers */}
      <mesh position={[0, 2.8, 0]} castShadow>
        <sphereGeometry args={[1.0, 12, 12]} />
        <meshStandardMaterial color="#2E7D32" roughness={0.8} />
      </mesh>
      <mesh position={[0, 3.5, 0]} castShadow>
        <sphereGeometry args={[0.7, 12, 12]} />
        <meshStandardMaterial color="#388E3C" roughness={0.8} />
      </mesh>
    </group>
  );
}

/* ── Flower ─────────────────────────────────────────────── */
function Flower({ position, color = '#E91E63' }) {
  const ref = useRef();
  useFrame((state) => {
    ref.current.rotation.y = state.clock.elapsedTime * 0.5;
  });
  return (
    <group position={position} ref={ref}>
      <mesh position={[0, 0.15, 0]}>
        <cylinderGeometry args={[0.02, 0.02, 0.3, 6]} />
        <meshStandardMaterial color="#4CAF50" />
      </mesh>
      <mesh position={[0, 0.35, 0]}>
        <sphereGeometry args={[0.08, 8, 8]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.3} />
      </mesh>
    </group>
  );
}

/* ── Castle ─────────────────────────────────────────────── */
function Castle({ position }) {
  return (
    <group position={position}>
      {/* Main Keep */}
      <mesh position={[0, 2.5, 0]} castShadow receiveShadow>
        <boxGeometry args={[5, 5, 4]} />
        <meshStandardMaterial color="#78909C" roughness={0.7} />
      </mesh>
      {/* Castle gate */}
      <mesh position={[0, 1.0, 2.01]} castShadow>
        <boxGeometry args={[1.2, 2.0, 0.1]} />
        <meshStandardMaterial color="#3E2723" roughness={0.9} />
      </mesh>
      {/* Gate arch */}
      <mesh position={[0, 2.2, 2.01]} castShadow>
        <cylinderGeometry args={[0.6, 0.6, 0.1, 16, 1, false, 0, Math.PI]} />
        <meshStandardMaterial color="#3E2723" roughness={0.9} />
      </mesh>
      {/* Towers */}
      <CastleTower position={[-2.8, 0, -2.2]} />
      <CastleTower position={[2.8, 0, -2.2]} />
      <CastleTower position={[-2.8, 0, 2.2]} />
      <CastleTower position={[2.8, 0, 2.2]} />
      {/* Battlements */}
      {[-1.5, 0, 1.5].map((x, i) => (
        <mesh key={i} position={[x, 5.3, 0]} castShadow>
          <boxGeometry args={[0.5, 0.6, 4.5]} />
          <meshStandardMaterial color="#90A4AE" roughness={0.7} />
        </mesh>
      ))}
      {/* Banner */}
      <mesh position={[0, 6.5, 0]}>
        <cylinderGeometry args={[0.05, 0.05, 2.5, 8]} />
        <meshStandardMaterial color="#5D4037" />
      </mesh>
      <mesh position={[0.4, 6.8, 0]}>
        <planeGeometry args={[0.8, 0.5]} />
        <meshStandardMaterial color="#FFD700" side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

function CastleTower({ position }) {
  return (
    <group position={position}>
      <mesh castShadow receiveShadow>
        <cylinderGeometry args={[0.7, 0.8, 6, 16]} />
        <meshStandardMaterial color="#607D8B" roughness={0.6} />
      </mesh>
      <mesh position={[0, 3.5, 0]} castShadow>
        <coneGeometry args={[1.0, 2.0, 16]} />
        <meshStandardMaterial color="#1565C0" roughness={0.4} />
      </mesh>
      {/* Tower window */}
      <mesh position={[0, 1.5, 0.75]}>
        <boxGeometry args={[0.3, 0.5, 0.1]} />
        <meshBasicMaterial color="#FFF9C4" />
      </mesh>
    </group>
  );
}

/* ── Grass Ground ──────────────────────────────────────── */
function GrassGround() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
      <planeGeometry args={[80, 80]} />
      <meshStandardMaterial color="#4CAF50" roughness={1} />
    </mesh>
  );
}

/* ── Camera Follow Mouse ───────────────────────────────── */
function CameraRig() {
  const { camera } = useThree();

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    // Gentle auto-drift + mouse influence
    const px = state.pointer.x * 1.5;
    const py = state.pointer.y * 0.8;
    camera.position.x = THREE.MathUtils.lerp(camera.position.x, px * 2 + Math.sin(t * 0.15) * 0.5, 0.02);
    camera.position.y = THREE.MathUtils.lerp(camera.position.y, 6 + py * 1.5, 0.02);
    camera.lookAt(0, 2, -5);
  });

  return null;
}

/* ── Main Scene Export ─────────────────────────────────── */
export default function CastleScene({ isFocused }) {
  const treePositions = useMemo(() => [
    [-8, 0, -4], [-10, 0, 2], [-6, 0, 6], [-12, 0, -8],
    [8, 0, -3], [10, 0, 4], [7, 0, 8], [12, 0, -6],
    [-5, 0, -10], [5, 0, -12], [-14, 0, 5], [14, 0, 0],
    [-3, 0, -14], [3, 0, 14], [-9, 0, 10], [11, 0, 9],
  ], []);

  const flowerPositions = useMemo(() => [
    [-3, 0.01, 3], [-4, 0.01, 5], [3, 0.01, 4], [5, 0.01, 2],
    [-2, 0.01, 7], [4, 0.01, 7], [-6, 0.01, 3], [6, 0.01, 5],
    [-1, 0.01, 5], [2, 0.01, 6], [0, 0.01, 8], [-5, 0.01, 8],
  ], []);

  const flowerColors = ['#E91E63', '#FF5722', '#FFC107', '#9C27B0', '#FF4081', '#FFEB3B'];

  return (
    <Canvas shadows camera={{ position: [0, 6, 18], fov: 50 }}>
      {/* Sky */}
      <Sky sunPosition={[80, 30, -50]} turbidity={0.4} rayleigh={0.4} mieCoefficient={0.005} mieDirectionalG={0.8} />
      <fog attach="fog" args={['#87CEEB', 25, 60]} />

      {/* Lighting */}
      <ambientLight intensity={0.5} color="#FFF8E1" />
      <directionalLight
        position={[15, 25, 10]}
        intensity={1.5}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-far={60}
        shadow-camera-left={-20}
        shadow-camera-right={20}
        shadow-camera-top={20}
        shadow-camera-bottom={-20}
        color="#FFF3E0"
      />
      <hemisphereLight skyColor="#87CEEB" groundColor="#4CAF50" intensity={0.3} />

      {/* Ground */}
      <GrassGround />

      {/* Castle */}
      <Castle position={[0, 0, -12]} />

      {/* Trees */}
      {treePositions.map((pos, i) => (
        <Tree key={i} position={pos} scale={0.8 + Math.random() * 0.6} swayOffset={i * 0.7} />
      ))}

      {/* Flowers */}
      {flowerPositions.map((pos, i) => (
        <Flower key={i} position={pos} color={flowerColors[i % flowerColors.length]} />
      ))}

      {/* Fireflies */}
      <Fireflies count={60} />

      {/* Avatar */}
      <Avatar position={[3.5, 0, 4]} isFocused={isFocused} />

      {/* Camera movement */}
      <CameraRig />
    </Canvas>
  );
}
