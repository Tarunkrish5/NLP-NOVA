import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Float, MeshDistortMaterial, MeshWobbleMaterial, Torus } from '@react-three/drei';
import * as THREE from 'three';

export const HeartModel = ({ activeLayers, opacities }: any) => {
    const groupRef = useRef<THREE.Group>(null);
    const pulseRef = useRef<THREE.Mesh>(null);

    // Procedural "Veins" for nervous system
    const nervousCurve = useMemo(() => {
        const points = [];
        for (let i = 0; i < 40; i++) {
            points.push(new THREE.Vector3(
                Math.sin(i * 0.5) * 1.5,
                (i - 20) * 0.1,
                Math.cos(i * 0.5) * 1.5
            ));
        }
        return new THREE.CatmullRomCurve3(points);
    }, []);

    useFrame((state) => {
        if (groupRef.current) {
            groupRef.current.rotation.y += 0.005;
            groupRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.5) * 0.1;
        }
        if (pulseRef.current) {
            const s = 1 + Math.sin(state.clock.elapsedTime * 4) * 0.05;
            pulseRef.current.scale.set(s, s, s);
        }
    });

    return (
        <group ref={groupRef} scale={1.8}>
            {/* VASCULAR LAYER - The Core Pulse */}
            {activeLayers.vascular && (
                <Float speed={2} rotationIntensity={0.5} floatIntensity={1}>
                    <mesh ref={pulseRef}>
                        <sphereGeometry args={[0.9, 64, 64]} />
                        <MeshDistortMaterial
                            color="#ff1a1a"
                            speed={4}
                            distort={0.3}
                            radius={0.8}
                            transparent
                            opacity={opacities.vascular / 100}
                            emissive="#ff0000"
                            emissiveIntensity={1.5}
                        />
                    </mesh>
                    {/* Inner glowing core */}
                    <mesh scale={0.4}>
                        <sphereGeometry args={[1, 32, 32]} />
                        <meshBasicMaterial color="#ff0000" transparent opacity={0.5} />
                    </mesh>
                </Float>
            )}

            {/* SKELETAL LAYER - Structural Projection */}
            {activeLayers.skeletal && (
                <group>
                    <mesh>
                        <icosahedronGeometry args={[1.6, 3]} />
                        <meshBasicMaterial
                            color="#60a5fa"
                            wireframe
                            transparent
                            opacity={(opacities.skeletal / 100) * 0.5}
                        />
                    </mesh>
                    {/* Second counter-rotating cage */}
                    <mesh rotation={[0, Math.PI / 4, 0]}>
                        <icosahedronGeometry args={[1.58, 2]} />
                        <meshBasicMaterial
                            color="#ffffff"
                            wireframe
                            transparent
                            opacity={(opacities.skeletal / 100) * 0.2}
                        />
                    </mesh>
                </group>
            )}

            {/* NERVOUS LAYER - Digital Neural Path */}
            {activeLayers.nervous && (
                <group>
                    {[...Array(6)].map((_, j) => (
                        <group key={j} rotation={[0, (j * Math.PI) / 3, 0]}>
                            <mesh>
                                <tubeGeometry args={[nervousCurve, 40, 0.015, 8, false]} />
                                <meshBasicMaterial
                                    color="#00f2ff"
                                    transparent
                                    opacity={opacities.nervous / 100}
                                />
                            </mesh>
                            {/* Neural pulses */}
                            <Torus args={[1.4, 0.01, 16, 50]} rotation={[Math.PI / 2, 0, 0]}>
                                <MeshWobbleMaterial color="#00d2ff" factor={1} speed={2} transparent opacity={0.3} />
                            </Torus>
                        </group>
                    ))}
                </group>
            )}

            {/* MUSCULAR LAYER - Tissue Density */}
            {activeLayers.muscular && (
                <mesh>
                    <sphereGeometry args={[1.2, 64, 64]} />
                    <meshStandardMaterial
                        color="#450a0a"
                        roughness={0.2}
                        metalness={0.8}
                        transparent
                        opacity={opacities.muscular / 100}
                        flatShading={false}
                    />
                </mesh>
            )}
        </group>
    );
};
