var vidWidth = 800;
var vidHeight = 1200;
var title, info, prompt, video, container, devices, id, config;
var blockDate, btnStart;

config = {
    state: 0,
};

function streamCamera() {
    video = document.querySelector('#video');
    video.width = vidWidth;
    video.height = vidHeight;
    video.autoplay = true;

    navigator.mediaDevices.enumerateDevices().then(devices => {
        var camera = devices.filter(device => device.kind == "videoinput");
        camera.forEach(device => {
            if(device.deviceId == "dc124f0386b78e027946b0e563880f838d6db5f7e66d7d1d922b6fa058655a60") { id = device.deviceId;};
        })
        var constraints = { deviceId: { exact: id } };
        return navigator.mediaDevices.getUserMedia({ video: constraints });
    })
    .then(stream => {
        video.srcObject = stream
    });
}

function getDate() {
    var today = new Date();
    var dd = today.getDate();
    var mm = today.getMonth() + 1;
    var yyyy = today.getFullYear();

    if(dd<10) { dd = '0' + dd } 
    if(mm<10) { mm = '0' + mm } 

    today = mm + '/' + dd + '/' + yyyy;
    return(today);
}

btnStart = document.querySelector('#start');
btnStart.addEventListener('click', () => {
    document.querySelector('#video').classList.remove('hide');
})

blockDate = document.querySelector('#block-date');
blockDate.innerHTML = getDate();

streamCamera();
getDate();