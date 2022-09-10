import './App.css';
import React, {
    createRef,
    forwardRef,
    Fragment,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState
} from "react";
import {Canvas, extend, useFrame, useThree} from "@react-three/fiber";
import {button, folder, useControls} from 'leva'
import {
    Center,
    Select as DreiSelect,
    MapControls,
    OrbitControls,
    RoundedBox,
    Stats,
    TransformControls,
    GizmoHelper,
    GizmoViewport, Html, Icosahedron, Text, Billboard, QuadraticBezierLine, Ring, Sphere, Trail, Effects, Environment
} from "@react-three/drei";
import {BufferAttribute, Mesh} from "three";
import * as THREE from "three";
import {
    dataCallback,
    fs,
} from "./static/KinectStream";
import state from './static/state';
import {Bloom, EffectComposer, Outline, Selection, Select, SelectiveBloom} from "@react-three/postprocessing";

import {AfterimagePass} from 'three-stdlib'

import {TorusComponent} from "./Components/Torus";
import {
    dynamicSpheres,
    dynamicStore,
    resetDynamicSpheres,
    useStoreColor, useStoreColorD,
    useStoreControl, useStoreDepthD, useStorePose,
    useStoreTracking
} from "./store/useStoreControl";
import Iframe from "react-iframe";
import {DraggableLine} from "./Components/DraggableLine";
import {Panel} from "./utils/MultiLeva";
import useEyeDropper from 'use-eye-dropper'
import {ClickableSphere} from "./Components/ClickableSphere";
import {Angle} from "./Components/Angle";
import create from "zustand";
import {Label} from "./Components/Label";
import {getRandomInt, readImage, renderBGRA32ColorFrame} from "./utils/HelperFunctions";
import {Distance} from "./Components/Distance";
import {Pos} from "./Components/Pos";
import {Marker} from "./Components/Marker";
import {FaMapMarkerAlt} from 'react-icons/fa'
import {LightSaber} from "./Components/Models/LightSaber";
// import {PoseTracking} from "./utils/Pose";
import {Post} from "./Components/AfterImage";
import * as PoseMediaPipe from "@mediapipe/pose";

// let cv = opencv
// let kinect = KinectAzure


extend({EffectComposer, AfterimagePass})


const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
};

const pose = new PoseMediaPipe.Pose({
    locateFile: (file) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`;
    }
});

const DEPTH_WIDTH = 640;
const DEPTH_HEIGHT = 576;

const numPoints = DEPTH_WIDTH * DEPTH_HEIGHT;


function TrailScene() {
    const sphere = useRef(null);
    const [text, setText] = useState('(x,y,z)');

    useFrame(({clock}) => {
        const t = clock.getElapsedTime()

        sphere.current.position.x = Math.sin(t) * 3
        sphere.current.position.y = Math.cos(t) * 3
        setText(`(${(Math.sin(t) * 3).toFixed(2)},${(Math.cos(t) * 3).toFixed(2)},100)`)
    })

    return (
        <>
            <Trail
                width={2}
                length={8}
                color={'#F8D628'}
                attenuation={(t) => {
                    return t * t
                }}
            >
                {/*<Sphere ref={sphere} args={[0.2, 32, 32]} position-x={0} position-y={3}>*/}
                {/*    <meshNormalMaterial/>*/}
                {/*</Sphere>*/}

                {/*<group ref={sphere}>*/}
                {/*    <Html scale={1} transform sprite>*/}
                {/*        <div className="annotation" style={{background: 'green', color: 'white'}}>*/}
                {/*            {text}*/}
                {/*        </div>*/}
                {/*    </Html>*/}
                {/*</group>*/}

            </Trail>
        </>
    )
}


function App() {
    const {target, setTarget} = useStoreControl();
    const [selected, setSelected] = useState([])

    const {open, close, isSupported} = useEyeDropper()
    const [error, setError] = useState()


    const [pos, setPos] = useState([])
    const [dist, setDist] = useState([])
    const [angles, setAngles] = useState([])
    const [labels, setLabels] = useState([])
    const [torus, setTorus] = useState([])
    const [mLines, setMLines] = useState([])
    const [marker, setMarker] = useState([])


    const lightRef = useRef()
    const refPoints = useRef();
    const canvasRef = useRef()
    const bindingOpions = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40]


    const {positions, addTracker, updateTracker, deleteAll} = useStoreTracking()
    const {image, setImage} = useStorePose()
    const {colors, addColor} = useStoreColor()

    const sphereRefs = useRef(bindingOpions.map(() => createRef()))

    let flag = false

    function onResults(results) {
        if (results) {
            const landmarks = results.poseLandmarks
            if (landmarks !== undefined && landmarks) {

                // sphereRefs.current.map((ref) => console.log(ref))

                for (let i = 0; i < landmarks.length; i++) {
                    const landmark = landmarks[i]
                    if (landmark.y <= 1 && landmark.visibility >= 0.65) {
                        const x = Math.floor(landmark.x * DEPTH_WIDTH)
                        const y = Math.floor(landmark.y * DEPTH_HEIGHT)
                        const pos = Math.floor(DEPTH_WIDTH * y + x)
                        const pos_arr = refPoints.current.geometry.getAttribute('position').array
                        const actualX = (pos % DEPTH_WIDTH) - DEPTH_WIDTH * 0.5;
                        const actualY = DEPTH_HEIGHT / 2 - Math.floor(pos / DEPTH_WIDTH);
                        const z = pos_arr[pos * 3 + 2]
                        sphereRefs.current[i].current.position.x = actualX
                        sphereRefs.current[i].current.position.y = actualY
                        sphereRefs.current[i].current.position.z = z

                        // console.log(sphereRefs.current[i])


                    }

                }
            }
        }
    }

    async function onTimerTick() {
        try {
            await pose.send({image: canvasRef.current})
        } catch (e) {
            console.log(e)
        }
    }

    useEffect(() => {
        // readImage('pool-1').then((rst) => {
        //     let pointIndex = 0;
        //
        //     let newColorData = rst[0];
        //     let newDepthData = rst[1];
        //
        //     console.log(newColorData)
        //
        //     // setImage(newColorData)
        //
        //     let pos = [];
        //     let col = [];
        //
        //     for (let i = 0; i < numPoints; i++) {
        //         const x = (i % DEPTH_WIDTH) - DEPTH_WIDTH * 0.5;
        //         const y = DEPTH_HEIGHT / 2 - Math.floor(i / DEPTH_WIDTH);
        //         pos.push(x);
        //         pos.push(y);
        //         pos.push(0);
        //
        //         col.push(0);
        //         col.push(0);
        //         col.push(0);
        //     }
        //
        //     for (let i = 0; i < newDepthData.length; i += 2) {
        //
        //         const depthValue = newDepthData[i + 1] << 8 | newDepthData[i];
        //
        //         const b = newColorData[pointIndex * 4 + 0];
        //         const g = newColorData[pointIndex * 4 + 1];
        //         const r = newColorData[pointIndex * 4 + 2];
        //
        //         if (depthValue > 10 && depthValue < 5000) {
        //             pos[pointIndex * 3 + 2] = depthValue / 3;
        //         } else {
        //             pos[pointIndex * 3 + 2] = Number.MAX_VALUE;
        //         }
        //
        //         col[pointIndex * 3 + 0] = r / 255;
        //         col[pointIndex * 3 + 1] = g / 255;
        //         col[pointIndex * 3 + 2] = b / 255;
        //
        //         pointIndex++;
        //     }
        //     state.points = new Float32Array([...pos]);
        //     state.colors = new Float32Array([...col]);
        //     state.requireUpdate = true;
        //
        // })

        try {
            let pos = [];
            let col = [];

            console.log('arr')

            for (let i = 0; i < numPoints; i++) {
                const x = (i % DEPTH_WIDTH) - DEPTH_WIDTH * 0.5;
                const y = DEPTH_HEIGHT / 2 - Math.floor(i / DEPTH_WIDTH);
                pos.push(x);
                pos.push(y);
                pos.push(0);

                col.push(0);
                col.push(0);
                col.push(0);
            }

            if (!flag) {
                flag = !flag

                pose.setOptions({
                    modelComplexity: 1,
                    smoothLandmarks: true,
                    enableSegmentation: false,
                    smoothSegmentation: false,
                    minDetectionConfidence: 0.5,
                    minTrackingConfidence: 0.5
                });
                pose.onResults(onResults);

                deleteAll()

                // let bindings = []

                for (let i = 0; i < 33; i++) {
                    addTracker([0, 0, 0])
                    // bindings.push(i)
                }

                // console.log(useStoreTracking.getState().positions)

                setTimeout(async () => {
                    try {
                        await pose.send({image: canvasRef.current})
                    } catch (e) {
                        console.log(e)
                    }
                }, 5000)


                console.log('once')

                const ctx = canvasRef.current.getContext('2d');
                ctx.width = 640
                ctx.height = 576
                let colorToDepthImageData = ctx.createImageData(640, 576);

                window.myAPI.startListening((depth, color) => {
                    let pointIndex = 0;

                    let newDepthData = depth
                    let newColorData = color


                    renderBGRA32ColorFrame(ctx, colorToDepthImageData, color)


                    for (let i = 0; i < newDepthData.length; i += 2) {

                        const depthValue = newDepthData[i + 1] << 8 | newDepthData[i];

                        const b = newColorData[pointIndex * 4 + 0];
                        const g = newColorData[pointIndex * 4 + 1];
                        const r = newColorData[pointIndex * 4 + 2];

                        if (depthValue > 500 && depthValue < 4000) {
                            pos[pointIndex * 3 + 2] = depthValue / 3;
                        } else {
                            pos[pointIndex * 3 + 2] = 9999;
                        }

                        col[pointIndex * 3 + 0] = r / 255;
                        col[pointIndex * 3 + 1] = g / 255;
                        col[pointIndex * 3 + 2] = b / 255;

                        pointIndex++;
                    }

                    if (refPoints) {
                        const pos_ref = refPoints.current.geometry.getAttribute('position');
                        const col_ref = refPoints.current.geometry.getAttribute('color');
                        // console.log(pos, col)

                        for (let i = 0; i <= pos.length; i++) {
                            pos_ref.array[i] = pos[i]
                            col_ref.array[i] = col[i]
                        }

                        refPoints.current.geometry.setAttribute('position', pos_ref);
                        refPoints.current.geometry.setAttribute('color', col_ref);

                        refPoints.current.geometry.attributes.position.needsUpdate = true;
                        refPoints.current.geometry.attributes.color.needsUpdate = true;
                    }
                });
            }


        } catch (e) {
            console.log(e)
        }
    }, [])


    const [System, setSystem] = useControls(() => ({
        'Controls': folder({
            'Mode': {value: 'translate', options: ['translate', 'scale', 'rotate']},
            'Random Update': button((get) => {
                // update trackers
                const positions = useStoreTracking.getState().positions
                for (let i = 0; i < positions.length; i++) {
                    const pos = positions[i]
                    updateTracker(i, [pos[0] + getRandomInt(-50, 50), pos[1] + getRandomInt(-50, 50), pos[2] + getRandomInt(-50, 100)])
                }
            }),
            'Body Tracking': button((get) => {
                setTimeout(() => setInterval(onTimerTick, 33), 2000)

            })
        }),
        'Tracking': folder({
            'Trackers': true,
            'Pose': true,
            'Pick Color': '#ffffff',
            'Add Tracker': button((get) => {
                open()
                    .then(color => {
                        setSystem({'Pick Color': color.sRGBHex})
                        addColor(color.sRGBHex)
                        addTracker([getRandomInt(-100, 100), getRandomInt(-100, 100), getRandomInt(0, 500)])
                        // console.log(useStoreColor.getState().colors)

                    })
                    .catch(e => {
                        console.log(e)
                        // Ensures component is still mounted
                        // before calling setState
                        if (!e.canceled) setError(e)
                    })
                // console.log(colorPick, useStoreTracking.getState().positions)
                // addTracker([-10, -50, 300])
                // updateTracker(1, [-10, -10, 150])
            }),
        }),
        'Annotation': folder({
            'A_Binding': {options: bindingOpions},
            Text: '',
            'A_Position': [0, 0, 0],
            'Add Static Label': button((get) => {
                const text = get('Annotation.Text')
                const position = get('Annotation.A_Position')
                const binding = get('Annotation.A_Binding')
                setLabels([...labels, {Text: text, Position: position, Binding: binding}])

            }),

        }),
        'Highlight': folder({
            'H_Binding': {options: ['0', '1', '2', '3']},
            'H_Type': {options: ['Torus', 'Arrow', 'Line', '3D Box', '2D Area', 'Marker']},
            'H_Position': [0, 0, 0],
            'Add Highlight': button((get) => {
                const category = get('Highlight.H_Type')
                const position = get('Highlight.H_Position')
                const binding = get('Highlight.H_Binding')

                if (category === 'Torus') {
                    setTorus([...torus, {Position: position, Binding: binding}])
                } else if (category === 'Line') {
                    setMLines([...mLines, {Position: position, Binding: binding}])
                } else if (category === 'Marker') {
                    setMarker([...marker, {Position: position, Binding: binding}])
                }
            }),

        }),
        'Motion': folder({
            'M_Binding': {options: ['0', '1', '2', '3']},
            'M_Type': {options: ['Path', 'Trail', 'AfterImage', 'Replay']},
            'M_Position': [0, 0, 0],
            'Add Motion Effect': button((get) => {
                const category = get('Motion.M_Type')
                const position = get('Motion.M_Position')
                const binding = get('Motion.M_Binding')
            }),

        }),
        'Parameters': folder({
            'P_Binding': {options: ['0', '1', '2', '3']},
            'P_Type': {options: ['Position', 'Angle', 'Distance', 'Speed', 'Duration', 'Count']},
            'P_Position': [0, 0, 0],
            'Add Dynamic Parameter': button((get) => {
                const category = get('Parameters.P_Type')
                const position = get('Parameters.P_Position')
                const binding = get('Parameters.P_Binding')
                if (category === 'Position') {
                    if (dynamicSpheres.length === 1) {
                        setPos([...pos, dynamicSpheres])
                        // console.log(dynamicSpheres, pos)
                    }

                    resetDynamicSpheres()
                } else if (category === 'Angle') {
                    if (dynamicSpheres.length === 3) {
                        setAngles([...angles, dynamicSpheres])
                        // console.log(dynamicSpheres, angles)
                    }

                    resetDynamicSpheres()
                } else if (category === 'Distance') {
                    if (dynamicSpheres.length === 2) {
                        setDist([...dist, dynamicSpheres])
                        // console.log(dynamicSpheres, dist)
                    }
                    resetDynamicSpheres()
                }
            }),

        }),
        'Assets': folder({
            'A_Binding': {options: ['0', '1', '2', '3']},
            'A_Type': {options: ['Model', 'Embedded Screen']},
            'A_Position': [0, 0, 0],
            'Model': {image: undefined},
            'URL': '',
            'Add Asset': button((get) => {
                const category = get('Assets.A_Type')
                const position = get('Assets.A_Position')
                const binding = get('Assets.A_Binding')

            }),

        }),
        // 'Write File': button((get) => {
        //     // console.log(colorImageData, depthImageData)
        //     // setTimeout(() => {
        //     //     writeImage('gym-5', colorImageData, depthImageData);
        //     // }, 5000)
        //     // console.log(positions, count)
        // }),

    }))

    const KinectPoints = () => {

        const [positions, colors] = useMemo(() => {
            let positions = [],
                colors = []

            for (let i = 0; i < numPoints; i++) {
                const x = (i % DEPTH_WIDTH) - DEPTH_WIDTH * 0.5;
                const y = DEPTH_HEIGHT / 2 - Math.floor(i / DEPTH_WIDTH);
                positions.push(x);
                positions.push(y);
                positions.push(0);

                colors.push(0);
                colors.push(0);
                colors.push(0);
            }

            return [new Float32Array(positions), new Float32Array(colors)]
        }, [])

        // useFrame(() => {
        //     if (refPoints.current) {
        //         const pointD = useStoreDepthD.getState().depthdata
        //         const colorD = useStoreColorD.getState().colordata
        //         // manually inject numbers into property. so that it won't trigger re-render.
        //         const pos = refPoints.current.geometry.getAttribute('position');
        //         const col = refPoints.current.geometry.getAttribute('color');
        //         // console.log(pos, col)
        //
        //         for (let i = 0; i <= pointD.length; i++) {
        //             pos.array[i] = pointD[i]
        //             col.array[i] = colorD[i]
        //         }
        //
        //         refPoints.current.geometry.setAttribute('position', pos);
        //         refPoints.current.geometry.setAttribute('color', col);
        //
        //         refPoints.current.geometry.attributes.position.needsUpdate = true;
        //         refPoints.current.geometry.attributes.color.needsUpdate = true;
        //
        //         // state.requireUpdate = false;
        //     }
        //
        //
        // });


        return (<points ref={refPoints}>
            <bufferGeometry>
                <bufferAttribute attach={"attributes-position"} args={[positions, 3]}/>
                <bufferAttribute attach={"attributes-color"} args={[colors, 3]}/>
            </bufferGeometry>
            {/*attach="material" sizeAttenuation={true}*/}
            <pointsMaterial attach="material" sizeAttenuation={true} vertexColors={true} size={3}/>
        </points>);
    }


    return (
        <div className="App">
            <canvas hidden={true} ref={canvasRef} width={640} height={576} />
            <div style={{width: "100vw", height: "100vh"}}>
                <Canvas
                    // pixelRatio={window.devicePixelRatio}
                    onPointerMissed={() => setTarget(null)}
                    camera={{
                        fov: 90,
                        aspect: sizes.width / sizes.height,
                        near: 0.1,
                        far: 5000,
                        position: [0, 0, -1000]
                    }}
                >
                    <ambientLight ref={lightRef} intensity={0.01}/>

                    <color attach="background" args={["#000000"]}/>

                    <Center>
                        <KinectPoints/>
                    </Center>


                    {/*<group*/}
                    {/*    position={[55, 105, 320]}>*/}
                    {/*    <Sphere args={[20, 32, 32]}>*/}
                    {/*        <meshBasicMaterial transparent={true} opacity={0.3} color={'#ff00ff'}/>*/}
                    {/*    </Sphere>*/}
                    {/*</group>*/}

                    {/*{*/}
                    {/*    colors.map((color, index) => {*/}
                    {/*        return <ClickableSphere index={index}/>*/}
                    {/*    })*/}
                    {/*}*/}


                    {
                        bindingOpions.map((i, index) => {
                            return <ClickableSphere key={index} ref={sphereRefs.current[index]}/>
                        })
                    }


                    {/*<TrailScene/>*/}

                    {
                        angles.map((angle, index) => {
                                return <Angle key={index} sphere1={angle[0]} sphere2={angle[1]} sphere3={angle[2]}/>

                            }
                        )
                    }

                    {
                        dist.map((distance, index) => {
                                return <Distance key={index} sphere1={distance[0]} sphere2={distance[1]}/>

                            }
                        )
                    }

                    {
                        pos.map((position, index) => {
                                return <Pos key={index} sphere={position[0]}/>
                            }
                        )
                    }

                    {
                        marker.map((mark, index) => {
                                return <Marker key={index} rotation={[0, Math.PI / 2, 0]} position={mark.Position}>
                                    <FaMapMarkerAlt style={{color: 'orange'}}/>
                                </Marker>
                            }
                        )
                    }

                    {/*<Environment files="https://vazxmixjsiawhamofees.supabase.co/storage/v1/object/public/hdris/noon-grass/noon_grass_1k.hdr" background />*/}


                    <Selection>
                        <EffectComposer multisampling={0} autoClear={false}>
                            <SelectiveBloom mipmapBlur radius={0.75} lights={[lightRef]} luminanceThreshold={0.1}
                                            luminanceSmoothing={0.001} intensity={6}/>
                        </EffectComposer>

                        <Select enabled={true}>
                            <LightSaber scale={20} position={[0, 0, 100]}/>

                            <DreiSelect onChange={setSelected}>

                                {
                                    labels.map((label, count) => {
                                            return <Label key={count} position={label.Position} text={label.Text}
                                                          binding={label.Binding}/>
                                        }
                                    )
                                }

                                {
                                    mLines.map((mLine, index) => {
                                        return <DraggableLine key={index} defaultStart={[0, 0, 0]}
                                                              defaultEnd={[0, 0, 100]}/>

                                    })
                                }

                                {
                                    torus.map((tor, index) => {
                                        return <TorusComponent
                                            key={index}
                                            position={tor.Position}
                                            radius={50}
                                            tube={2}
                                            opacity={1}
                                            color={'pink'}
                                            binding={tor.Binding}
                                            rotation={[Math.PI / 2.2, 0, 0]}
                                        />

                                    })
                                }
                            </DreiSelect>


                        </Select>

                    </Selection>


                    {/*{*/}
                    {/*    path.map((line, index) => {*/}
                    {/*            // console.log({x: path[index + 1][0], y: path[index + 1][1], z: path[index + 1][2]})*/}
                    {/*            if (index === path.length - 1) {*/}
                    {/*                return;*/}
                    {/*            } else {*/}
                    {/*                return <LineComponent*/}
                    {/*                    index={index}*/}
                    {/*                    start={{x: line[0], y: line[1], z: line[2]}}*/}
                    {/*                    end={{x: path[index + 1][0], y: path[index + 1][1], z: path[index + 1][2]}}*/}
                    {/*                    color={'white'}*/}
                    {/*                    lineWidth={1.5}*/}
                    {/*                />*/}
                    {/*            }*/}

                    {/*        }*/}
                    {/*    )*/}
                    {/*}*/}

                    {/*<RoundedBox args={[1, 1, 1]} radius={0.05} smoothness={4}>*/}
                    {/*    <meshPhongMaterial color="#f3f3f3" wireframe/>*/}
                    {/*</RoundedBox>*/}


                    {target && <TransformControls object={target} mode={System.Mode}/>}

                    <MapControls makeDefault/>
                    {/*<Post />*/}
                </Canvas>
                <Panel selected={selected}/>
                <Stats className="fps"/>
            </div>
        </div>
    )
        ;
}

export default App;
