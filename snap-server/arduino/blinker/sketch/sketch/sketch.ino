#include <Adafruit_NeoPixel.h>
Adafruit_NeoPixel strip = Adafruit_NeoPixel(16, 6, NEO_RGB + NEO_KHZ800);

String textstr = "";

char nl = '\n';
char cmd = '$';

String command = "null";
bool commanding = false;
bool blinking = false;
int blink_count = 0;
int blink_max = 150;
bool blink_state = false;

void setup() {

  Serial.begin(9600);

  pinMode(6, OUTPUT);

  strip.begin();
  strip.show();
}

int default_r = 0;
int default_g = 0;
int default_b = 0;

void loop() {

  if(blinking){
    blink_count++;
    if(blink_count > blink_max){
      blink_count = 0;
      if(blink_state){
        blink_state = false;
      }else{
        blink_state = true;
      }
    }
  }

  if (Serial.available() > 0) {
    char received = Serial.read();
    
    if(received == nl){

      Serial.println(command);
      Serial.println(textstr);

      //!!!! Here the commands are being executed
      //The variable command holds the command send by the user
      //The variable textstr holds an additional variable send by the user
      
      if(command == "blinkOn"){
        blinking = true; blink_state = true;
      }else if(command == "blinkOff"){
        blinking = false;
        blink_state = false;
        default_r = 0;
        default_g = 0;
        default_b = 0;
      }else if(command == "allLightOn"){
        blinking = false;
        blink_state = false;
        default_r = 255;
        default_g = 255;
        default_b = 255;
      }else if(command == "allLightOff"){
        blinking = false;
        blink_state = false;
        default_r = 0;
        default_g = 0;
        default_b = 0;
      }
      
      textstr = "";
      command = "null";

    }else if(received == cmd){
      if(command == "null"){
        commanding = true;
        command = "";
      }else{
        commanding = false;
        textstr = "";
      }
    }else{
      if(commanding){
        command.concat(received);
      }else{
        textstr.concat(received);        
      }
    }
  }

  if(blinking && blink_state){
    for(int i = 0; i<= 16; i++){
      strip.setPixelColor(i, 10, 10, 10);
    }
  }else{
    for(int i = 0; i<= 16; i++){
      strip.setPixelColor(i, default_r, default_g, default_b);
    }
  }
  
  strip.show();
}


