var vidWidth = 731;
var vidHeight = 550;
var title, info, prompt, video, container, devices, id, config, canvas, context;
var blockDate, btnNext, countdown = 4, valueEmotion = 0, emotionString = '', stringHair = '', valueHair = 0;

config = {
    blocked:false,
    state: 0,
    activeButton:0,
    maxButtons:1
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
            var ajax = new XMLHttpRequest();
            ajax.open("GET", "http://localhost:5971/command/allLightOn/1");
            ajax.send();
            takeSnapshot();
            toggleOverlay();
            document.querySelector('.canvas-wrapper').classList.remove('hidden');
            document.querySelector('.countdown-wrapper').classList.add('hidden');
            countdown = 4;
            setTimeout(()=>{
                var ajax = new XMLHttpRequest();
                ajax.open("GET", "http://localhost:5971/command/allLightOff/1");
                ajax.send();
            },100)
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

    // uploadcomplete({
    //     target:{
    //         response:JSON.stringify([{"faceId":"e3888539-b4c0-4a99-a079-6f18ba4e68bb","faceRectangle":{"top":293,"left":223,"width":326,"height":388},"faceLandmarks":{"pupilLeft":{"x":349.7,"y":388.6},"pupilRight":{"x":492.3,"y":395.1},"noseTip":{"x":407.6,"y":501},"mouthLeft":{"x":341.1,"y":579.1},"mouthRight":{"x":496.4,"y":591},"eyebrowLeftOuter":{"x":277.7,"y":356.7},"eyebrowLeftInner":{"x":399.9,"y":365},"eyeLeftOuter":{"x":321.3,"y":389.8},"eyeLeftTop":{"x":346.8,"y":378.8},"eyeLeftBottom":{"x":345.9,"y":397.1},"eyeLeftInner":{"x":371.8,"y":394},"eyebrowRightInner":{"x":440.4,"y":368.4},"eyebrowRightOuter":{"x":550.9,"y":378.5},"eyeRightInner":{"x":471.7,"y":397.6},"eyeRightTop":{"x":497.2,"y":383.2},"eyeRightBottom":{"x":494.1,"y":404.5},"eyeRightOuter":{"x":518.7,"y":400.8},"noseRootLeft":{"x":391.7,"y":404.1},"noseRootRight":{"x":441.1,"y":407.8},"noseLeftAlarTop":{"x":375.1,"y":467.6},"noseRightAlarTop":{"x":448.8,"y":473.8},"noseLeftAlarOutTip":{"x":353.5,"y":500.3},"noseRightAlarOutTip":{"x":467.5,"y":512.5},"upperLipTop":{"x":409,"y":580.4},"upperLipBottom":{"x":406.7,"y":593.8},"underLipTop":{"x":406.4,"y":600.5},"underLipBottom":{"x":404.4,"y":627.9}},"faceAttributes":{"smile":0,"headPose":{"pitch":0,"roll":3,"yaw":-5.5},"gender":"female","age":24,"facialHair":{"moustache":0,"beard":0,"sideburns":0},"glasses":"Sunglasses","emotion":{"anger":0,"contempt":0,"disgust":0,"fear":0,"happiness":0,"neutral":0.993,"sadness":0.007,"surprise":0},"exposure":{"exposureLevel":"overExposure","value":0.87},"noise":{"noiseLevel":"low","value":0},"makeup":{"eyeMakeup":true,"lipMakeup":true},"accessories":[{"type":"glasses","confidence":1}],"occlusion":{"foreheadOccluded":false,"eyeOccluded":false,"mouthOccluded":false},"hair":{"bald":0.2,"invisible":false,"hairColor":[{"color":"brown","confidence":0.94},{"color":"black","confidence":0.81},{"color":"blond","confidence":0.4},{"color":"other","confidence":0.25},{"color":"red","confidence":0.21},{"color":"gray","confidence":0.19}]}},"filename":"12a34050-6a65-11e8-9308-137020937741.png"}])
    //     }
    // })
}

function uploadcomplete(event){
    let wrapperAnalysis = document.getElementById('analysis');
    wrapperAnalysis.classList.remove('hidden');
    document.getElementById('analysis').style.opacity = 1;
    let dataTemp = JSON.parse(event.target.response)

    if('msg' in dataTemp && dataTemp.msg == "no face found"){
        //TODO ERROR/SORRY MESSAGE

        config.blocked = false

        btnNext.innerHTML = 'Neu starten';
        btnNext.classList.remove('hidden')

        config.activeButton = 1
        document.getElementById('analysis').style.opacity = 0;

        document.getElementById('wrapper-error').classList.remove('hidden');


    }else{
        console.log(dataTemp[0])

        var imageData = document.getElementById('canvas').getContext('2d').getImageData( 0, 0, 550, 731 );

        glitch({ seed: 25, quality: 60, iterations: 20, amount: 25 })
            .fromImageData( imageData )
            .toDataURL()
            .then( function( dataURL ) {
                document.getElementById('glitchImg').src = dataURL;
                document.getElementById('glitchImg').classList.remove('hidden')
            });

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
            'disgust': 'ekelnd',
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
        let makeup = document.querySelector('#p-makeup');
        let hair = document.querySelector('#p-hair');
        let fhair = document.querySelector('#p-fhair')
        let smile = document.querySelector('#p-smile')
        
        gender.innerHTML = (response.gender == 'male') ? 'männlich': 'weiblich';
        age.innerHTML = response.age + ' Jahre';

        
        var emotionString = ''
        for (var property in response.emotion) {
            if (response.emotion.hasOwnProperty(property)) {

                let valueTempEmotion = response.emotion[property];
                let stringTempEmotion = property;
                if(parseFloat(valueTempEmotion) > 0){
                    if(emotionString != '')emotionString += '<br />'
                    if(!(stringTempEmotion in emotions)){
                        emotionString += stringTempEmotion
                    }
                    emotionString += emotions[stringTempEmotion]+' ('+valueTempEmotion+')'
                }
                // valueEmotion = (response.emotion[property] > valueEmotion) ? response.emotion[property] : valueEmotion;
                // if (valueEmotion === valueTempEmotion) { 
                //     emotionString = emotions[stringTempEmotion];
                // }

            }
        }

        //emotion.innerHTML = emotionString + ' (' + valueEmotion + ')';
        emotion.innerHTML = emotionString;
        
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
        if(response.hair.invisible == true){
            hair.innerHTML = 'Nicht sichtbar';
        }
        if(response.hair.bald > 0.9){
            hair.innerHTML = 'Glatze'
        }
        glasses.innerHTML = (response.glasses == "NoGlasses") ? 'Nein' : 'Ja';

        var makeupStr = ''
        if(response.makeup.eyeMakeup) makeupStr += 'Augen'
        if(response.makeup.eyeMakeup && response.makeup.lipMakeup) makeupStr += ', '
        if(response.makeup.lipMakeup) makeupStr += 'Lippen'
        makeup.innerHTML = makeupStr
        if(makeupStr == ''){
            makeup.parentNode.classList.add('hidden')
        }else{
            makeup.parentNode.classList.remove('hidden')
        }

        var fhairStr = ''
        if(response.facialHair.moustache > 0.5) fhairStr += 'Schnurrbart'
        if(response.facialHair.beard > 0.5) fhairStr += ((response.facialHair.moustache > 0.5)?', ':'')+'Bart'
        if(response.facialHair.sideburns > 0.5) fhairStr += ((response.facialHair.moustache > 0.5 || response.facialHair.beard)?', ':'')+'Koteletten'
        fhair.innerHTML = fhairStr
        if(fhairStr == ''){
            fhair.parentNode.classList.add('hidden')
        }else{
            fhair.parentNode.classList.remove('hidden')
        }

        var smileStr = 'Nein'
        if(response.smile > 0.5) smileStr = 'Ja'
        smile.innerHTML = smileStr

        //TODO ???
        // response.accessories

        var faceNet = [
            ['eyebrowLeftOuter', 'eyebrowLeftInner'],
            ['eyebrowRightInner', 'eyebrowRightOuter'],
            ['eyeLeftOuter', 'eyeLeftTop', 'eyeLeftInner', 'eyeLeftBottom', 'eyeLeftOuter'],
            ['eyeRightOuter', 'eyeRightTop', 'eyeRightInner', 'eyeRightBottom', 'eyeRightOuter'],
            ['noseRootLeft', 'noseRootRight', 'noseRightAlarTop', 'noseRightAlarOutTip', 'noseTip', 'noseLeftAlarOutTip', 'noseLeftAlarTop', 'noseRootLeft'],
            ['mouthLeft', 'upperLipTop', 'mouthRight', 'underLipBottom', 'mouthLeft'],
            ['mouthLeft', 'upperLipBottom', 'mouthRight'],
            ['mouthLeft', 'underLipTop', 'mouthRight']
        ]

        var svg = d3.select('#result-wrapper svg')
            svg.selectAll('*').remove()

        for(var key in dataTemp[0].faceLandmarks){
            var l = dataTemp[0].faceLandmarks[key]
            svg.append('circle')
                .attr('r',3)
                .style('fill','#46E0B4')
                .attr('cx',l.x)
                .attr('cy',l.y)
        }

        var line = d3.line()
            .x(d=>d[0])
            .y(d=>d[1])

        faceNet.forEach(n=>{
            let p = []
            n.forEach(v=>{
                p.push([
                    dataTemp[0].faceLandmarks[v].x,
                    dataTemp[0].faceLandmarks[v].y
                ])
            })
            svg.append('path')
                .data([p])
                .style('fill','transparent')
                .style('stroke','#46E0B4')
                .attr('d', line)
        })

        svg.append('rect')
            .style('fill','transparent')
            .style('stroke','#46E0B4')
            .attr('x',dataTemp[0].faceRectangle.left)
            .attr('y',dataTemp[0].faceRectangle.top)
            .attr('width',dataTemp[0].faceRectangle.width)
            .attr('height',dataTemp[0].faceRectangle.height)

        document.getElementById('result-wrapper').classList.remove('hidden');

        setTimeout(()=>{
            config.state += 1;
            updateState()
        }, 30000)

    }
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
    document.getElementById('wrapper-error').classList.add('hidden');
    document.querySelector('.canvas-wrapper').classList.add('hidden');
    document.querySelector('.countdown-wrapper').classList.add('hidden');
});

window.addEventListener('keypress', (event) => {
    const keyName = event.key;
    if (keyName == 'n') {
        if(!config.blocked){
            if(config.activeButton == 0){
                config.state += 1;
                updateState()
            }else{
                config.state = 0;
                updateState()
            }
        }
    }else if (keyName == 'l') {
        if(config.maxButtons>1){
            config.activeButton = 1
            updateButton()
        }
    }else if (keyName == 'r') {
        if(config.maxButtons>1){
            config.activeButton = 0
            updateButton()
        }
    }

    console.log(keyName, config.activeButton)
})


btnNext.addEventListener('click', () => {
    config.state += 1;
    updateState()
})

function updateButton(){
    if(config.activeButton==1){
        btnNext.classList.remove('btn-next')
        btnNext.classList.remove('boxShadow')
        btnNext.classList.add('btn-cancel')
        btnCancel.classList.add('btn-next')
        btnCancel.classList.add('boxShadow')
        btnCancel.classList.remove('btn-cancel')
        btnCancel.focus()
    }else{
        btnCancel.classList.remove('btn-next')
        btnCancel.classList.remove('boxShadow')
        btnCancel.classList.add('btn-cancel')
        btnNext.classList.add('btn-next')
        btnNext.classList.add('boxShadow')
        btnNext.classList.remove('btn-cancel')
        btnNext.focus()
    }
}

var resetCounter = 0;
setInterval(()=>{
    resetCounter++
    if(resetCounter >= 180){
        resetCounter = 0;
        if(config.state != 0){
            config.state = 0;
            updateState();
        }
    }
},1000)

function updateState(){

    config.activeButton = 0
    updateButton()

    switch(config.state){
        case 0:

            config.blocked = false;
            resetCounter = 0;

            btnNext.innerHTML = 'Starten';  
            btnNext.classList.remove('hidden')
            config.activeButton = 0;
            btnNext.focus();


            btnCancel.classList.add('hidden')

            //document.querySelector('.overlay.scanning').classList.add('hidden');
            document.querySelector('.overlay').classList.remove('scanning');
            document.getElementById('glitchImg').classList.add('hidden')
            document.getElementById('wrapper-error').classList.add('hidden');
            document.getElementById('frame-wrapper').classList.add('hidden');
            document.getElementById('result-wrapper').classList.add('hidden');
            document.querySelector('.countdown-wrapper').classList.add('hidden');
            document.querySelector('.canvas-wrapper').classList.add('hidden');
            document.getElementById('analysis').style.opacity = 0;

            video.classList.add('hidden');

        break;
        case 1:

            config.maxButtons = 2
            config.blocked = false;
            resetCounter = 0;

            btnNext.innerHTML = 'Zustimmen';
            btnNext.classList.remove('hidden')
            config.activeButton = 0;
            btnNext.focus();

            btnCancel.innerHTML = 'Neu starten';
            btnCancel.classList.remove('hidden')

            //document.querySelector('.overlay.scanning').classList.add('hidden');
            document.querySelector('.overlay').classList.remove('scanning');
            document.getElementById('glitchImg').classList.add('hidden')
            document.getElementById('wrapper-error').classList.add('hidden');
            document.getElementById('frame-wrapper').classList.add('hidden');
            document.getElementById('result-wrapper').classList.add('hidden');
            document.querySelector('.countdown-wrapper').classList.add('hidden');
            document.querySelector('.canvas-wrapper').classList.add('hidden');
            document.getElementById('analysis').style.opacity = 0;

            video.classList.add('hidden');

        break;
        case 2:
            config.maxButtons = 1
            config.blocked = false;
            resetCounter = 0;

            btnNext.innerHTML = 'Countdown starten';
            btnNext.classList.remove('hidden')
            config.activeButton = 0;
            btnNext.focus();

            btnCancel.classList.add('hidden')           

           //document.querySelector('.overlay.scanning').classList.add('hidden');
           document.querySelector('.overlay').classList.remove('scanning');
           document.getElementById('glitchImg').classList.add('hidden')
            document.getElementById('wrapper-error').classList.add('hidden');
            document.getElementById('result-wrapper').classList.add('hidden');
            document.querySelector('.countdown-wrapper').classList.add('hidden');
            document.querySelector('.canvas-wrapper').classList.add('hidden');
            document.getElementById('analysis').style.opacity = 0;

            video.classList.remove('hidden');
            document.getElementById('frame-wrapper').classList.remove('hidden');

        break;
        case 3:

            config.blocked = true

            config.maxButtons = 1
            resetCounter = 0;

            btnNext.classList.add('hidden')
            btnCancel.classList.add('hidden')   

            var ajax = new XMLHttpRequest();
            ajax.open("GET", "http://localhost:5971/command/blinkOn/1");
            ajax.send();

            //document.querySelector('.overlay.scanning').classList.add('hidden');
            document.querySelector('.overlay').classList.remove('scanning');
            document.getElementById('glitchImg').classList.add('hidden')
            document.getElementById('wrapper-error').classList.add('hidden');
            document.getElementById('frame-wrapper').classList.add('hidden');
            document.getElementById('result-wrapper').classList.add('hidden');
            document.querySelector('.countdown-wrapper').classList.remove('hidden');
            document.querySelector('.canvas-wrapper').classList.add('hidden');
            document.getElementById('analysis').style.opacity = 0;

            video.classList.remove('hidden');

            setTimer();
        break;
        case 4:
            console.log('4');
            togglePrintOverlay();
            clearAnalysis();

            pickRandomCard();

            document.getElementById('wrapper-error').classList.add('hidden');
            document.querySelector('.overlay').classList.remove('scanning');
            document.getElementById('glitchImg').classList.add('hidden')
            document.querySelector('.countdown-wrapper').classList.add('hidden');
            document.getElementById('frame-wrapper').classList.add('hidden');
            document.querySelector('.canvas-wrapper').classList.add('hidden');
            document.getElementById('result-wrapper').classList.add('hidden');
            document.getElementById('analysis').style.opacity = 0;
            video.classList.add('hidden');

            valueHair = 0;
            valueEmotion = 0;
            resetCounter = 0;

            setTimeout(()=>{
                config.blocked = false
                config.activeButton = 1

                btnNext.innerHTML = 'Neu starten';
                btnNext.classList.remove('hidden')
                btnNext.focus();
            }, 30000)
        break;
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
}

function getRandomInt(max) {
    return Math.floor(Math.random() * Math.floor(max));
}

function pickRandomCard() {
    let randomInt = getRandomInt(6);
    let url = `./assets/postcards/0${randomInt}.png`;
    let img = document.querySelector('#postcard');
    img.src = url;
}



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
updateState();
updateButton()