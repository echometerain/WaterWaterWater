// Base variables / constants
const widgetSize = 40;
const grids = 10; // number of widgets in a row
const canvasSize = widgetSize * grids;
const sideBarSize = 80;
const maxH = 9.0; // many batteries are 9V
const startH = maxH / 2.0; // start with half charge
const lakeWidth = 16; // width of the lake
const maxBright = 0.9;
const minBright = 0.2;
const velo = 0.507; // velocity of the water, 0.707 max

const outer = (widgetSize + lakeWidth) / 2;
const inner = (widgetSize - lakeWidth) / 2;

const pointsArray = [new Array(canvasSize), [], []];
const blockedArray = new Array(canvasSize);
// Points array indices
const NOW = 0;
const LAST = 1;
const NEXT = 2;

let widgetGrid = new Array(grids);

// Base classes
class Widget {
  pos = [0, 0]; // position on the grid
  cwRot = 0; // clockwise rotation
  constructor(posY, posX, cwRot) {
    this.pos = [posY, posX];
    this.cwRot = cwRot;
  }
  drawFrame = () => {}; // graphical update
  update = () => {}; // logical update
  destructor = () => {
    // clear the widget
    for (let i = 0; i < widgetSize; i++) {
      for (let j = 0; j < widgetSize; j++) {
        let y = this.pos[0] * widgetSize + i;
        let x = this.pos[1] * widgetSize + j;
        blockedArray[y][x] = true;
        pointsArray[NOW][y][x] = startH;
        pointsArray[LAST][y][x] = startH;
        pointsArray[NEXT][y][x] = startH;
      }
    }
  };
}

// Rotate a point around a center using rotation matrix
let rotatePoint = (x, y, centerX, centerY, angle) => {
  let radians = (Math.PI / 180) * angle;
  let cos = Math.cos(radians);
  let sin = Math.sin(radians);
  let nx = cos * (x - centerX) - sin * (y - centerY) + centerX;
  let ny = sin * (x - centerX) + cos * (y - centerY) + centerY;
  nx = Math.round(nx);
  ny = Math.round(ny);
  if (nx >= 0 && nx < canvasSize && ny >= 0 && ny < canvasSize) {
    return [nx, ny];
  }
  return null;
};

class Bend extends Widget {
  constructor(posY, posX, cwRot) {
    super(posY, posX, cwRot);
    let centerY = posY * widgetSize + widgetSize / 2;
    let centerX = posX * widgetSize + widgetSize / 2;
    for (let i = 0; i < outer; i++) {
      for (let j = 0; j < outer; j++) {
        let y = posY * widgetSize + i;
        let x = posX * widgetSize + j;
        if (i > inner || j > inner) {
          let rotatedPoint = rotatePoint(x, y, centerX, centerY, cwRot * 90);
          if (rotatedPoint) {
            let [rotatedX, rotatedY] = rotatedPoint;
            blockedArray[rotatedY][rotatedX] = false;
          }
        }
      }
    }
  }
  drawFrame = () => {};
  update = () => {
    // logical update
  };
}

class Straight extends Widget {
  constructor(posY, posX, cwRot) {
    super(posY, posX, cwRot);

    let centerY = posY * widgetSize + widgetSize / 2;
    let centerX = posX * widgetSize + widgetSize / 2;
    for (let i = 0; i < widgetSize; i++) {
      for (let j = 0; j < widgetSize; j++) {
        let y = posY * widgetSize + i;
        let x = posX * widgetSize + j;
        if (j > inner && j < outer) {
          // vertical
          let rotatedPoint = rotatePoint(x, y, centerX, centerY, cwRot * 90);
          if (rotatedPoint) {
            let [rotatedX, rotatedY] = rotatedPoint;
            blockedArray[rotatedY][rotatedX] = false;
          }
        }
      }
    }
    // console.log(points);
  }
  drawFrame = () => {};
  update = () => {
    // logical update
  };
}

// Helper functions
let centerRect = (x, y, w, h) => {
  rect(x - w / 2, y - h / 2, w, h);
};

let calcWave = (i, j) => {
  let check = (i, j, i0, j0) =>
    i < 0 || i >= canvasSize || j < 0 || j >= canvasSize || blockedArray[i0][j0]
      ? pointsArray[NOW][i0][j0]
      : pointsArray[NOW][i][j];
  pointsArray[NEXT][i][j] =
    velo *
      velo * // 2d wave equation
      (check(i, j + 1, i, j) -
        2 * pointsArray[NOW][i][j] +
        check(i, j - 1, i, j) +
        (check(i + 1, j, i, j) -
          2 * pointsArray[NOW][i][j] +
          check(i - 1, j, i, j))) -
    pointsArray[LAST][i][j] +
    2 * pointsArray[NOW][i][j];
};

function setup() {
  background(220);
  pixelDensity(1);
  // Base Arrays
  for (let i = 0; i < canvasSize; i++) {
    pointsArray[NOW][i] = new Array(canvasSize);
    blockedArray[i] = new Array(canvasSize);
    for (let j = 0; j < canvasSize; j++) {
      pointsArray[NOW][i][j] = startH; // height
      blockedArray[i][j] = true; // isBlocked
    }
  }
  pointsArray[NEXT] = structuredClone(pointsArray[NOW]);
  pointsArray[LAST] = structuredClone(pointsArray[NOW]);

  for (let i = 0; i < grids; i++) {
    widgetGrid[i] = new Array(grids);
    for (let j = 0; j < grids; j++) {
      widgetGrid[i][j] = new Bend(i, j, 1);
      // Example of adding a Straight widget
      // if (i === 1 && j === 1) {
      //   widgetGrid[i][j] = new Straight(i, j, 1);
      // }
    }
  }
  createCanvas(canvasSize + sideBarSize, canvasSize);
  // widgetGrid[0][0] = new Bend(0, 0, 0);
  // console.log(widgetGrid[0][0]);
}

function mouseClicked() {
  if (mouseX >= canvasSize || mouseY >= canvasSize) {
    return;
  }
  let x = Math.floor(mouseX / widgetSize);
  let y = Math.floor(mouseY / widgetSize);
  if (widgetGrid[y][x] == undefined) {
    return;
  }
  let cwRot = widgetGrid[y][x].cwRot;
  widgetGrid[y][x].destructor();
  widgetGrid[y][x] = new Bend(y, x, (cwRot + 1) % 4);
}

function mouseMoved() {
  // console.log("hi");
  if (mouseX >= canvasSize || mouseY >= canvasSize) {
    return;
  }
  pointsArray[NOW][mouseY][mouseX] = maxH;
  // points[mouseY][mouseX].blocked = !points[mouseY][mouseX].blocked;
}

function draw() {
  // draw every Point on the canvas
  background(220);
  loadPixels();
  for (let i = 0; i < canvasSize; i++) {
    for (let j = 0; j < canvasSize; j++) {
      if (!blockedArray[i][j]) {
        calcWave(i, j);
        let index = 4 * (i * (canvasSize + sideBarSize) + j);
        let brightness = (255 * pointsArray[NEXT][i][j]) / maxH;
        pixels[index] = 0; // red
        pixels[index + 1] = 0; // green
        pixels[index + 2] = brightness; // blue
        pixels[index + 3] = 255; // alpha
      }
    }
  }
  let temp = pointsArray[LAST];
  pointsArray[LAST] = pointsArray[NOW];
  pointsArray[NOW] = pointsArray[NEXT];
  pointsArray[NEXT] = temp;
  updatePixels();

  for (let i = 0; i < grids; i++) {
    line(0, widgetSize * i, canvasSize, widgetSize * i);
    line(widgetSize * i, 0, widgetSize * i, canvasSize);
    for (let j = 0; j < grids; j++) {
      if (widgetGrid[i][j] != undefined) {
        widgetGrid[i][j].drawFrame();
        widgetGrid[i][j].update();
      }
    }
  }
  line(canvasSize, 0, canvasSize, canvasSize);
  line(0, canvasSize, canvasSize, canvasSize);
}
