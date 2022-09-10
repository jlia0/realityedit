// opencv
const cv = require('../realityedit/public/opencv');




// Kinect Init
const Kinect = require('kinect-azure')
const KinectAzure = new Kinect();
if (KinectAzure.open()) {

    KinectAzure.startCameras({
        depth_mode: Kinect.K4A_DEPTH_MODE_NFOV_UNBINNED,
        color_format: Kinect.K4A_IMAGE_FORMAT_COLOR_BGRA32,
        color_resolution: Kinect.K4A_COLOR_RESOLUTION_720P,
        include_color_to_depth: true,
        // include_depth_to_color: true
    })

} else {
    console.log('kinect not open')
}



// preload with contextIsolation enabled
const {contextBridge} = require('electron')

contextBridge.exposeInMainWorld('myAPI', {
    require: (callback) => window.require(callback),
    startListening: (callback) => {
        KinectAzure.startListening((data) => {
            const depth = Buffer.from(data.depthImageFrame.imageData)
            const color = Buffer.from(data.colorToDepthImageFrame.imageData)
            callback(depth, color)
        })
    },
    opencvReady: (callback) =>{
        cv['onRuntimeInitialized'] = () => {
            // do all your work here
            callback('ready')
        };
    }
})