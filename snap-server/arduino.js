const { execSync } = require('child_process');
let stdout = execSync('arduino --upload /Users/sebastianmeier/Sites/TSB/lndw-2018/snap-server/arduino/src/sketch/sketch.ino --port /dev/cu.usbmodem141441 --board arduino:avr:mega');
let stdout1 = execSync('open -a "Google Chrome"');