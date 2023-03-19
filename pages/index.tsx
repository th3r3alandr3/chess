import {Canvas} from '@react-three/fiber';
import React, {Suspense, useRef} from 'react';
import {Environment, CameraControls, Loader} from '@react-three/drei';
import GUI from "../components/GUI";

export default function Home() {
  const controls = useRef<any>();
  return (
      <>
        <Canvas
            camera={{
              fov: 75,
              near: 0.1,
              far: 1000,
              position: [0, 5, 6],
            }}
        >
          <Suspense fallback={null}>
            <ambientLight intensity={0.5}/>
            <pointLight
                position={[-10, 0, -20]}
                color="white"
                intensity={1}
            />
            <pointLight
                position={[0, -10, 0]}
                intensity={1}
            />
            <Environment preset="studio"/>
            <CameraControls
                minDistance={5}
                maxDistance={15}
                maxPolarAngle={Math.PI / 2}
                ref={controls}
            />
            <GUI controls={controls}/>
          </Suspense>
        </Canvas>
        <Loader/>
      </>
  );
}
