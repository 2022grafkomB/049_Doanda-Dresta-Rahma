"use strict";

function main() {
  // Get A WebGL context
  /** @type {HTMLCanvasElement} */
  var canvas = document.querySelector("#canvas");
  var gl = canvas.getContext("webgl");
  if (!gl) {
    return;
  }

  // setup GLSL program
  var program = webglUtils.createProgramFromScripts(gl, ["vertex-shader-3d", "fragment-shader-3d"]);

  // look up where the vertex data needs to go.
  var positionLocation = gl.getAttribLocation(program, "a_position");
  var colorLocation = gl.getAttribLocation(program, "a_color");

  // lookup uniforms
  var matrixLocation = gl.getUniformLocation(program, "u_matrix");

  // Create a buffer to put positions in
  var positionBuffer = gl.createBuffer();
  // Bind it to ARRAY_BUFFER (think of it as ARRAY_BUFFER = positionBuffer)
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  // Put geometry data into buffer
  setGeometry(gl);

  // Create a buffer to put colors in
  var colorBuffer = gl.createBuffer();
  // Bind it to ARRAY_BUFFER (think of it as ARRAY_BUFFER = colorBuffer)
  gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
  // Put geometry data into buffer
  setColors(gl);

  function radToDeg(r) {
    return r * 180 / Math.PI;
  }

  function degToRad(d) {
    return d * Math.PI / 180;
  }

  var translation = [-150, 0, -360];
  var rotation = [degToRad(190), degToRad(40), degToRad(320)];
  var scale = [1, 1, 1];
  var fieldOfViewRadians = degToRad(60);
  var cameraAngleRadians = degToRad(133);

  drawScene();

  

  // Setup a ui.
  webglLessonsUI.setupSlider("#fieldOfView", {value: radToDeg(fieldOfViewRadians), slide: updateFieldOfView, min: 1, max: 179});
  webglLessonsUI.setupSlider("#x", {value: translation[0], slide: updatePosition(0), min: -200, max: 200 });
  webglLessonsUI.setupSlider("#y", {value: translation[1], slide: updatePosition(1), min: -200, max: 200});
  webglLessonsUI.setupSlider("#z", {value: translation[2], slide: updatePosition(2), min: -1000, max: 0});
  webglLessonsUI.setupSlider("#angleX", {value: radToDeg(rotation[0]), slide: updateRotation(0), max: 360});
  webglLessonsUI.setupSlider("#angleY", {value: radToDeg(rotation[1]), slide: updateRotation(1), max: 360});
  webglLessonsUI.setupSlider("#angleZ", {value: radToDeg(rotation[2]), slide: updateRotation(2), max: 360});
  webglLessonsUI.setupSlider("#scaleX", {value: scale[0], slide: updateScale(0), min: -5, max: 5, step: 0.01, precision: 2});
  webglLessonsUI.setupSlider("#scaleY", {value: scale[1], slide: updateScale(1), min: -5, max: 5, step: 0.01, precision: 2});
  webglLessonsUI.setupSlider("#scaleZ", {value: scale[2], slide: updateScale(2), min: -5, max: 5, step: 0.01, precision: 2});
  webglLessonsUI.setupSlider("#cameraAngle", {value: radToDeg(cameraAngleRadians), slide: updateCameraAngle, min: -360, max: 360});

  function updateCameraAngle(event, ui) {
    cameraAngleRadians = degToRad(ui.value);
    drawScene();
  }

  function updateFieldOfView(event, ui) {
    fieldOfViewRadians = degToRad(ui.value);
    drawScene();
  }

  function updatePosition(index) {
    return function(event, ui) {
      translation[index] = ui.value;
      drawScene();
    };
  }

  function updateRotation(index) {
    return function(event, ui) {
      var angleInDegrees = ui.value;
      var angleInRadians = angleInDegrees * Math.PI / 180;
      rotation[index] = angleInRadians;
      drawScene();
    };
  }

  function updateScale(index) {
    return function(event, ui) {
      scale[index] = ui.value;
      drawScene();
    };
  }

  // Draw the scene.
  function drawScene() {
    webglUtils.resizeCanvasToDisplaySize(gl.canvas);

    // Tell WebGL how to convert from clip space to pixels
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    // Clear the canvas AND the depth buffer.
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // Turn on culling. By default backfacing triangles
    // will be culled.
    gl.enable(gl.CULL_FACE);

    // Enable the depth buffer
    gl.enable(gl.DEPTH_TEST);

    // Tell it to use our program (pair of shaders)
    gl.useProgram(program);

    // Turn on the position attribute
    gl.enableVertexAttribArray(positionLocation);

    // Bind the position buffer.
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

    // Tell the position attribute how to get data out of positionBuffer (ARRAY_BUFFER)
    var size = 3;          // 3 components per iteration
    var type = gl.FLOAT;   // the data is 32bit floats
    var normalize = false; // don't normalize the data
    var stride = 0;        // 0 = move forward size * sizeof(type) each iteration to get the next position
    var offset = 0;        // start at the beginning of the buffer
    gl.vertexAttribPointer(
        positionLocation, size, type, normalize, stride, offset);

    // Turn on the color attribute
    gl.enableVertexAttribArray(colorLocation);

    // Bind the color buffer.
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);

    // Tell the attribute how to get data out of colorBuffer (ARRAY_BUFFER)
    var size = 3;                 // 3 components per iteration
    var type = gl.UNSIGNED_BYTE;  // the data is 8bit unsigned values
    var normalize = true;         // normalize the data (convert from 0-255 to 0-1)
    var stride = 0;               // 0 = move forward size * sizeof(type) each iteration to get the next position
    var offset = 0;               // start at the beginning of the buffer
    gl.vertexAttribPointer(
        colorLocation, size, type, normalize, stride, offset);

    var numFs = 5;
    var radius = 180;

    // Compute the matrix
    var aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
    var zNear = 1;
    var zFar = 2000;
    var matrix = m4.perspective(fieldOfViewRadians, aspect, zNear, zFar);
    var projectionMatrix = m4.perspective(fieldOfViewRadians, aspect, zNear, zFar);
    matrix = m4.translate(matrix, translation[0], translation[1], translation[2]);
    matrix = m4.xRotate(matrix, rotation[0]);
    matrix = m4.yRotate(matrix, rotation[1]);
    matrix = m4.zRotate(matrix, rotation[2]);
    matrix = m4.scale(matrix, scale[0], scale[1], scale[2]);


    var fPosition = [radius, 0, 0];
    // Use matrix math to compute a position on a circle where
    // the camera is
    matrix = m4.yRotation(cameraAngleRadians);
    matrix = m4.translate(matrix,translation[0], translation[1], translation[2]);
    // Get the camera's position from the matrix we computed
    var cameraPosition = [
      matrix[12],
      matrix[13],
      matrix[14],
    ];
    var up = [0, 1, 0];
    // Compute the camera's matrix using look at.
    var matrix = m4.lookAt(cameraPosition, fPosition, up);
    // Make a view matrix from the camera matrix
    var viewMatrix = m4.inverse(matrix);
    // Compute a view projection matrix
    var viewProjectionMatrix = m4.multiply(projectionMatrix, viewMatrix);

    for (var ii = 0; ii < numFs; ++ii) {
        var angle = ii * Math.PI * 2 / numFs;
        var x = Math.cos(angle) * radius;
        var y = Math.sin(angle) * radius;
  
        // starting with the view projection matrix
        // compute a matrix for the F
        var matrix = m4.translate(viewProjectionMatrix, x, 0, y);
  
        // Set the matrix.
        gl.uniformMatrix4fv(matrixLocation, false, matrix);
  
        // Draw the geometry.
        var primitiveType = gl.TRIANGLES;
        var offset = 0;
        var count = 25 * 6;
        gl.drawArrays(primitiveType, offset, count);
      }   
  }
}

function subtractVectors(a, b) {
    return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
  }

function normalize(v) {
    var length = Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]);
    // make sure we don't divide by 0.
    if (length > 0.00001) {
        return [v[0] / length, v[1] / length, v[2] / length];
    } else {
        return [0, 0, 0];
    }
}

function cross(a, b) {
    return [a[1] * b[2] - a[2] * b[1],
            a[2] * b[0] - a[0] * b[2],
            a[0] * b[1] - a[1] * b[0]];
}
  

var m4 = {

    lookAt: function(cameraPosition, target, up) {
        var zAxis = normalize(
            subtractVectors(cameraPosition, target));
        var xAxis = normalize(cross(up, zAxis));
        var yAxis = normalize(cross(zAxis, xAxis));
    
        return [
           xAxis[0], xAxis[1], xAxis[2], 0,
           yAxis[0], yAxis[1], yAxis[2], 0,
           zAxis[0], zAxis[1], zAxis[2], 0,
           cameraPosition[0],
           cameraPosition[1],
           cameraPosition[2],
           1,
        ];
      },    

  perspective: function(fieldOfViewInRadians, aspect, near, far) {
    var f = Math.tan(Math.PI * 0.5 - 0.5 * fieldOfViewInRadians);
    var rangeInv = 1.0 / (near - far);

    return [
      f / aspect, 0, 0, 0,
      0, f, 0, 0,
      0, 0, (near + far) * rangeInv, -1,
      0, 0, near * far * rangeInv * 2, 0
    ];
  },

  projection: function(width, height, depth) {
    // Note: This matrix flips the Y axis so 0 is at the top.
    return [
       2 / width, 0, 0, 0,
       0, -2 / height, 0, 0,
       0, 0, 2 / depth, 0,
      -1, 1, 0, 1,
    ];
  },

  multiply: function(a, b) {
    var a00 = a[0 * 4 + 0];
    var a01 = a[0 * 4 + 1];
    var a02 = a[0 * 4 + 2];
    var a03 = a[0 * 4 + 3];
    var a10 = a[1 * 4 + 0];
    var a11 = a[1 * 4 + 1];
    var a12 = a[1 * 4 + 2];
    var a13 = a[1 * 4 + 3];
    var a20 = a[2 * 4 + 0];
    var a21 = a[2 * 4 + 1];
    var a22 = a[2 * 4 + 2];
    var a23 = a[2 * 4 + 3];
    var a30 = a[3 * 4 + 0];
    var a31 = a[3 * 4 + 1];
    var a32 = a[3 * 4 + 2];
    var a33 = a[3 * 4 + 3];
    var b00 = b[0 * 4 + 0];
    var b01 = b[0 * 4 + 1];
    var b02 = b[0 * 4 + 2];
    var b03 = b[0 * 4 + 3];
    var b10 = b[1 * 4 + 0];
    var b11 = b[1 * 4 + 1];
    var b12 = b[1 * 4 + 2];
    var b13 = b[1 * 4 + 3];
    var b20 = b[2 * 4 + 0];
    var b21 = b[2 * 4 + 1];
    var b22 = b[2 * 4 + 2];
    var b23 = b[2 * 4 + 3];
    var b30 = b[3 * 4 + 0];
    var b31 = b[3 * 4 + 1];
    var b32 = b[3 * 4 + 2];
    var b33 = b[3 * 4 + 3];
    return [
      b00 * a00 + b01 * a10 + b02 * a20 + b03 * a30,
      b00 * a01 + b01 * a11 + b02 * a21 + b03 * a31,
      b00 * a02 + b01 * a12 + b02 * a22 + b03 * a32,
      b00 * a03 + b01 * a13 + b02 * a23 + b03 * a33,
      b10 * a00 + b11 * a10 + b12 * a20 + b13 * a30,
      b10 * a01 + b11 * a11 + b12 * a21 + b13 * a31,
      b10 * a02 + b11 * a12 + b12 * a22 + b13 * a32,
      b10 * a03 + b11 * a13 + b12 * a23 + b13 * a33,
      b20 * a00 + b21 * a10 + b22 * a20 + b23 * a30,
      b20 * a01 + b21 * a11 + b22 * a21 + b23 * a31,
      b20 * a02 + b21 * a12 + b22 * a22 + b23 * a32,
      b20 * a03 + b21 * a13 + b22 * a23 + b23 * a33,
      b30 * a00 + b31 * a10 + b32 * a20 + b33 * a30,
      b30 * a01 + b31 * a11 + b32 * a21 + b33 * a31,
      b30 * a02 + b31 * a12 + b32 * a22 + b33 * a32,
      b30 * a03 + b31 * a13 + b32 * a23 + b33 * a33,
    ];
  },

  translation: function(tx, ty, tz) {
    return [
       1,  0,  0,  0,
       0,  1,  0,  0,
       0,  0,  1,  0,
       tx, ty, tz, 1,
    ];
  },

  xRotation: function(angleInRadians) {
    var c = Math.cos(angleInRadians);
    var s = Math.sin(angleInRadians);

    return [
      1, 0, 0, 0,
      0, c, s, 0,
      0, -s, c, 0,
      0, 0, 0, 1,
    ];
  },

  yRotation: function(angleInRadians) {
    var c = Math.cos(angleInRadians);
    var s = Math.sin(angleInRadians);

    return [
      c, 0, -s, 0,
      0, 1, 0, 0,
      s, 0, c, 0,
      0, 0, 0, 1,
    ];
  },

  zRotation: function(angleInRadians) {
    var c = Math.cos(angleInRadians);
    var s = Math.sin(angleInRadians);

    return [
       c, s, 0, 0,
      -s, c, 0, 0,
       0, 0, 1, 0,
       0, 0, 0, 1,
    ];
  },

  scaling: function(sx, sy, sz) {
    return [
      sx, 0,  0,  0,
      0, sy,  0,  0,
      0,  0, sz,  0,
      0,  0,  0,  1,
    ];
  },

  translate: function(m, tx, ty, tz) {
    return m4.multiply(m, m4.translation(tx, ty, tz));
  },

  xRotate: function(m, angleInRadians) {
    return m4.multiply(m, m4.xRotation(angleInRadians));
  },

  yRotate: function(m, angleInRadians) {
    return m4.multiply(m, m4.yRotation(angleInRadians));
  },

  zRotate: function(m, angleInRadians) {
    return m4.multiply(m, m4.zRotation(angleInRadians));
  },

  scale: function(m, sx, sy, sz) {
    return m4.multiply(m, m4.scaling(sx, sy, sz));
  },

  inverse: function(m) {
    var m00 = m[0 * 4 + 0];
    var m01 = m[0 * 4 + 1];
    var m02 = m[0 * 4 + 2];
    var m03 = m[0 * 4 + 3];
    var m10 = m[1 * 4 + 0];
    var m11 = m[1 * 4 + 1];
    var m12 = m[1 * 4 + 2];
    var m13 = m[1 * 4 + 3];
    var m20 = m[2 * 4 + 0];
    var m21 = m[2 * 4 + 1];
    var m22 = m[2 * 4 + 2];
    var m23 = m[2 * 4 + 3];
    var m30 = m[3 * 4 + 0];
    var m31 = m[3 * 4 + 1];
    var m32 = m[3 * 4 + 2];
    var m33 = m[3 * 4 + 3];
    var tmp_0  = m22 * m33;
    var tmp_1  = m32 * m23;
    var tmp_2  = m12 * m33;
    var tmp_3  = m32 * m13;
    var tmp_4  = m12 * m23;
    var tmp_5  = m22 * m13;
    var tmp_6  = m02 * m33;
    var tmp_7  = m32 * m03;
    var tmp_8  = m02 * m23;
    var tmp_9  = m22 * m03;
    var tmp_10 = m02 * m13;
    var tmp_11 = m12 * m03;
    var tmp_12 = m20 * m31;
    var tmp_13 = m30 * m21;
    var tmp_14 = m10 * m31;
    var tmp_15 = m30 * m11;
    var tmp_16 = m10 * m21;
    var tmp_17 = m20 * m11;
    var tmp_18 = m00 * m31;
    var tmp_19 = m30 * m01;
    var tmp_20 = m00 * m21;
    var tmp_21 = m20 * m01;
    var tmp_22 = m00 * m11;
    var tmp_23 = m10 * m01;

    var t0 = (tmp_0 * m11 + tmp_3 * m21 + tmp_4 * m31) -
        (tmp_1 * m11 + tmp_2 * m21 + tmp_5 * m31);
    var t1 = (tmp_1 * m01 + tmp_6 * m21 + tmp_9 * m31) -
        (tmp_0 * m01 + tmp_7 * m21 + tmp_8 * m31);
    var t2 = (tmp_2 * m01 + tmp_7 * m11 + tmp_10 * m31) -
        (tmp_3 * m01 + tmp_6 * m11 + tmp_11 * m31);
    var t3 = (tmp_5 * m01 + tmp_8 * m11 + tmp_11 * m21) -
        (tmp_4 * m01 + tmp_9 * m11 + tmp_10 * m21);

    var d = 1.0 / (m00 * t0 + m10 * t1 + m20 * t2 + m30 * t3);

    return [
      d * t0,
      d * t1,
      d * t2,
      d * t3,
      d * ((tmp_1 * m10 + tmp_2 * m20 + tmp_5 * m30) -
            (tmp_0 * m10 + tmp_3 * m20 + tmp_4 * m30)),
      d * ((tmp_0 * m00 + tmp_7 * m20 + tmp_8 * m30) -
            (tmp_1 * m00 + tmp_6 * m20 + tmp_9 * m30)),
      d * ((tmp_3 * m00 + tmp_6 * m10 + tmp_11 * m30) -
            (tmp_2 * m00 + tmp_7 * m10 + tmp_10 * m30)),
      d * ((tmp_4 * m00 + tmp_9 * m10 + tmp_10 * m20) -
            (tmp_5 * m00 + tmp_8 * m10 + tmp_11 * m20)),
      d * ((tmp_12 * m13 + tmp_15 * m23 + tmp_16 * m33) -
            (tmp_13 * m13 + tmp_14 * m23 + tmp_17 * m33)),
      d * ((tmp_13 * m03 + tmp_18 * m23 + tmp_21 * m33) -
            (tmp_12 * m03 + tmp_19 * m23 + tmp_20 * m33)),
      d * ((tmp_14 * m03 + tmp_19 * m13 + tmp_22 * m33) -
            (tmp_15 * m03 + tmp_18 * m13 + tmp_23 * m33)),
      d * ((tmp_17 * m03 + tmp_20 * m13 + tmp_23 * m23) -
            (tmp_16 * m03 + tmp_21 * m13 + tmp_22 * m23)),
      d * ((tmp_14 * m22 + tmp_17 * m32 + tmp_13 * m12) -
            (tmp_16 * m32 + tmp_12 * m12 + tmp_15 * m22)),
      d * ((tmp_20 * m32 + tmp_12 * m02 + tmp_19 * m22) -
            (tmp_18 * m22 + tmp_21 * m32 + tmp_13 * m02)),
      d * ((tmp_18 * m12 + tmp_23 * m32 + tmp_15 * m02) -
            (tmp_22 * m32 + tmp_14 * m02 + tmp_19 * m12)),
      d * ((tmp_22 * m22 + tmp_16 * m02 + tmp_21 * m12) -
            (tmp_20 * m12 + tmp_23 * m22 + tmp_17 * m02))
    ];
  },

  vectorMultiply: function(v, m) {
    var dst = [];
    for (var i = 0; i < 4; ++i) {
      dst[i] = 0.0;
      for (var j = 0; j < 4; ++j) {
        dst[i] += v[j] * m[j * 4 + i];
      }
    }
    return dst;
  },

};

// Fill the buffer with the values that define a letter 'F'.
function setGeometry(gl) {
    var positions =
      new Float32Array([
          // left column front
        0,   0,  0,
        0, 150,  0,//
        30,   0,  0,///
        0, 150,  0,//
        30, 150,  0,
        30,   0,  0,///

        // top rung front
        30,   0,  0,
        30,  30,  0,//
        70,   0,  0,///
        30,  30,  0,//
        70,  30,  0,
        70,   0,  0,///

        // right column front
        70,  50,  0,
        70,  100,  0,//
        100,  50,  0,///
        70,  100,  0,//
        100,  100,  0,
        100,  50,  0,///

        // top diagonal front
        50,  30,  0,
        70,  60,  0,
        70,  30,  0,
        70,   0,  0,
        70,  50,  0,
        100,  50,  0,

        // bottom diagonal front
        50,  120,  0,
        70,  120,  0,
        70,  90,  0,
        70,  100,  0,
        70,   150,  0,
        100,  100,  0,

        // bottom rung front
        30,  120,  0,//
        30,  150,  0,
        70,  150,  0,///
        70,  120,  0,
        30,  120,  0,//
        70,  150,  0,/// 

        // left column back
        0,   0,  30,
        30,   0,  30,//
        0, 150,  30,///
        0, 150,  30,///
        30,   0,  30,//
        30, 150,  30,

        // top rung back
        30,   0,  30,
        70,   0,  30,//
        30,  30,  30,///
        30,  30,  30,///
        70,   0,  30,//
        70,  30,  30,

        // right column back
        70,  50,  30,
        100,  50,  30,
        70,  100,  30,//
        70,  100,  30,//
        100,  50,  30,
        100,  100,  30,

        
        // top diagonal back
        70,  60,  30,
        50,  30,  30,
        70,  30,  30,
        70,  50,  30,
        70,   0,  30,
        100,  50,  30,

        // bottom diagonal back
        70,  120,  30,
        50,  120,  30,
        70,  90,  30,
        70,   150,  30,
        70,  100,  30,
        100,  100,  30,

        // bottom rung back
        30,  150,  30,
        30,  120,  30,
        70,  150,  30,
        30,  120,  30,
        70,  120,  30,
        70,  150,  30,    

        // top
        0,   0,   0,
        70,   0,   0,
        70,   0,  30,
        0,   0,   0,
        70,   0,  30,
        0,   0,  30,

        // top diagonal right
        70,   0,   0,
        100,  50,   0,
        100,  50,  30,
        70,   0,   0,
        100,  50,  30,
        70,   0,  30,

        // bottom diagonal right
        100,  100,   0,
        70,   150,   0,
        100,  100,  30,
        100,  100,  30,
        70,   150,   0,
        70,   150,  30,

        // under top rung
        30,   30,   0,
        30,   30,  30,
        50,  30,  30,
        30,   30,   0,
        50,  30,  30,
        50,  30,   0,

        // top of bottom rung !!!!!!!
        30,   120,   0,//
        50,   120,  30,///
        30,   120,  30,
        30,   120,   0,//
        50,   120,   0,
        50,   120,  30,///

        // right of right column !!!!!!!
        100,   50,   0,
        100,   100,  30,
        100,   50,   30,
        100,   50,   0,
        100,   100,   0,
        100,   100,  30,

        // right of left column !!!!!!!
        30,   30,   0,
        30,  120,  30,
        30,   30,  30,
        30,   30,   0,
        30,  120,   0,
        30,  120,  30,

        // bottom !!!!!!!
        0,   150,   0,
        0,   150,  30,
        70,  150,  30,
        0,   150,   0,
        70,  150,  30,
        70,  150,   0,

        // left of left column !!!!!!!
        0,   0,   0,
        0,   0,  30,
        0, 150,  30,
        0,   0,   0,
        0, 150,  30,
        0, 150,   0,

        // left of right column  !!!!!!!
        70,   60,   0,
        70,   60,  30,
        70,   90,  30,
        70,   60,   0,
        70,   90,  30,
        70,   90,   0,        
                
        // top diagonal left !!!!!!!
        70,  60,   0,
        50,   30,   0,
        70,  60,  30,
        70,  60,  30,
        50,   30,   0,
        50,   30,  30,

        // bottom diagonal left !!!!!!!
        50,   120,   0,
        70,  90,   0,
        70,  90,  30,
        50,   120,   0,
        70,  90,  30,
        50,   120,  30,]);
	
  // Center the F around the origin and Flip it around. We do this because
  // we're in 3D now with and +Y is up where as before when we started with 2D
  // we had +Y as down.
  // We could do by changing all the values above but I'm lazy.
  // We could also do it with a matrix at draw time but you should
  // never do stuff at draw time if you can do it at init time.
  var matrix = m4.xRotation(Math.PI);
  matrix = m4.translate(matrix, -50, -75, -15);
  for (var ii = 0; ii < positions.length; ii += 3) {
    var vector = m4.vectorMultiply([positions[ii + 0], positions[ii + 1], positions[ii + 2], 1], matrix);
    positions[ii + 0] = vector[0];
    positions[ii + 1] = vector[1];
    positions[ii + 2] = vector[2];
  }
  gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);
}


// Fill the buffer with colors for the 'D'.
function setColors(gl) {
    gl.bufferData(
        gl.ARRAY_BUFFER,
        new Uint8Array([
            // left column front
          20, 180, 50,
          20, 180, 50,
          20, 180, 50,
          20, 180, 50,
          20, 180, 50,
          20, 180, 50,
  
            // top rung front
          20, 180, 50,
          20, 180, 50,
          20, 180, 50,
          20, 180, 50,
          20, 180, 50,
          20, 180, 50,
  
            // right column front
          20, 180, 50,
          20, 180, 50,
          20, 180, 50,
          20, 180, 50,
          20, 180, 50,
          20, 180, 50,
  
          // top diagonal front
          20, 180, 50,
          20, 180, 50,
          20, 180, 50,
          20, 180, 50,
          20, 180, 50,
          20, 180, 50,          
          
          // bottom diagonal front
          20, 180, 50,
          20, 180, 50,
          20, 180, 50,
          20, 180, 50,
          20, 180, 50,
          20, 180, 50,
          
          // bottom rung front
          20, 180, 50,
          20, 180, 50,
          20, 180, 50,
          20, 180, 50,
          20, 180, 50,
          20, 180, 50,
  
            // left column back
          80, 70, 200,
          80, 70, 200,
          80, 70, 200,
          80, 70, 200,
          80, 70, 200,
          80, 70, 200,
  
            // top rung back
          80, 70, 200,
          80, 70, 200,
          80, 70, 200,
          80, 70, 200,
          80, 70, 200,
          80, 70, 200,
  
            // right column back
          80, 70, 200,
          80, 70, 200,
          80, 70, 200,
          80, 70, 200,
          80, 70, 200,
          80, 70, 200,
  
          
          // top diagonal back
          80, 70, 200,
          80, 70, 200,
          80, 70, 200,
          80, 70, 200,
          80, 70, 200,
          80, 70, 200,
  
          // bottom diagonal back
          80, 70, 200,
          80, 70, 200,
          80, 70, 200,
          80, 70, 200,
          80, 70, 200,
          80, 70, 200,
  
          // bottom rung back
          80, 70, 200,
          80, 70, 200,
          80, 70, 200,
          80, 70, 200,
          80, 70, 200,
          80, 70, 200,
  
            // top
          70, 200, 210,
          70, 200, 210,
          70, 200, 210,
          70, 200, 210,
          70, 200, 210,
          70, 200, 210,
  
            // top diagonal right
          240, 100, 70,
          240, 100, 70,
          240, 100, 70,
          240, 100, 70,
          240, 100, 70,
          240, 100, 70,
  
          // bottom diagonal right
          200, 200, 30,
          200, 200, 30,
          200, 200, 30,
          200, 200, 30,
          200, 200, 30,
          200, 200, 30,
    
          // under top rung
          210, 100, 70,
          210, 100, 70,
          210, 100, 70,
          210, 100, 70,
          210, 100, 70,
          210, 100, 70,
  
            // top of bottom rung
          70, 180, 210,
          70, 180, 210,
          70, 180, 210,
          70, 180, 210,
          70, 180, 210,
          70, 180, 210,
  
            // right of right column
          240, 160, 10,
          240, 160, 10,
          240, 160, 10,
          240, 160, 10,
          240, 160, 10,
          240, 160, 10,
  
          // right of left column
          240, 160, 10,
          240, 160, 10,
          240, 160, 10,
          240, 160, 10,
          240, 160, 10,
          240, 160, 10,
  
            // bottom
          210, 100, 70,
          210, 100, 70,
          210, 100, 70,
          210, 100, 70,
          210, 100, 70,
          210, 100, 70,
  
            // left of left column
          160, 160, 220,
          160, 160, 220,
          160, 160, 220,
          160, 160, 220,
          160, 160, 220,
          160, 160, 220,
      
          
          // left of right column
          160, 160, 220,
          160, 160, 220,
          160, 160, 220,
          160, 160, 220,
          160, 160, 220,
          160, 160, 220,
  
          // top diagonal left
          240, 80, 30,
          240, 80, 30,
          240, 80, 30,
          240, 80, 30,
          240, 80, 30,
          240, 80, 30,
    
          // bottom diagonal left
          200, 250, 30,
          200, 250, 30,
          200, 250, 30,
          200, 250, 30,
          200, 250, 30,
          200, 250, 30,
    
          ]),
        gl.STATIC_DRAW);
  }

main();