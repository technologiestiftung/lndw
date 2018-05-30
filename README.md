# lndw

##  Adafruit Thermalprinter Workaround

Sending bitmaps as 8bit chunks through the serial port is a mess and the memory of even an arduino mega is not enough.

The default example suggests using PREGMEM, which works okey. As an alternative we are uploading a new arduino build with corresponding image everytime we need to print something.

In order to upload the file we use arduino IDE's command line tools. Normally when you run the Arduino CLI on a mac it will switch to the builder and even show a splash screen. 

Avoiding the application switch can be done by editing the Arduino.app's Info.plist file. And adding the following to lines of code:

´´´
<key>LSBackgroundOnly</key>
<string>true</string>
<key>LSUIElement</key>
<string>true</string>
´´´

This will still leave you with a splash screen. I could not figure out how to solve this, but somebody suggested simply renaming the splash.png in Arduino's Resource/Java folder, which is hacky but it works.

The next obstacle is the amount of bitmaps you might want to print. If you just have a small bitmap you are all good. But having a series of bitmaps will likely result in random errors in the printing process.

In order to give chrome focus again, simple use the open command


´´´
const { execSync } = require('child_process');
let stdout = execSync('arduino --upload /Users/sebastianmeier/Sites/TSB/lndw-2018/snap-server/arduino/src/sketch/sketch.ino --port /dev/cu.usbmodem141441 --board arduino:avr:mega');
let stdout1 = execSync('open -a "Google Chrome"');
´´´

In the above code the port and the board need to be modified

If chrome is not available in your path simply add it:

´´´
export PATH=$PATH:/Applications/Arduino.app/Contents/MacOS
´´´

