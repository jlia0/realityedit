/*
Auto-generated by: https://github.com/pmndrs/gltfjsx
*/

import React, {useLayoutEffect, useRef, useState} from "react";
import {CubeCamera, useBoxProjectedEnv, useGLTF, useSelect} from "@react-three/drei";
import {useControls} from "leva";
import THREE from "three";
import {applyProps} from "@react-three/fiber";
import {useStoreControl} from "../../store/useStoreControl";

export function Model(props) {
    const { nodes, materials } = useGLTF("/classroom.gltf");

    return (
        <group {...props} dispose={null}>
            <mesh
                castShadow
                receiveShadow
                geometry={nodes.mesh_0.geometry}
                material={materials.material_0}
            />
        </group>
    );
}

useGLTF.preload("/classroom.gltf");

export function Lab(props) {
    const { scene, nodes } = useGLTF('/classroom.gltf')

    const setTarget = useStoreControl((state) => state.setTarget)

    useLayoutEffect(() => {
        scene.traverse((o) => {
            if (o.isMesh) {
                // if (o === nodes.GymFloor_ParquetShader_0) o.parent.remove(o)
                // else
                    applyProps(o, { castShadow: true, receiveShadow: true, 'material-envMapIntensity': 0.1 })
            }
        })
    }, [])

    return <primitive onClick={(e) => setTarget(e.object)} object={scene} {...props} />
}