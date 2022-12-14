// import {useFrame} from "@react-three/fiber";
// import {useEffect, useRef} from "react";
// import {useStorePose, useStoreTracking} from "../store/useStoreControl";
// import * as PoseMediaPipe from "@mediapipe/pose";
// import Webcam from "react-webcam";
//
//
// export const pose = new PoseMediaPipe.Pose({
//     locateFile: (file) => {
//         return `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`;
//     }
// });
//
//
// const renderBGRA32ColorFrame = (imageData) => {
//     let canvas = document.createElement('canvas');
//     let ctx = canvas.getContext('2d');
//     canvas.width = 640;
//     canvas.height = 576;
//     let canvasImageData = ctx.createImageData(canvas.width, canvas.height)
//
//     const newPixelData = imageData;
//     const pixelArray = canvasImageData.data;
//
//     for (let i = 0; i < canvasImageData.data.length; i += 4) {
//         pixelArray[i] = newPixelData[i + 2];
//         pixelArray[i + 1] = newPixelData[i + 1];
//         pixelArray[i + 2] = newPixelData[i];
//         pixelArray[i + 3] = 0xff;
//     }
//
//     // ctx.putImageData(canvasImageData, 0, 0);
//     //
//     // let image_ele = new Image();
//     // image_ele.src = canvas.toDataURL();
//     // return image_ele;
//     return canvasImageData
// };
//
// export const PoseTracking = () => {
//     const {positions, addTracker, updateTracker, deleteAll} = useStoreTracking()
//     const {image, setImage} = useStorePose()
//     const canvasRef = useRef()
//     const videoRef = useRef()
//
//     function onResults(results) {
//         const pos = useStoreTracking.getState().positions
//         if (pos.length >= 33) {
//             console.log(results)
//         }
//
//     }
//
//     let flag = false;
//
//     useEffect(() => {
//         if (pose && !flag) {
//
//             flag = true;
//
//             pose.setOptions({
//                 modelComplexity: 1,
//                 smoothLandmarks: true,
//                 enableSegmentation: true,
//                 smoothSegmentation: true,
//                 minDetectionConfidence: 0.5,
//                 minTrackingConfidence: 0.5
//             });
//             pose.onResults(onResults);
//
//             deleteAll()
//             for (let i = 0; i < 33; i++) {
//                 addTracker([0, 0, 0])
//             }
//             console.log(useStoreTracking.getState().positions)
//
//             const imageFrame = useStorePose.getState().image
//
//             if (imageFrame) {
//                 setTimeout(() => setInterval(onTimerTick, 100), 1000)
//             }
//         }
//
//     }, [])
//
//
//     async function onTimerTick() {
//         try {
//             // const imageFrame = useStorePose.getState().image
//             // // if (imageFrame !== null && pose !== null) {
//             // const canvasImage = renderBGRA32ColorFrame(imageFrame)
//             // const ctx = canvasRef.current.getContext('2d')
//             // ctx.putImageData(canvasImage, 0, 0);
//
//             await pose.send({image: videoRef.current})
//             // }
//         } catch (e) {
//             console.log(e)
//         }
//
//     }
//
//
//     return  <div>
//
//         {/*<Webcam id={"webcam"} ref={videoRef} mirrored={true}*/}
//         {/*        width={640} height={576}*/}
//         {/*        videoConstraints={{*/}
//         {/*            width: window.innerWidth,*/}
//         {/*            height: window.innerHeight,*/}
//         {/*        }}/>*/}
//     </div>
//
//     // <canvas ref={canvasRef} width={640} height={576} />
//
//
//
// }