let minW;
let mc;

let canvasElement;

let canvas;

let mainText = "「ちょっとした秘密」を入力してください";

let mtV = "";
let mtR = "";

let rectColor = "#eee";

let isMidiReady = false;

// パラメーター
let bts;
let ts = 0;
let sw = 0;
let bokeh = 0;
let angle = 0;
let tX, tY;
let offset;

let isVertical = false;
let isReverse = false;
let isMirror = false;
let isSerif = false;
let isOffsetFt = true;
let nx, ny, area, nxv, nyv;

let warpXW = 0;
let warpXH = 0;
let warpYW = 0;
let warpYH = 0;

// Shader --------------------------------------------- start
let theShader;
let vs = `
   precision highp float;
   precision highp int;

   attribute vec3 aPosition;
   attribute vec2 aTexCoord;

   varying vec2 vTexCoord;

   uniform mat4 uProjectionMatrix;
   uniform mat4 uModelViewMatrix;

    void main() {
      vec4 positionVec4 = vec4(aPosition, 1.0);
      gl_Position = uProjectionMatrix * uModelViewMatrix * positionVec4;
      vTexCoord = aTexCoord;
   }
`;

let fs = `
   precision highp float;
   precision highp int;

   varying vec2 vTexCoord;

   uniform sampler2D u_tex;
   uniform float u_time;
  uniform float u_warpXH;
  uniform float u_warpYH;
  uniform float u_warpXW;
  uniform float u_warpYW;

   float pi = 3.14159265358979;

   void main() {

      vec2 uv = vTexCoord;
      uv.x += u_warpXH * cos(uv.y*pi*u_warpXW);
      uv.y += u_warpYH * sin(uv.x*pi*u_warpYW);
      vec4 tex = texture2D(u_tex, uv);

      gl_FragColor = tex;
    }
`;
// Shader --------------------------------------------- end

// MIDI ----------------------------------------------- start

// function getIsMidiReady() {
//   return isMidiReady;
// }

// function onMIDISuccess(midiAccess) {
//   console.log("MIDI ready!");
//   const input = midiAccess.inputs.values().next();
//   console.log(input.value.manufacturer);
//   console.log(input.value.name);
//   isMidiReady = true;
//   input.value.onmidimessage = onMIDIMessage;
// }

// function onMIDIFailure(msg) {
//   isMidiReady = false;
//   console.log("Failed to get MIDI access - " + msg);
// }

// function onMIDIMessage(message) {
//   const data = message.data;
//   console.log("MIDI data: ", data);

//   if (!isOffsetFt) rectColor = "#fff";

//   switch (data[1]) {
//     case 2:
//       ts = map(data[2], 0, 176, 1, 4) * bts;
//       break;
//     case 3:
//       sw = map(data[2], 0, 176, 0, ts);
//       break;
//     case 4:
//       bokeh = map(data[2], 0, 176, 0, minW / 10);
//       break;
//     case 5:
//       warpXH = map(data[2], 0, 176, 0, 0.1);
//       break;
//     case 6:
//       warpYH = map(data[2], 0, 176, 0, 0.1);
//       break;
//     case 8:
//       offset = map(data[2], 0, 127, 0, width / 3);
//       break;
//     case 13:
//       tX = map(data[2], 0, 127, 0, minW);
//       break;
//     case 14:
//       tY = map(data[2], 0, 127, 0, minW);
//       break;
//     case 15:
//       angle = map(data[2], 0, 127, 0, PI * 2);
//       break;
//     case 16:
//       warpXW = map(data[2], 0, 127, 0, 50);
//       break;
//     case 17:
//       warpYW = map(data[2], 0, 127, 0, 50);
//       break;
//     case 18:
//       offsetX = map(data[2], 0, 127, 0, minW);
//       rectColor = "#eee";
//       isOffsetFt = false;
//       break;
//     case 19:
//       offsetY = map(data[2], 0, 127, 0, minW);
//       rectColor = "#eee";
//       isOffsetFt = false;
//       break;
//     case 62:
//       isVertical = data[2] === 0 ? false : true;
//       break;
//     case 63:
//       isReverse = data[2] === 0 ? false : true;
//       break;
//     case 80:
//       isMirror = data[2] === 0 ? false : true;
//       break;
//     case 81:
//       isSerif = data[2] === 0 ? false : true;
//       break;
//   }
// }

// MIDI ----------------------------------------------- end

function reverseString(str) {
  let strArray = str.split(""); // 文字列を分割して配列に格納
  let reversedArray = strArray.reverse(); // 配列を逆順にする
  let reversedStr = reversedArray.join(""); // 配列を結合して文字列にする
  return reversedStr;
}

function reverseOrder(str) {
  let ro = "";
  for (let i = 0; i < str.length; i++) {
    ro += str.slice(i, i + 1);
    if (i < str.length - 1) ro += "\n";
  }
  return ro;
}

function setup() {
  canvasElement = document.getElementById("myCanvas");
  minW = canvasElement.offsetWidth;
  canvas = createCanvas(minW, minW, WEBGL);
  canvas.parent(canvasElement);

  const getText = document.getElementById("secret-text");
  mainText = getText.value;

  // Shader
  theShader = createShader(vs, fs);
  textureMode(NORMAL);

  // createGraphics
  mc = createGraphics(minW, minW);
  mc.strokeJoin(ROUND);
  mc.textAlign(CENTER, CENTER);
  mc.textFont("Noto Sans JP");
  mc.stroke("#000");
  // rectMode(CENTER);

  // text setting
  tX = mc.width / 2;
  tY = mc.height / 2;
  offset = 0;

  nx = ceil(sqrt(mainText.length));
  ny = ceil(mainText.length / nx);
  nxv = ny;
  nyv = nx;

  area = width - offset * 2;
  bts = area / nx / 3;
  ts = bts;

  mtR = reverseString(mainText);

  mc.textLeading(ts * 1.1);

  frameRate(30);

  navigator.requestMIDIAccess().then(onMIDISuccess, onMIDIFailure);
}

function windowResized() {
  canvasElement = document.getElementById("myCanvas");
  canvas.parent(canvasElement);
  minW = canvasElement.offsetWidth;
  resizeCanvas(minW, minW, WEBGL);
}

function draw() {
  // canvasElementに変更があったらsetupを再実行
  const getText = document.getElementById("secret-text");
  if (mainText !== getText.value) {
    mainText = getText.value;
    setup();
  }

  if (!isMidiReady) {
    ts = map(document.getElementById("slider_ts").value, 0, 100, 1, 4) * bts;
    sw = map(document.getElementById("slider_ol").value, 0, 100, 0, ts);
    bokeh = map(
      document.getElementById("slider_bokeh").value,
      0,
      100,
      0,
      minW / 10
    );
    tX = map(document.getElementById("slider_px").value, 0, 100, 0, minW);
    tY = map(document.getElementById("slider_py").value, 0, 100, 0, minW);
    offset = map(
      document.getElementById("slider_offset").value,
      0,
      100,
      0,
      width / 3
    );
    warpXH = map(document.getElementById("slider_dxr").value, 0, 100, 0, 0.1);
    warpXW = map(document.getElementById("slider_dxf").value, 0, 100, 0, 50);
    warpYH = map(document.getElementById("slider_dyr").value, 0, 100, 0, 0.1);
    warpYW = map(document.getElementById("slider_dyf").value, 0, 100, 0, 50);
    angle = map(
      document.getElementById("slider_rotation").value,
      0,
      100,
      0,
      PI * 2
    );
    isVertical = document.getElementById("vh_v").checked ? true : false;
    isMirror = document.getElementById("m_d").checked ? false : true;
    isReverse = document.getElementById("r_d").checked ? false : true;
    isSerif = document.getElementById("sf_serif").checked ? true : false;
  }

  area = width - offset * 2;
  bts = area / nx / 3;

  background("#eee");

  mc.clear();

  mc.background("#fff");

  mc.textSize(ts);
  mc.strokeWeight(sw);
  if (isSerif) mc.textFont("Noto Serif JP");
  else mc.textFont("Noto Sans JP");

  mc.push();
  mc.translate(tX, tY);
  mc.rotate(angle); // 回転

  //   if(!isReverse){
  //     if(!isVertical)
  //       mc.text(mainText, 0, 0);
  //     else
  //       mc.text(reverseOrder(mainText), 0, 0);
  //   }else{
  //     if(!isVertical)
  //       mc.text(mtR, 0, 0);
  //     else
  //       mc.text(reverseOrder(mtR), 0, 0);
  //   }

  let x, y;

  mc.drawingContext.filter = "blur(" + bokeh + "px)";

  if (isVertical) {
    for (let i = 0; i < ny; i++) {
      for (let j = 0; j <= nx; j++) {
        mc.push();
        x =
          -width / 2 +
          (area / nx) * j +
          area / nx / 2 +
          width -
          (min(width, height) - offset);
        y =
          -height / 2 +
          (area / ny) * i +
          area / ny / 2 +
          height -
          (width - offset);

        mc.translate(x, y);

        strokeWeight(sw);
        mc.fill("#000");

        if (isReverse) mc.text(mtR.charAt(i + (ny - j) * ny), 0, 0);
        else mc.text(mainText.charAt(i + (ny - j) * ny), 0, 0);
        mc.pop();
      }
    }
  } else {
    for (let i = 0; i <= ny; i++) {
      for (let j = 0; j < nx; j++) {
        mc.push();
        x =
          -width / 2 +
          (area / nx) * j +
          area / nx / 2 +
          width -
          (min(width, height) - offset);
        y =
          -height / 2 +
          (area / ny) * i +
          area / ny / 2 +
          height -
          (width - offset);

        mc.translate(x, y);

        strokeWeight(sw);
        mc.fill("#000");

        if (isReverse) mc.text(mtR.charAt(j + i * nx), 0, 0);
        else mc.text(mainText.charAt(j + i * nx), 0, 0);

        mc.pop();
      }
    }
  }

  mc.pop();

  // if (bokeh !== 0) mc.filter(BLUR, bokeh);

  shader(theShader);
  theShader.setUniform(`u_tex`, mc);
  theShader.setUniform(`u_time`, -frameCount / 35);
  theShader.setUniform(`u_warpXH`, warpXH);
  theShader.setUniform(`u_warpYH`, warpYH);
  theShader.setUniform(`u_warpXW`, warpXW);
  theShader.setUniform(`u_warpYW`, warpYW);

  mc.push();
  if (!isMirror) image(mc, -width / 2, -height / 2, width, height);
  else {
    scale(-1, 1);
    image(mc, -width / 2, -height / 2, width, height);
  }
  mc.pop();

  mc.remove();
}
