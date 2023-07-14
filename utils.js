function dist(x1, y1, x2, y2) {
  var a = x1 - x2;
  var b = y1 - y2;
  return Math.sqrt(a * a + b * b);
}

function getRandomBrownishColor(minA, maxA) {
  let r = Math.floor(150 + Math.random() * 45);
  let g = Math.floor(20 + Math.random() * 40);
  let b = Math.floor(Math.random() * 50);

  if (minA == undefined) minA = 0;
  if (maxA == undefined) maxA = 1;

  let a = (minA + (maxA - minA) * Math.random()).toFixed(2);
  return "rgba(" + r + "," + g + "," + b + "," + a + ")";
}
