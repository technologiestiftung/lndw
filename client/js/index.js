var vidWidth = 800;
var vidHeight = 1200;
var title, info, prompt, video, container, devices, id, config;
var blockDate, btnNext;

config = {
    state: 0,
};

function streamCamera() {
    video = document.querySelector('#video');
    video.width = vidWidth;
    video.height = vidHeight;
    video.autoplay = true;

    navigator.mediaDevices.enumerateDevices().then(devices => {
        console.log(devices);
        var camera = devices.filter(device => device.kind == "videoinput");
        camera.forEach(device => {
            if(device.deviceId == "c57886efe5999c5b2bee5c251718807e5d912fd84b91ba53afef097418dd4603") { id = device.deviceId;};
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

btnNext = document.querySelector('#next');
btnCancel = document.querySelector('#cancel');

btnCancel.addEventListener('click', () => {
    let currentState = config.state;
    config.state = 0; 
    btnNext.innerHTML = 'Starten'; 

    for (let index = 0; index < 6; index++) {
        const id = '#state-0' + index;
        document.querySelector(id).classList.add('hide');
    }

    document.querySelector('#state-00').classList.remove('hide');
    document.querySelector('#cancel').classList.add('hide');
    document.querySelector('#next').classList.remove('hide');
});

btnNext.addEventListener('click', () => {
    document.querySelector('#cancel').classList.remove('hide');
    config.state += 1;

    if (config.state == 1) { btnNext.innerHTML = 'Zustimmen';  }
    else if (config.state == 2) { 
        btnNext.innerHTML = 'Fotografieren';  
        btnCancel.innerHTML = 'Abbrechen';  
    } else if (config.state == 3) {
        btnNext.innerHTML == 'Weiter';  
    } else if (config.state == 4) {
        btnNext.innerHTML = 'Weiter';
    } else if (config.state == 5) {
        btnCancel.innerHTML = 'Neu starten';
        document.querySelector('#next').classList.add('hide');
    }
    
    for (let stateIndex = 0; stateIndex < 6; stateIndex++) {
        
        if (config.state == stateIndex) {

            for (let index = 0; index < 6; index++) {
                const id = '#state-0' + index;
                
                if (index == config.state) {
                    document.querySelector(id).classList.remove('hide');
    
                } else if (index != config.state) {
                    document.querySelector(id).classList.add('hide');
                }
            }
        }
    }
})

blockDate = document.querySelector('#block-date');
blockDate.innerHTML = getDate();

streamCamera();
getDate();