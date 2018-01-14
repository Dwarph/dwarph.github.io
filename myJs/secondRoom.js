let numOfAxes = 3;
let axeMeshes = [];
let walkwayMesh;
let walkwayMeshLength;
let treasureMesh;
let room2FloorMesh;
let room2FloorMeshLength;
let room2FloorMeshWidth;

//create the walls surrounding the second room
function makeSecondRoomWalls() {

    let roomGeom = [];
    let roomMesh = [];
    let materials = [];
    let stoneWallTexture = [];
    let stoneFloorTexture = [];
    let stoneEntranceTexture = [];
    let wallHeight = 60;
    room2FloorMeshWidth = 50;
    room2FloorMeshLength = 100;


    /* MATERIALS */

    // Textures acquired from https://3dtextures.me
    stoneFloorTexture[0] = textureLoader.load("textures/Flooring_Stone_001/Flooring_Stone_001_COLOR.png"); //map
    stoneFloorTexture[1] = textureLoader.load("textures/Flooring_Stone_001/Flooring_Stone_001_NRM.png"); // Normal Map
    stoneFloorTexture[2] = textureLoader.load("textures/Flooring_Stone_001/Flooring_Stone_001_DISP.png"); // displacement Map

    stoneWallTexture[0] = textureLoader.load("textures/Stone_Wall_004/Stone_Wall_004_COLOR.jpg"); //map
    stoneWallTexture[1] = textureLoader.load("textures/Stone_Wall_004/Stone_Wall_004_NRM.jpg"); // Normal Map
    stoneWallTexture[2] = textureLoader.load("textures/Stone_Wall_004/Stone_Wall_004_DISP.tiff"); // displacement Map


    stoneEntranceTexture[0] = textureLoader.load("textures/Stone_Wall_004/Stone_Wall_004_COLOR.jpg"); //map
    stoneEntranceTexture[1] = textureLoader.load("textures/Stone_Wall_004/Stone_Wall_004_NRM.jpg"); // Normal Map
    stoneEntranceTexture[2] = textureLoader.load("textures/Stone_Wall_004/Stone_Wall_004_DISP.tiff"); // displacement Map

    wrapTexture(stoneFloorTexture, 10, 10);
    wrapTexture(stoneWallTexture, 5, 3);
    wrapTexture(stoneEntranceTexture, 2, 3);

    materials[0] = new THREE.MeshPhongMaterial({
        map: stoneFloorTexture[0],
        normalMap: stoneFloorTexture[1],
        displacementMap: stoneFloorTexture[2],
    });

    materials[1] = new THREE.MeshPhongMaterial({
        map: stoneWallTexture[0],
        normalMap: stoneWallTexture[1],
        displacementMap: stoneWallTexture[2],
    });

    materials[2] = new THREE.MeshPhongMaterial({
        map: stoneEntranceTexture[0],
        normalMap: stoneEntranceTexture[1],
        displacementMap: stoneEntranceTexture[2],
    });


    /* GEOMETRY */

    //floor
    roomGeom[0] = new THREE.BoxGeometry(room2FloorMeshWidth, 0.5, room2FloorMeshLength);

    //walls
    roomGeom[1] = new THREE.BoxGeometry(0.5, wallHeight, room2FloorMeshLength);
    roomGeom[2] = new THREE.BoxGeometry(0.5, wallHeight, room2FloorMeshLength);
    roomGeom[3] = new THREE.BoxGeometry(room2FloorMeshWidth, wallHeight, 0.5);
    roomGeom[4] = new THREE.BoxGeometry(room2FloorMeshWidth, wallHeight, 0.5);

    var zDisplacement = 150;
    var yDisplacement = 100;


    /* MESHES */
    for (var i = 0; i < roomGeom.length; i++) {
        roomMesh[i] = new THREE.Mesh(roomGeom[i], materials[i]);
        if (i > 0) {
            roomMesh[i] = new THREE.Mesh(roomGeom[i], materials[1]);
        }
        if (i == 3 || i == 4) {
            roomMesh[i] = new THREE.Mesh(roomGeom[i], materials[2]);
        }

        roomMesh[i].position.y -= yDisplacement;
        roomMesh[i].position.z -= zDisplacement;
    }


    roomMesh[1].position.y += wallHeight / 2;
    roomMesh[1].position.x -= room2FloorMeshWidth / 2;

    roomMesh[2].position.y += wallHeight / 2;
    roomMesh[2].position.x += room2FloorMeshWidth / 2;

    roomMesh[3].position.y += wallHeight / 2;
    roomMesh[3].position.z -= room2FloorMeshWidth;
    //  roomMesh[3].position.x -= 2;

    roomMesh[4].position.y += wallHeight / 2;
    roomMesh[4].position.z += room2FloorMeshWidth;
    //  roomMesh[4].position.x += 2;

    room2FloorMesh = roomMesh[0];
    for (var i = 0; i < roomMesh.length; i++) {
        scene.add(roomMesh[i]);
    }
    // roomGeom[0].computeVertexNormals();

}

//create the walkway in the second room
function makeSecondRoomWalkway() {
    var walkwayGeom;
    var material;
    var stoneFloorTexture = [];
    var wallHeight = 60;
    var floorWidth = 50;
    walkwayMeshLength = 100;


    /* MATERIALS */

    // Textures acquired from https://3dtextures.me
    stoneFloorTexture[0] = textureLoader.load("textures/Flooring_Stone_001/Flooring_Stone_001_COLOR.png"); //map
    stoneFloorTexture[1] = textureLoader.load("textures/Flooring_Stone_001/Flooring_Stone_001_NRM.png"); // Normal Map
    stoneFloorTexture[2] = textureLoader.load("textures/Flooring_Stone_001/Flooring_Stone_001_DISP.png"); // displacement Map

    wrapTexture(stoneFloorTexture, 1, 10);

    material = new THREE.MeshPhongMaterial({
        map: stoneFloorTexture[0],
        normalMap: stoneFloorTexture[1],
        displacementMap: stoneFloorTexture[2],
    });

    walkwayGeom = new THREE.BoxGeometry(floorWidth / 5, 0.5, walkwayMeshLength);

    var zDisplacement = 150;
    var yDisplacement = 100;

    /* MESHES */
    walkwayMesh = new THREE.Mesh(walkwayGeom, material);
    walkwayMesh.position.y -= yDisplacement;
    walkwayMesh.position.z -= zDisplacement;
    walkwayMesh.position.y += wallHeight / 2;

    scene.add(walkwayMesh);
}

//create the axes which swing over the walkway
//we do this by defining a THREE.Shape with a Bezier Curve, then passing it to an extrude geometry
function drawAxes() {
    var axeCurveRadius = 3;
    var yDisplacement = walkwayMesh.position.y + 3;
    var walkwayStart = walkwayMesh.position.z + walkwayMeshLength / 2;
  //  console.log(walkwayMesh);

    var extrudeSettings = {
        steps: 2,
        amount: 1,
        bevelEnabled: true,
        bevelThickness: 0.2,
        bevelSize: 0.2,
        bevelSegments: 1
    };

    var x = -3,
        y = 0;

    var axeShape = new THREE.Shape();

    axeShape.moveTo(x, y);
    axeShape.bezierCurveTo(x + axeCurveRadius / 2, y - axeCurveRadius / 2, x + axeCurveRadius, y - axeCurveRadius, x + axeCurveRadius * 2, y);


    var geometry = new THREE.ExtrudeGeometry(axeShape, extrudeSettings);
    var material = new THREE.MeshPhysicalMaterial(
        {
            color: colours.silverMetal,
            reflectivity: 0.8
        });

    //space the axes out accordingly
    for (var i = 0; i < numOfAxes; i++) {
        axeMeshes[i] = new THREE.Mesh(geometry, material);
        axeMeshes[i].position.z = walkwayStart / 2 - ((walkwayMeshLength / numOfAxes) * (i + 2));
        axeMeshes[i].position.y = yDisplacement;
        scene.add(axeMeshes[i]);
    }
}


var angle = 0.01;

//rotate the Axes around an Axis
function rotateAxes() {
    const yRotation = 10;
    var rotationPoint;
    const rotationAxis = new THREE.Vector3(0, 0, 1);
    const maxAngle = 0.2;
    const minAngle = -0.2;

    //iterate through all axes
    for (var i = 0; i < axeMeshes.length; i++) {

        //if we have reached the maxAngle, change rotation direction
        if (axeMeshes[i].rotation.z > maxAngle) {
            angle = -0.01;
            //if we have reached the minAngle, change rotation direction
        } else if (axeMeshes[i].rotation.z < minAngle) {
            angle = 0.01;
        }
        rotationPoint = new THREE.Vector3(axeMeshes[i].x, axeMeshes[i].y + yRotation, axeMeshes[i].z);
        rotateAboutPoint(axeMeshes[i], rotationPoint, rotationAxis, angle);
    }
}


// source: https://stackoverflow.com/questions/42812861/three-js-pivot-point/42866733#42866733
// obj - your object (THREE.Object3D or derived)
// point - the point of rotation (THREE.Vector3)
// axis - the axis of rotation (normalized THREE.Vector3)
// theta - radian value of rotation
// pointIsWorld - boolean indicating the point is in world coordinates (default = false)
function rotateAboutPoint(obj, point, axis, theta, pointIsWorld) {
    pointIsWorld = (pointIsWorld === undefined) ? false : pointIsWorld;

    if (pointIsWorld) {
        obj.parent.localToWorld(obj.position); // compensate for world coordinate
    }

    obj.position.sub(point); // remove the offset
    obj.position.applyAxisAngle(axis, theta); // rotate the POSITION
    obj.position.add(point); // re-add the offset

    if (pointIsWorld) {
        obj.parent.worldToLocal(obj.position); // undo world coordinates compensation
    }

    obj.rotateOnAxis(axis, theta); // rotate the OBJECT
}

//make the treasure box
function makeTreasureBox() {
    var boxGeom;
    var materials = [];
    var treasureBoxTexture;
    var coinsTexture;
    var width = 7;
    var height = 3;
    var depth = 5;
    var zDisplacement = 190;
    var yDisplacement = 83;

    /* MATERIALS */

    // box texture: https://freestocktextures.com/texture/old-faded-wooden-door,883.html
    // coins texture: http://bgfons.com/uploads/money/money_texture1384.jpg
    treasureBoxTexture = textureLoader.load("textures/treasureBox.png"); //map
    coinsTexture = textureLoader.load("textures/coins.jpg");
    wrapTexture(treasureBoxTexture, 0.8, 0.8);

    materials[0] = new THREE.MeshPhongMaterial({
        map: treasureBoxTexture,
    });

    //map all initial faces to the wooden texture
    for (var i = 1; i < 7; i++) {
        materials[i] = materials[0];
    }
    //set the top face to the coins texture
    materials[2] = new THREE.MeshPhongMaterial({
        map: coinsTexture,
    });

    boxGeom = new THREE.BoxGeometry(width, height, depth);


    /* MESHES */
    treasureMesh = new THREE.Mesh(boxGeom, materials);
    treasureMesh.position.y -= yDisplacement;
    treasureMesh.position.z -= zDisplacement;
    treasureMesh.position.y += wallHeight / 2;

    scene.add(treasureMesh);
}

//make spikes line the floor in the second room
function makeRoom2Spikes() {
    var spikeTopRad = 0.01;
    var spikeBotRad = 2;
    var spikeLength = 20;
    var spikeMesh = [];
    var numSpikesZ = room2FloorMeshLength / (spikeBotRad * 2);
    var numSpikesX = room2FloorMeshWidth / (spikeBotRad * 2);
    var spikeGeom = new THREE.CylinderGeometry(spikeTopRad, spikeBotRad, spikeLength, 10);
    var material = new THREE.MeshPhysicalMaterial(
        {
            color: colours.silverMetal,
            reflectivity: 0.8
        });

    //work out the top leftmost corner position to start placing the spikes at
    var spikeStartingPos = new THREE.Vector3(room2FloorMesh.position.x - room2FloorMeshWidth / 2 + 1,
        room2FloorMesh.position.y + spikeLength / 2,
        room2FloorMesh.position.z - room2FloorMeshLength / 2 + 1);

    //for the number of spikes along the Z axis
    for (var i = 0; i < numSpikesZ; i++) {
        //for the number of spikes along the X axis
        for (var j = 0; j < numSpikesX; j++) {
            //create a spike in the correct position
            let newSpike = new THREE.Mesh(spikeGeom, material);
            newSpike.position.set(spikeStartingPos.x + (spikeBotRad * 2) * j,
                spikeStartingPos.y,
                spikeStartingPos.z + (spikeBotRad * 2) * i);
            spikeMesh.push(newSpike);
        }
    }

    //add the spikes
    for (var i = 0; i < spikeMesh.length; i++) {
        scene.add(spikeMesh[i]);
    }

}

//make the two lights in the room
function makeSecondRoomLights() {
    var lights = [];
    //create 4 lights
    for (var i = 0; i < 4; i++) {
        lights[i] = new THREE.PointLight(colours.orangeFlame, 2, 100);
    }

    //place them in seperate corners of the room
    lights[0].position.set(walkwayMesh.position.x - 20, walkwayMesh.position.y + 10, walkwayMesh.position.z - walkwayMeshLength / 2);
    lights[1].position.set(walkwayMesh.position.x + 20, walkwayMesh.position.y + 10, walkwayMesh.position.z - walkwayMeshLength / 2);
    lights[2].position.set(walkwayMesh.position.x - 20, walkwayMesh.position.y + 10, walkwayMesh.position.z + walkwayMeshLength / 2);
    lights[3].position.set(walkwayMesh.position.x + 20, walkwayMesh.position.y + 10, walkwayMesh.position.z + walkwayMeshLength / 2);

    //add them to the scene
    for (var i = 0; i < 4; i++) {
        scene.add(lights[i]);
    }

    //create a gold coloured light to add a nice glow to the coins
    var treasureLight = new THREE.PointLight(colours.yellowGold, 1, 50);
    treasureLight.position.set(treasureMesh.position.x, treasureMesh.position.y + 5, treasureMesh.position.z);
    scene.add(treasureLight);
}