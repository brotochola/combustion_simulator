function dist(x1, y1, x2, y2) {
  var a = x1 - x2;
  var b = y1 - y2;
  return Math.sqrt(a * a + b * b);
}

function getRandomBrownishColor(minA, maxA) {
  let r = Math.floor(100 + Math.random() * 45);
  let g = Math.floor(20 + Math.random() * 40);
  let b = Math.floor(Math.random() * 50);

  if (minA == undefined) minA = 0;
  if (maxA == undefined) maxA = 1;

  let a = (minA + (maxA - minA) * Math.random()).toFixed(2);
  return { r, g, b, a };
  //   return "rgba(" + r + "," + g + "," + b + "," + a + ")";
}

function makeRGBA(o) {
  let alpha = (o || {}).a || 1;

  if (isNaN(alpha)) alpha = 1;

  return (
    "rgba(" +
    Math.floor(o.r) +
    "," +
    Math.floor(o.g) +
    "," +
    Math.floor(o.b) +
    "," +
    alpha +
    ")"
  );
}

function unique(arr) {
  return [...new Set(arr)];
}

function colorChannelMixer(colorChannelA, colorChannelB, amountToMix) {
  var channelA = colorChannelA * amountToMix;
  var channelB = colorChannelB * (1 - amountToMix);
  return parseInt(channelA + channelB);
}
//rgbA and rgbB are arrays, amountToMix ranges from 0.0 to 1.0
//example (red): rgbA = [255,0,0]
function colorMixer(rgbA, rgbB, amountToMix) {
  var r = colorChannelMixer(rgbA[0], rgbB[0], amountToMix);
  var g = colorChannelMixer(rgbA[1], rgbB[1], amountToMix);
  var b = colorChannelMixer(rgbA[2], rgbB[2], amountToMix);
  return { r, g, b };
}

function rgba2hex(orig) {
  var a,
    isPercent,
    rgb = orig
      .replace(/\s/g, "")
      .match(/^rgba?\((\d+),(\d+),(\d+),?([^,\s)]+)?/i),
    alpha = ((rgb && rgb[4]) || "").trim(),
    hex = rgb
      ? (rgb[1] | (1 << 8)).toString(16).slice(1) +
        (rgb[2] | (1 << 8)).toString(16).slice(1) +
        (rgb[3] | (1 << 8)).toString(16).slice(1)
      : orig;

  if (alpha !== "") {
    a = alpha;
  } else {
    a = 0o1;
  }
  // multiply before convert to HEX
  a = ((a * 255) | (1 << 8)).toString(16).slice(1);
  hex = hex + a;

  return hex;
}

function rgba2hex2(rgba) {
  let newColor = rgba2hex(rgba);
  newColor = "0x" + newColor.substr(0, newColor.length - 2);
  return newColor;
}
