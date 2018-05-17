var vidWidth = 1000;
var vidHeight = 800;
var title, info, prompt, video, container, devices, id;

function init() {
    video = document.querySelector('#video');
    video.width = vidWidth;
    video.height = vidHeight;
    video.autoplay = true;

    navigator.mediaDevices.enumerateDevices().then(devices => {
        var camera = devices.filter(device => device.kind == "videoinput");
        camera.forEach(device => {
            if(device.label == "USB 2.0 Camera (0c45:6340)") { id = device.deviceId;};
        })
        var constraints = { deviceId: { exact: id } };
        return navigator.mediaDevices.getUserMedia({ video: constraints });
    })
    .then(stream => video.srcObject = stream);
}

init();