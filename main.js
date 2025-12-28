console.log("main.js");

// Globals
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const FPS = 30
const CanvasWidth = 800;
const CanvasHeight = 600;
const FovFactor = 640;

// Pixel in buffer -> width * X + Y = pixel
//const FrameBuffer = new Uint32Array(CanvasWidth * CanvasHeight);

// Cube Vertices 9x9x9 Vec3
const CubeVertices = [];
const CubeVerticesProjected = [];
const CameraPosition = {x: 0, y: 0 , z: -5 };


function DrawPixel(point,color){
  if (point.x >= 0 && point.x < CanvasWidth && point.y >= 0 && point.y < CanvasHeight){
    ctx.fillStyle = color;
    ctx.fillRect(point.x,point.y,1,1);
  }
}

function ClearCanvas() {
  ctx.fillStyle = "black";
  ctx.fillRect(0,0,CanvasWidth,CanvasHeight);
}

function DrawGrid() {
  for (let i = 0; i < CanvasWidth; i+= 10){
    for (let j = 0; j < CanvasHeight; j+= 10){
        DrawPixel( { x: i, y: j }, "white" );
    }
  }
}


function DrawRect(x,y,w,h,color){
  for (let i = 0; i < w; i++){
    for (let j = 0; j < h; j++){
      let current_x = x + i;
      let current_y = y + j;
      DrawPixel( { x: current_x, y: current_y }, color );
    }
  }
}

function Init(){
  let i = 0;
  for (let x = -1; x <= 1; x+= 0.25){
    for (let y = -1; y <= 1; y+= 0.25){
      for (let z = -1; z <= 1; z+= 0.25){
        const point = { x, y, z };
        CubeVertices[i] = point;
        i++;
      }
    }
  }
  // Setup GameLoop 
  //setTimeout(GameLoop,1000/FPS);
}

/* --- Transforms  --- */
function RotateVec3X(point, angle){
  return {
    x : point.x,
    y : (point.y * Math.cos(angle)) -  (point.z * Math.sin(angle)),
    z : (point.y * Math.sin(angle)) +  (point.z * Math.cos(angle)),
  }
}

function RotateVec3Y(point, angle){
  return {
    x : (point.x * Math.cos(angle)) -  (point.z * Math.sin(angle)),
    y : point.y,
    z : (point.x * Math.sin(angle)) +  (point.z * Math.cos(angle)),
  }
}

function RotateVec3Z(point, angle){
  return {
    x : (point.x * Math.cos(angle)) -  (point.y * Math.sin(angle)),
    y : (point.x * Math.sin(angle)) +  (point.y * Math.cos(angle)),
    z : point.z,
  }
}

function ProjectPoint(point){
  return {
    x : (FovFactor * point.x) / point.z, 
    y : (FovFactor * point.y) / point.z};
}


let _cube_rotation_y = 0.0;
let _cube_rotation_x = 0.0;
let _cube_rotation_z = 0.0;

function Update(delta) {
  _cube_rotation_y  += 0.01;
  for (let i = 0; i < (9*9*9); i++){
    let _p = CubeVertices[i];
    let transformed_p = RotateVec3Y(_p, _cube_rotation_y);
    transformed_p.z -= CameraPosition.z;
    CubeVerticesProjected[i] = ProjectPoint(transformed_p);
  }
}

function Render(){
  ClearCanvas();
  //DrawGrid();
  for (let i = 0; i < (9*9*9); i++){
    const p = CubeVerticesProjected[i];
    DrawRect(p.x + (CanvasWidth / 2), p.y + (CanvasHeight / 2), 4, 4, "#FFFF00");
  }
}

function GameLoop(){
  const dt = 1 / FPS;
  Update(dt);
  Render();
  // Next Frame
  setTimeout(GameLoop, 1000/FPS);
}

Init();
GameLoop();
