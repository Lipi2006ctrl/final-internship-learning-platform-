import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';

export default function Avatar({ position = [0, 0, 0], isFocused = false }) {
  const groupRef = useRef();
  const rightArmRef = useRef();
  const leftArmRef = useRef();
  const headRef = useRef();

  useFrame((state) => {
    const time = state.clock.elapsedTime;

    // Idle breathing
    if (headRef.current) {
      headRef.current.position.y = 2.4 + Math.sin(time * 2) * 0.04;
    }

    if (isFocused) {
      // Wave animation — right arm swings up and down
      if (rightArmRef.current) {
        rightArmRef.current.rotation.z = Math.PI / 2 + Math.sin(time * 4) * 0.4;
        rightArmRef.current.rotation.x = 0;
      }
      if (leftArmRef.current) {
        leftArmRef.current.rotation.z = -Math.PI / 8;
      }
      // Slight head tilt when waving
      if (headRef.current) {
        headRef.current.rotation.z = Math.sin(time * 3) * 0.1;
      }
    } else {
      // Normal idle
      if (rightArmRef.current) {
        rightArmRef.current.rotation.z = Math.PI / 8;
        rightArmRef.current.rotation.x = Math.sin(time * 1.5) * 0.08;
      }
      if (leftArmRef.current) {
        leftArmRef.current.rotation.z = -Math.PI / 8;
        leftArmRef.current.rotation.x = Math.sin(time * 1.5 + 1) * 0.08;
      }
      if (headRef.current) {
        headRef.current.rotation.z = 0;
      }
    }
  });

  return (
    <group ref={groupRef} position={position} scale={[0.9, 0.9, 0.9]}>
      {/* Legs */}
      <mesh position={[-0.18, 0.5, 0]} castShadow>
        <cylinderGeometry args={[0.12, 0.14, 1.0, 8]} />
        <meshStandardMaterial color="#1a237e" roughness={0.8} />
      </mesh>
      <mesh position={[0.18, 0.5, 0]} castShadow>
        <cylinderGeometry args={[0.12, 0.14, 1.0, 8]} />
        <meshStandardMaterial color="#1a237e" roughness={0.8} />
      </mesh>

      {/* Body / Tunic */}
      <mesh position={[0, 1.5, 0]} castShadow>
        <cylinderGeometry args={[0.35, 0.45, 1.2, 12]} />
        <meshStandardMaterial color="#1B5E20" roughness={0.7} />
      </mesh>
      {/* Belt */}
      <mesh position={[0, 1.05, 0]} castShadow>
        <torusGeometry args={[0.42, 0.04, 8, 24]} />
        <meshStandardMaterial color="#FFD700" metalness={0.7} roughness={0.3} />
      </mesh>

      {/* Head */}
      <mesh ref={headRef} position={[0, 2.4, 0]} castShadow>
        <sphereGeometry args={[0.35, 16, 16]} />
        <meshStandardMaterial color="#FFCCBC" roughness={0.6} />
        {/* Eyes */}
        <mesh position={[-0.1, 0.05, 0.3]}>
          <sphereGeometry args={[0.05, 8, 8]} />
          <meshBasicMaterial color="#263238" />
        </mesh>
        <mesh position={[0.1, 0.05, 0.3]}>
          <sphereGeometry args={[0.05, 8, 8]} />
          <meshBasicMaterial color="#263238" />
        </mesh>
        {/* Smile */}
        <mesh position={[0, -0.08, 0.32]} rotation={[0, 0, 0]}>
          <torusGeometry args={[0.06, 0.015, 8, 12, Math.PI]} />
          <meshBasicMaterial color="#D32F2F" />
        </mesh>
        {/* Crown */}
        <mesh position={[0, 0.38, 0]}>
          <cylinderGeometry args={[0.2, 0.28, 0.2, 6]} />
          <meshStandardMaterial color="#FFD700" metalness={0.8} roughness={0.2} />
        </mesh>
        {/* Crown jewel */}
        <mesh position={[0, 0.52, 0.15]}>
          <sphereGeometry args={[0.05, 8, 8]} />
          <meshStandardMaterial color="#E91E63" emissive="#E91E63" emissiveIntensity={0.5} />
        </mesh>
      </mesh>

      {/* Right Arm */}
      <group ref={rightArmRef} position={[0.5, 1.8, 0]}>
        <mesh position={[0, -0.4, 0]} castShadow>
          <cylinderGeometry args={[0.1, 0.08, 0.8, 8]} />
          <meshStandardMaterial color="#1B5E20" roughness={0.7} />
        </mesh>
        {/* Hand */}
        <mesh position={[0, -0.85, 0]}>
          <sphereGeometry args={[0.09, 8, 8]} />
          <meshStandardMaterial color="#FFCCBC" />
        </mesh>
      </group>

      {/* Left Arm */}
      <group ref={leftArmRef} position={[-0.5, 1.8, 0]}>
        <mesh position={[0, -0.4, 0]} castShadow>
          <cylinderGeometry args={[0.1, 0.08, 0.8, 8]} />
          <meshStandardMaterial color="#1B5E20" roughness={0.7} />
        </mesh>
        {/* Hand */}
        <mesh position={[0, -0.85, 0]}>
          <sphereGeometry args={[0.09, 8, 8]} />
          <meshStandardMaterial color="#FFCCBC" />
        </mesh>
      </group>
    </group>
  );
}
