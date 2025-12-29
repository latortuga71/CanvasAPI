console.log("main.js");


// Mesh Data
const MeshVertices = [
    { x : -1, y : -1, z : -1 }, // 1
    { x : -1, y :  1, z : -1 }, // 2
    { x :  1, y :  1, z : -1 }, // 3
    { x :  1, y : -1, z : -1 }, // 4
    { x :  1, y :  1, z :  1 }, // 5
    { x :  1, y : -1, z :  1 }, // 6
    { x : -1, y :  1, z :  1 }, // 7
    { x : -1, y : -1, z :  1 }  // 8
];

const MeshFaces = [
    { a : 1, b : 2, c : 3 },
    { a : 1, b : 3, c : 4 },
    { a : 4, b : 3, c : 5 },
    { a : 4, b : 5, c : 6 },
    { a : 6, b : 5, c : 7 },
    { a : 6, b : 7, c : 8 },
    { a : 8, b : 7, c : 2 },
    { a : 8, b : 2, c : 1 },
    { a : 2, b : 7, c : 5 },
    { a : 2, b : 5, c : 3 },
    { a : 6, b : 8, c : 1 },
    { a : 6, b : 1, c : 4 }
];


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
const TrianglesToRender = [];


const CubeMeshVertices = [];
const CubeMeshFaces = [];

function DrawPixel(point,color){
  if (point.x >= 0 && point.x < CanvasWidth && point.y >= 0 && point.y < CanvasHeight){
    ctx.fillStyle = color;
    ctx.fillRect(point.x,point.y,1,1);
  }
}
function DrawLine(x1,y1,x2,y2,color){
  const path = new Path2D();
  ctx.strokeStyle = color;
  ctx.lineWidth = 1;
  ctx.lineCap = "butt"; // butt  round  square <-- other options
  path.moveTo(x1, y1);
  path.lineTo(x2, y2);
  ctx.stroke(path);
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

function DrawTriangle(xy1,xy2,xy3,color){
  DrawLine(xy1.x,xy1.y,xy2.x,xy2.y,color);
  DrawLine(xy2.x,xy2.y,xy3.x,xy3.y,color);
  DrawLine(xy3.x,xy3.y,xy1.x,xy1.y,color);
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

async function FetchData(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Response status: ${response.status}`);
    }
    return response.text();
  } catch (error) {
    console.error(error.message);
  }
}

async function Init(){
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
  // Get The MeshData From File
  const cubeMeshData = await FetchData("./assets/cube.obj")
  //const cubeMeshData = await FetchData("./assets/f22.obj")
  console.log(cubeMeshData);
  // Parse the data
  let lines = cubeMeshData.split("\n");
  for (let i = 0; i < lines.length; i++){

    if (lines[i].startsWith("v")) {
      let line_split = lines[i].split(" ");
      let vec3 = {
        x : parseFloat(line_split[1]),
        y : parseFloat(line_split[2]),
        z : parseFloat(line_split[3])
      }
      CubeMeshVertices.push(vec3);
    }
    // vertex texture normal
    //f 1/1/1 2/2/1 3/3/1
    if (lines[i].startsWith("f")) {
      let line_split = lines[i].split(" ");
      let a = parseInt(line_split[1].split("/")[0]);
      let b = parseInt(line_split[2].split("/")[0]);
      let c = parseInt(line_split[3].split("/")[0]);

      CubeMeshFaces.push({a:a,b:b,c:c});

    }
  }
  console.log(CubeMeshFaces);
  console.log(CubeMeshVertices);
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

  // Old Way to render cube
  /*
  for (let i = 0; i < (9*9*9); i++){
    let _p = CubeVertices[i];
    let transformed_p = RotateVec3Y(_p, _cube_rotation_y);
    transformed_p.z -= CameraPosition.z;
    CubeVerticesProjected[i] = ProjectPoint(transformed_p);
  }
*/

function Update(delta) {
  _cube_rotation_y  += 0.01;
  for (let i = 0; i < CubeMeshFaces.length; i++){
    // Get Face Vertices
    const face = CubeMeshFaces[i];
    let faceVertices = [];
    faceVertices[0] = CubeMeshVertices[face.a - 1]
    faceVertices[1] = CubeMeshVertices[face.b - 1]
    faceVertices[2] = CubeMeshVertices[face.c - 1]
    // Transform Each Vertice Of The Face
    let projected_triangle = [];

    for (let j = 0; j < 3; j++){
      let transformed_vertex = faceVertices[j];
      transformed_vertex = RotateVec3Y(transformed_vertex, _cube_rotation_y);
      transformed_vertex.z -= CameraPosition.z;
      //CubeVerticesProjected[i] = ProjectPoint(transformed_vertex);
      // Save the projected point in a triangles to render global
      let projected_vertex = ProjectPoint(transformed_vertex);
      projected_vertex.x += (CanvasWidth / 2);
      projected_vertex.y += (CanvasHeight / 2);
      projected_triangle[j] = projected_vertex;
    }
    TrianglesToRender[i] = projected_triangle;
  }
  /*
  for (let i = 0; i < MeshFaces.length; i++){
    // Get Face Vertices
    const face = MeshFaces[i];
    let faceVertices = [];
    faceVertices[0] = MeshVertices[face.a - 1]
    faceVertices[1] = MeshVertices[face.b - 1]
    faceVertices[2] = MeshVertices[face.c - 1]
    // Transform Each Vertice Of The Face
    let projected_triangle = [];

    for (let j = 0; j < 3; j++){
      let transformed_vertex = faceVertices[j];
      transformed_vertex = RotateVec3Y(transformed_vertex, _cube_rotation_y);
      transformed_vertex.z -= CameraPosition.z;
      //CubeVerticesProjected[i] = ProjectPoint(transformed_vertex);
      // Save the projected point in a triangles to render global
      let projected_vertex = ProjectPoint(transformed_vertex);
      projected_vertex.x += (CanvasWidth / 2);
      projected_vertex.y += (CanvasHeight / 2);
      projected_triangle[j] = projected_vertex;
    }
    TrianglesToRender[i] = projected_triangle;
  }
  */


}

function Render(){
  ClearCanvas();
  for (let i = 0; i < CubeMeshFaces.length; i++){
    const triangle = TrianglesToRender[i];
    DrawRect(triangle[0].x, triangle[0].y ,3, 3, "#FFFF00");
    DrawRect(triangle[1].x, triangle[1].y ,3, 3, "#FFFF00");
    DrawRect(triangle[2].x, triangle[2].y ,3, 3, "#FFFF00");

    DrawTriangle(
      triangle[0],
      triangle[1],
      triangle[2],
      "#FFFF00"
    );
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
