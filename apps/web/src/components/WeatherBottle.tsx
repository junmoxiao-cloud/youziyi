import React, { useRef, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, MeshTransmissionMaterial, Sparkles } from '@react-three/drei';
import * as THREE from 'three';

interface WeatherBottleProps {
  weatherType: string;
}

function SimpleCloud({ position, opacity }: { position: [number, number, number], opacity: number }) {
  return (
    <group position={position}>
      <mesh position={[-0.5, 0, 0]}>
        <sphereGeometry args={[0.5, 16, 16]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={opacity} />
      </mesh>
      <mesh position={[0.5, 0, 0]}>
        <sphereGeometry args={[0.5, 16, 16]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={opacity} />
      </mesh>
      <mesh position={[0, 0.4, 0]}>
        <sphereGeometry args={[0.6, 16, 16]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={opacity} />
      </mesh>
    </group>
  );
}

function WeatherEffects({ weatherType }: { weatherType: string }) {
  const groupRef = useRef<THREE.Group>(null);

  // 严格执行 3D 内存回收
  useEffect(() => {
    const group = groupRef.current;
    return () => {
      if (group) {
        group.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            if (child.geometry) {
              child.geometry.dispose();
            }
            if (child.material) {
              if (Array.isArray(child.material)) {
                child.material.forEach((m) => m.dispose());
              } else {
                child.material.dispose();
              }
            }
          }
        });
      }
    };
  }, []);

  switch (weatherType) {
    case 'snowy':
      return (
        <group ref={groupRef}>
          <Sparkles count={100} scale={2.5} size={2} speed={0.4} opacity={0.8} color="#F9F6F0" />
        </group>
      );
    case 'rainy':
      return (
        <group ref={groupRef}>
          <Sparkles count={150} scale={2.5} size={1} speed={1.5} opacity={0.6} color="#96C7A7" />
          <SimpleCloud position={[0, 1.5, 0]} opacity={0.5} />
        </group>
      );
    case 'cloudy':
      return (
        <group ref={groupRef}>
          <SimpleCloud position={[0, 1, 0]} opacity={0.8} />
          <SimpleCloud position={[0, -0.5, 0]} opacity={0.4} />
        </group>
      );
    case 'sunny':
    default:
      return (
        <group ref={groupRef}>
          <pointLight position={[0, 2, 0]} intensity={2} color="#D25642" />
          <mesh position={[0, 0, 0]}>
            <sphereGeometry args={[0.5, 32, 32]} />
            <meshBasicMaterial color="#D25642" />
          </mesh>
          <Sparkles count={50} scale={2} size={1.5} speed={0.2} opacity={0.5} color="#F0EBE1" />
        </group>
      );
  }
}

function Bottle() {
  const bottleRef = useRef<THREE.Mesh>(null);

  // 严格执行 3D 内存回收
  useEffect(() => {
    const bottle = bottleRef.current;
    return () => {
      if (bottle) {
        if (bottle.geometry) {
          bottle.geometry.dispose();
        }
        if (bottle.material) {
          if (Array.isArray(bottle.material)) {
            bottle.material.forEach((m) => m.dispose());
          } else {
            bottle.material.dispose();
          }
        }
      }
    };
  }, []);

  return (
    <mesh ref={bottleRef}>
      <cylinderGeometry args={[1.5, 1.5, 4, 32]} />
      <MeshTransmissionMaterial 
        color="#E0F0E9"
        thickness={0.5}
        roughness={0.1}
        transmission={1}
        ior={1.5}
        chromaticAberration={0.04}
        backside
      />
    </mesh>
  );
}

export default function WeatherBottle({ weatherType }: WeatherBottleProps) {
  // 卸载整个 Canvas 时也会触发 R3F 的自动清理，加上我们的手动 dispose 更安全
  return (
    <div className="absolute inset-0 z-0 pointer-events-auto">
      <Canvas camera={{ position: [0, 0, 8], fov: 45 }}>
        <ambientLight intensity={0.5} />
        <directionalLight position={[5, 5, 5]} intensity={1} />
        <Bottle />
        <WeatherEffects weatherType={weatherType} />
        <OrbitControls enableZoom={false} autoRotate autoRotateSpeed={1} />
      </Canvas>
    </div>
  );
}
