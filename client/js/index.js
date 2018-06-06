var vidWidth = 731;
var vidHeight = 550;
var title, info, prompt, video, container, devices, id, config, canvas, context;
var blockDate, btnNext, countdown = 4, valueEmotion = 0, emotionString = '', stringHair = '', valueHair = 0;

config = {
    state: 0,
};

function takeSnapshot() {
    console.log('take snapshot')
    let src = document.getElementById('video');
    canvas = document.getElementById('canvas');
    context = canvas.getContext('2d');
    canvas.width = vidHeight;
    canvas.height = vidWidth;
    context.rotate(90 * Math.PI / 180);
    context.scale(1,-1);
    context.drawImage(video, 0, 0, vidWidth, vidHeight);
    let data = canvas.toDataURL();


    document.querySelector('.canvas-wrapper').style.opacity = 1;
    saveSnapshot(data);
    document.getElementById('analysis').style.opacity = 0;
    clearAnalysis();
}

function toggleOverlay() {
    var overlay = document.querySelector('.overlay');
    overlay.classList.toggle('scanning');
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
            toggleOverlay();
            document.querySelector('.canvas-wrapper').classList.remove('hidden');
            document.querySelector('.countdown-wrapper').classList.add('hidden');
            countdown = 4;
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
    console.log('saveSnapshot')
    var formdata = new FormData();
    formdata.append("base64image", img);
    var ajax = new XMLHttpRequest();
    ajax.addEventListener("load", function(event) { 
        uploadcomplete(event);
    }, false);
    // ajax.open("POST", "https://tsb.ara.uberspace.de/lndw/analyse");
    ajax.open("POST", "http://localhost:5971/analyse");
    ajax.send(formdata);
}

function uploadcomplete(event){
    let wrapperAnalysis = document.getElementById('analysis');
    wrapperAnalysis.classList.remove('hidden');
    document.getElementById('analysis').style.opacity = 1;
    let dataTemp = JSON.parse(event.target.response)
    let response = dataTemp[0].faceAttributes;

    toggleOverlay();
    togglePrintOverlay();

    // add css class here to canvas
    document.getElementById('canvas').classList.add('scanning');

    let emotions = {
        'happiness': 'glücklich',
        'surprise': 'überrascht',
        'anger': 'wütend',
        'contempt': 'missachtend',
        'disguist': 'ekelnd',
        'fear': 'ängstlich',
        'neutral': 'neutral',
        'sadness': 'traurig'
    };

    let hairColors = {
        'black': 'schwarz',
        'brown': 'braun',
        'blond': 'blond',
        'other': 'andere',
        'red': 'rot',
        'gray': 'grau'
    };

    let gender = document.querySelector('#p-gender');
    let age = document.querySelector('#p-age');
    let emotion = document.querySelector('#p-emotion');
    let glasses = document.querySelector('#p-glasses');
    let hair = document.querySelector('#p-hair');
    
    gender.innerHTML = (response.gender == 'male') ? 'männlich': 'weiblich';
    age.innerHTML = response.age + ' Jahre';

    
    for (var property in response.emotion) {
        if (response.emotion.hasOwnProperty(property)) {
            let valueTempEmotion = response.emotion[property];
            let stringTempEmotion = property;
            valueEmotion = (response.emotion[property] > valueEmotion) ? response.emotion[property] : valueEmotion;
            if (valueEmotion === valueTempEmotion) { 
                emotionString = emotions[stringTempEmotion];
            }
        }
    }

    emotion.innerHTML = emotionString + ' (' + valueEmotion + ')';
    
    for (var property in response.hair.hairColor) {
        let stringTempHair = response.hair.hairColor[property].color;
        valueTempHair =  response.hair.hairColor[property].confidence;
        valueHair = (valueTempHair > valueHair) ? valueTempHair : valueHair; 
        if (valueHair === valueTempHair) { 
            for (var responseHairColor in hairColors) {
                stringHair = hairColors[stringTempHair];
            };
        };
    }
    hair.innerHTML = stringHair + ' (' + valueHair + ')';
    glasses.innerHTML = (response.glasses == 'ReadingGlasses') ? 'Ja' : 'Nein';
}

function createGlitch() {
    // console.log(context);
    var imageData = context.getImageData( 0, 0, canvas.width, canvas.height );
 
    glitch()
        .fromImageData( imageData )
        .toDataURL()
        .then(function( dataURL ) {
            var glitchedImg = new Image();
            glitchedImg.src = dataURL;
            document.body.appendChild( glitchedImg );
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

function togglePrintOverlay() {
    document.querySelector('#printing').classList.toggle('hidden');
}

function clearAnalysis() {
    document.getElementById('p-gender').innerHTML = '';
    document.getElementById('p-age').innerHTML = '';
    document.getElementById('p-glasses').innerHTML = '';
    document.getElementById('p-hair').innerHTML = '';
    document.getElementById('p-emotion').innerHTML = '';
    document.getElementById('p-makeup').innerHTML = '';
}

btnNext = document.querySelector('#next');
btnCancel = document.querySelector('#cancel');
video = document.querySelector('#video');

btnCancel.addEventListener('click', () => {
    let currentState = config.state;
    config.state = 0; 
    btnNext.innerHTML = 'Starten'; 
    video.classList.add('hidden');

    for (let index = 0; index < 5; index++) {
        const id = '#state-0' + index;
        document.querySelector(id).classList.add('hidden');
    }

    document.querySelector('#state-00').classList.remove('hidden');
    document.querySelector('#cancel').classList.add('hidden');
    document.querySelector('#next').classList.remove('hidden');
    document.getElementById('frame-wrapper').classList.add('hidden');
    document.querySelector('.canvas-wrapper').classList.add('hidden');
    document.querySelector('.countdown-wrapper').classList.add('hidden');
});

window.addEventListener('keypress', (event) => {
    const keyName = event.key;
    if (keyName == 'n') {
        btnNext.click();
    }
})


btnNext.addEventListener('click', () => {
    document.querySelector('#cancel').classList.remove('hidden');
    // if (config.state == 4) {
    //     window.location.reload(true);
    // }
    config.state += 1;
    if (config.state == 1) {
        btnNext.innerHTML = 'Zustimmen';  
        document.getElementById('frame-wrapper').classList.add('hidden');
    } else if (config.state == 2) { 
        video.classList.remove('hidden');
        btnNext.innerHTML = 'Fotografieren';  
        btnCancel.innerHTML = 'Abbrechen';
        document.getElementById('frame-wrapper').classList.remove('hidden');
    } else if (config.state == 3) {
        setTimer();
        btnNext.innerHTML = 'Weiter';  
        document.getElementById('analysis').style.opacity = 0;
        document.querySelector('.countdown-wrapper').classList.remove('hidden');
        document.getElementById('frame-wrapper').classList.add('hidden');
    } else if (config.state == 4) {
        // createGlitch();
        togglePrintOverlay();
        clearAnalysis();
        document.querySelector('.countdown-wrapper').classList.add('hidden');
        document.getElementById('frame-wrapper').classList.add('hidden');
        document.querySelector('.canvas-wrapper').classList.add('hidden');
        video.classList.add('hidden');
        btnCancel.innerHTML = 'Neu starten';
        document.querySelector('#next').classList.add('hidden');
        valueHair = 0;
        valueEmotion = 0;
    }
    
    for (let stateIndex = 0; stateIndex < 5; stateIndex++) {
        
        if (config.state == stateIndex) {

            for (let index = 0; index < 5; index++) {
                const id = '#state-0' + index;
                
                if (index == config.state) {
                    document.querySelector(id).classList.remove('hidden');
    
                } else if (index != config.state) {
                    document.querySelector(id).classList.add('hidden');
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