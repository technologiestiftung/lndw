var vidWidth = 731;
var vidHeight = 550;
var title, info, prompt, video, container, devices, id, config, canvas;
var blockDate, btnNext, countdown = 6, valueEmotion = 0, emotionString = '', hairString = '', valueHair = 0;

config = {
    state: 0,
};

function takeSnapshot() {
    let src = document.getElementById('video');
    let canvas = document.getElementById('canvas');
    var context = canvas.getContext('2d');
    canvas.width = vidHeight;
    canvas.height = vidWidth;
    context.rotate(90 * Math.PI / 180);
    context.scale(1,-1);
    context.drawImage(video, 0, 0, vidWidth, vidHeight);
    let data = canvas.toDataURL();
    saveSnapshot(data);
}

function setTimer() {
    setTimeout(() => {
        countdown--;
        let numTag = document.getElementById('countdown-num');
        numTag.innerHTML = '0' + countdown;

        if (countdown > 0) {
            setTimer();
        }
        else if (countdown === 0) {
            takeSnapshot();
            document.querySelector('.canvas-wrapper').classList.remove('hide');
            document.querySelector('.countdown-wrapper').classList.add('hide');
            countdown = 6;
        }
    },1000);
}

function streamCamera() {
    video = document.querySelector('#video');
    video.width = vidWidth;
    video.height = vidHeight;
    video.autoplay = true;

    navigator.mediaDevices.enumerateDevices().then(devices => {
        // console.log(devices);
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

function saveSnapshot(img){
    var formdata = new FormData();
    formdata.append("base64image", img);
    var ajax = new XMLHttpRequest();
    ajax.addEventListener("load", function(event) { 
        uploadcomplete(event);
    }, false);
    ajax.open("POST", "https://tsb.ara.uberspace.de/lndw/analyse");
    ajax.send(formdata);
}

function uploadcomplete(event){
    let data = JSON.parse(event.target.responseText)
    let gender = document.querySelector('#p-gender');
    let age = document.querySelector('#p-age');
    let emotion = document.querySelector('#p-emotion');
    let hair = document.querySelector('#p-hair');

    console.log(data);

    
    gender.innerHTML = (data[0].faceAttributes.gender == 'male') ? 'männlich': 'weiblich';
    age.innerHTML = data[0].faceAttributes.age + ' Jahre';
    
    for (var property in data[0].faceAttributes.emotion) {
        if (data[0].faceAttributes.emotion.hasOwnProperty(property)) {
            valueEmotion = (data[0].faceAttributes.emotion[property] > valueEmotion) ? data[0].faceAttributes.emotion[property] : valueEmotion;
            if (valueEmotion === data[0].faceAttributes.emotion[property]) { emotionString = property }
        }
    }
    
    for (var property in data[0].faceAttributes.hair.hairColor) {
        if (data[0].faceAttributes.hair.hairColor.hasOwnProperty(property)) {
            console.log(property);
            valueHair = (data[0].faceAttributes.hair.hairColor[property] > valueHair) ? data[0].faceAttributes.hair.hairColor[property] : valueHair;
            if (valueHair === data[0].faceAttributes.hair.hairColor[property]) { hairString = property }
        }
    }

    hair.innerHTML = hairString + '(' + valueHair + ')';
    emotion.innerHTML = emotionString + '(' + valueEmotion + ')';

    console.log(data);

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
video = document.querySelector('#video');

btnCancel.addEventListener('click', () => {
    let currentState = config.state;
    config.state = 0; 
    btnNext.innerHTML = 'Starten'; 
    video.classList.add('hide');

    for (let index = 0; index < 6; index++) {
        const id = '#state-0' + index;
        document.querySelector(id).classList.add('hide');
    }

    document.querySelector('#state-00').classList.remove('hide');
    document.querySelector('#cancel').classList.add('hide');
    document.querySelector('#next').classList.remove('hide');
    document.getElementById('frame-wrapper').classList.add('hide');
    document.querySelector('.canvas-wrapper').classList.add('hide');
    document.querySelector('.countdown-wrapper').classList.add('hide');
});

btnNext.addEventListener('click', () => {
    document.querySelector('#cancel').classList.remove('hide');
    config.state += 1;

    if (config.state == 1) {
        btnNext.innerHTML = 'Zustimmen';  
        document.getElementById('frame-wrapper').classList.add('hide');
    } else if (config.state == 2) { 
        video.classList.remove('hide');
        btnNext.innerHTML = 'Fotografieren';  
        btnCancel.innerHTML = 'Abbrechen';
        document.getElementById('frame-wrapper').classList.remove('hide');
    } else if (config.state == 3) {
        setTimer();
        btnNext.innerHTML = 'Weiter';  
        document.querySelector('.countdown-wrapper').classList.remove('hide');
        document.querySelector('.canvas-wrapper').classList.remove('hide');
        document.getElementById('frame-wrapper').classList.add('hide');
    } else if (config.state == 4) {
        document.querySelector('.countdown-wrapper').classList.add('hide');
        video.classList.add('hide');
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

window.addEventListener('click', () => {
    console.log('click');
})

window.addEventListener('scroll', () => {
    console.log('scroll');
})

blockDate = document.querySelector('#block-date');
blockDate.innerHTML = getDate();

streamCamera();
getDate();