var video;
var vidWidth = 320;
var vidHeight = 240;

function init() {
 	//init webcam texture
     video = document.createElement('video');
     video.width = vidWidth;
     video.height = vidHeight;
     video.autoplay = true;
     video.loop = true;
 
     //make it cross browser
     window.URL = window.URL || window.webkitURL;
     navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia;
     //get webcam
     navigator.getUserMedia({
         video: true
     }, function(stream) {
         //on webcam enabled
         video.src = window.URL.createObjectURL(stream);
         prompt.style.display = 'none';
         title.style.display = 'inline';
         container.style.display = 'inline';
         gui.domElement.style.display = 'inline';
     }, function(error) {
         prompt.innerHTML = 'Unable to capture WebCam. Please reload the page.';
     });   
}

init();