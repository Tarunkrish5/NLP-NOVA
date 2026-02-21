import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Float, MeshDistortMaterial, MeshWobbleMaterial } from '@react-three/drei';
import * as THREE from 'three';

export const HeartModel = ({ activeLayers, opacities, externalRotation = 0 }: any) => {
    const groupRef = useRef<THREE.Group>(null);
    const pulseAnimationValue = useRef<number>(0);

    useFrame((state) => {
        if (groupRef.current) {
            // Idle Animation: Simulates a beating heart slightly
            pulseAnimationValue.current = Math.sin(state.clock.elapsedTime * 2) * 0.02;
            groupRef.current.scale.setScalar(1 + pulseAnimationValue.current);

            // External Rotation from Hand Tracking/Store
            groupRef.current.rotation.y = externalRotation;
        }
    });

    const neuralGeometry = useMemo(() => {
        const points = [];
        for (let i = 0; i < 200; i++) {
            points.push(new THREE.Vector3(
                (Math.random() - 0.5) * 1.5,
                (Math.random() - 0.5) * 2,
                (Math.random() - 0.5) * 1.5
            ));
        }
        return points;
    }, []);

    return (
        <group ref={groupRef}>
            {/* Vascular Core (Always pulsing) */}
            <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
                <mesh scale={[1, 1.2, 1]}>
                    <sphereGeometry args={[1, 64, 64]} />
                    <MeshDistortMaterial
                        color="#ff3e3e"
                        speed={3}
                        distort={0.4}
                        radius={1}
                        transparent
                        opacity={activeLayers.vascular ? opacities.vascular / 100 : 0}
                    />
                </mesh>
            </Float>

            {/* Skeletal Cages */}
            {activeLayers.skeletal && (
                <group scale={[1.1, 1.1, 1.1]}>
                    <mesh rotation={[Math.PI / 2, 0, 0]}>
                        <torusGeometry args={[1.2, 0.02, 16, 100]} />
                        <meshStandardMaterial color="#ffffff" transparent opacity={opacities.skeletal / 100} />
                    </mesh>
                    <mesh rotation={[0, Math.PI / 2, 0]}>
                        <torusGeometry args={[1.3, 0.015, 16, 100]} />
                        <meshStandardMaterial color="#00d2ff" transparent opacity={opacities.skeletal / 100} />
                    </mesh>
                </group>
            )}

            {/* Neural Streams */}
            {activeLayers.nervous && (
                <group>
                    {neuralGeometry.map((pos, i) => (
                        <mesh key={i} position={pos}>
                            <sphereGeometry args={[0.01, 8, 8]} />
                            <meshBasicMaterial color="#00d2ff" transparent opacity={opacities.nervous / 200} />
                        </mesh>
                    ))}
                    <mesh scale={[1.05, 1.25, 1.05]}>
                        <sphereGeometry args={[1, 32, 32]} />
                        <MeshWobbleMaterial
                            color="#00d2ff"
                            speed={2}
                            factor={0.1}
                            transparent
                            opacity={opacities.nervous / 300}
                            wireframe
                        />
                    </mesh>
                </group>
            )}

            {/* Muscular Layer */}
            {activeLayers.muscular && (
                <mesh scale={[1.02, 1.22, 1.02]}>
                    <sphereGeometry args={[1, 32, 32]} />
                    <meshStandardMaterial
                        color="#8a1a1a"
                        transparent
                        opacity={opacities.muscular / 100}
                        wireframe
                        wireframeLinewidth={1}
                    />
                </mesh>
            )}
        </group>
    );
};
