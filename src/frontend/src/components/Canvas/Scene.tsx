import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import { HeartModel } from '../HeartModel';
import { useStore } from '../../store';

export const Scene = ({ activeLayers, opacities }: any) => {
    const gesture = useStore((state) => state.gesture);
    const coords = useStore((state) => state.coords);
    const rotation = useStore((state) => state.rotation);

    return (
        <Canvas className="w-full h-full">
            <PerspectiveCamera makeDefault position={[0, 0, 8]} />
            <OrbitControls
                enableZoom={gesture === 'PALM_OPEN'}
                enableRotate={gesture === 'PINCH'}
                rotateSpeed={0.5}
            />
            <ambientLight intensity={0.2} />
            <pointLight
                position={[(coords.x - 0.5) * 20, -(coords.y - 0.5) * 20, 10]}
                intensity={1.5}
                color="#00d2ff"
            />
            <spotLight position={[-10, 10, 10]} angle={0.15} penumbra={1} intensity={1} color="#ff3e3e" />
            <HeartModel
                activeLayers={activeLayers}
                opacities={opacities}
                externalRotation={rotation}
            />
        </Canvas>
    );
};
