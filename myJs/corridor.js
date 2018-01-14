var wallHeight = 30;
var corridor1Width = 15;
var corridor1Length = 90;
var corridor1Lights = [];


function makeCorridor1() {
    var corridorGeom = [];
    var corridorMesh = [];
    var materials = [];
    var stoneWallTexture = [];
    var stoneFloorTexture = [];
    var stoneWallBackTexture = [];


    /* MATERIALS */

    // Textures acquired from https://3dtextures.me
    stoneFloorTexture[0] = textureLoader.load("textures/Flooring_Stone_001/Flooring_Stone_001_COLOR.png"); //map
    stoneFloorTexture[1] = textureLoader.load("textures/Flooring_Stone_001/Flooring_Stone_001_NRM.png"); // Normal Map
    stoneFloorTexture[2] = textureLoader.load("textures/Flooring_Stone_001/Flooring_Stone_001_DISP.png"); // displacement Map

    stoneWallTexture[0] = textureLoader.load("textures/Stone_Wall_004/Stone_Wall_004_COLOR.jpg"); //map
    stoneWallTexture[1] = textureLoader.load("textures/Stone_Wall_004/Stone_Wall_004_NRM.jpg"); // Normal Map
    stoneWallTexture[2] = textureLoader.load("textures/Stone_Wall_004/Stone_Wall_004_DISP.tiff"); // displacement Map

    stoneWallBackTexture[0] = textureLoader.load("textures/Stone_Wall_004/Stone_Wall_004_COLOR.jpg"); //map
    stoneWallBackTexture[1] = textureLoader.load("textures/Stone_Wall_004/Stone_Wall_004_NRM.jpg"); // Normal Map
    stoneWallBackTexture[2] = textureLoader.load("textures/Stone_Wall_004/Stone_Wall_004_DISP.tiff"); // displacement Map

    //wrap the textures accordingly
    wrapTexture(stoneFloorTexture, 3, 18);
    wrapTexture(stoneWallTexture, 10, 3);
    wrapTexture(stoneWallBackTexture, 2, 3);

    //create materials from the textures
    materials[0] = new THREE.MeshPhongMaterial({
        map: stoneFloorTexture[0],
        normalMap: stoneFloorTexture[1],
        displacementMap: stoneFloorTexture[2],
        shininess: 10
    });

    materials[1] = new THREE.MeshPhongMaterial({
        map: stoneWallTexture[0],
        normalMap: stoneWallTexture[1],
        displacementMap: stoneWallTexture[2],
        shininess: 10
    });

    materials[2] = new THREE.MeshPhongMaterial({
        map: stoneWallBackTexture[0],
        normalMap: stoneWallBackTexture[1],
        displacementMap: stoneWallBackTexture[2],
        shininess: 10
    });


    /* GEOMETRY */

    //floor
    corridorGeom[0] = new THREE.BoxGeometry(corridor1Width, 0.5, corridor1Length);

    //walls
    corridorGeom[1] = new THREE.BoxGeometry(0.5, wallHeight, corridor1Length + 10);
    corridorGeom[2] = new THREE.BoxGeometry(0.5, wallHeight, corridor1Length + 10);

    corridorGeom[3] = new THREE.BoxGeometry(corridor1Width, wallHeight, 0.5);

    /* MESHES */
    for (var i = 0; i < corridorGeom.length; i++) {
        // corridorMesh[i] = new THREE.Mesh(corridorGeom[i], materials[i]);
        if (i === 3) {
            corridorMesh[i] = new THREE.Mesh(corridorGeom[i], materials[2]);
        } else if (i > 0) {
            corridorMesh[i] = new THREE.Mesh(corridorGeom[i], materials[1]);
        } else {
            corridorMesh[i] = new THREE.Mesh(corridorGeom[i], materials[i]);
        }
    }

    //position the corridor

    var corridorZdisplacement = 75;

    corridorMesh[0].position.z -= corridorZdisplacement - 5;
    corridorMesh[1].position.z -= corridorZdisplacement;
    corridorMesh[2].position.z -= corridorZdisplacement;
    corridorMesh[3].position.z -= corridorZdisplacement + (corridor1Length / 2) - 2.5;


    corridorMesh[1].position.y += wallHeight / 2;
    corridorMesh[1].position.x -= corridor1Width / 2;

    corridorMesh[2].position.y += wallHeight / 2;
    corridorMesh[2].position.x += corridor1Width / 2;

    corridorMesh[3].position.y += wallHeight / 2;
    corridorMesh[3].position.z -= (corridor1Width / 2) - 0.1;


    for (var i = 0; i < corridorMesh.length; i++) {
        scene.add(corridorMesh[i]);
    }
    // corridorGeom[0].computeVertexNormals();
}

function makeCorridor1Torches() {
    /*
     * x: -7.5
     * y: 15
     * z: -75
     */
    var torchTopRad = 0.4;
    var torchBotRad = 0.1;
    var torchLength = 3;
    var numTorches = 5;
    var torchInitialPosY = 15;
    var torchInitialPosX = -7
    var torchRotation = Math.PI / 24;
    var torchPositions = [];
    var torchMaterial = new THREE.MeshPhongMaterial({
        color: 0x563F14
    });

    //for the number of torches
    for (var i = 0; i < numTorches; i++) {
        for (var j = 0; j < 2; j++) {
            var torchGeom;
            var torchMesh;
            //create a cylinder to act as the "torch"
            torchGeom = new THREE.CylinderGeometry(torchTopRad, torchBotRad, torchLength, 6);

            torchMesh = new THREE.Mesh(torchGeom, torchMaterial);

            //set the torche's initial position
            torchMesh.position.y = torchInitialPosY;
            //position the torch correctly along the corridor
            torchMesh.position.z = (corridor1Length / numTorches) * -(i + 2);

            //alternate the sides of the torches
            if (j == 1) {
                torchMesh.position.x = -torchInitialPosX;
                torchMesh.rotation.z = torchRotation;
                makeTorchLightAtPos(torchMesh.position, -1);
            } else {
                torchMesh.position.x = torchInitialPosX;
                torchMesh.rotation.z -= torchRotation;
                makeTorchLightAtPos(torchMesh.position, 1);
            }
            torchPositions.push(torchMesh.position);
            scene.add(torchMesh);

        }

    }

    torchParticlesSetup(torchPositions);
}

//create a light at the given position
function makeTorchLightAtPos(pos, xDisp) {
    var light = new THREE.PointLight(0xE25822, 2, 10);
    light.position.set(pos.x + xDisp, pos.y + 2, pos.z);
    corridor1Lights.push(light);
    scene.add(light);
}

function makeCorridor2() {
    var corridorGeom;
    var corridorMesh = [];
    var material;
    var stoneWallTexture = [];
    var corridorZdisplacement = 119;

    /* MATERIALS */

    // Textures acquired from https://3dtextures.me

    stoneWallTexture[0] = textureLoader.load("textures/Stone_Wall_004/Stone_Wall_004_COLOR.jpg"); //map
    stoneWallTexture[1] = textureLoader.load("textures/Stone_Wall_004/Stone_Wall_004_NRM.jpg"); // Normal Map
    stoneWallTexture[2] = textureLoader.load("textures/Stone_Wall_004/Stone_Wall_004_DISP.tiff"); // displacement Map


    //wrap the textures accordingly

    wrapTexture(stoneWallTexture, 2.5, 5);


    material = new THREE.MeshPhongMaterial({
        map: stoneWallTexture[0],
        normalMap: stoneWallTexture[1],
        displacementMap: stoneWallTexture[2],
        shininess: 10
    });

    /* GEOMETRY */
    corridorGeom = new THREE.BoxGeometry(0.5, wallHeight + 10, corridor1Width);


    /* MESHES */
    for (var i = 0; i < 4; i++) {
        corridorMesh[i] = new THREE.Mesh(corridorGeom, material);
        corridorMesh[i].position.z -= corridorZdisplacement;
        corridorMesh[i].position.y -= wallHeight - 10;
        if (i % 2 == 0) {
            corridorMesh[i].rotation.y += Math.PI / 2;
        }
    }

    var adjustment = 1.5;
    //position the corridor
    corridorMesh[0].position.z += corridor1Width / 2 - adjustment;
    corridorMesh[1].position.x += corridor1Width / 2;
    corridorMesh[2].position.z -= corridor1Width / 2 - adjustment;
    corridorMesh[3].position.x -= corridor1Width / 2;


    for (var i = 0; i < corridorMesh.length; i++) {
        scene.add(corridorMesh[i]);
    }
    // corridorGeom[0].computeVertexNormals();

}

function makeCorridor2Lights() {
    var light = new THREE.PointLight(colours.pinkLightLyd, 2, 10);
    light.position.set(0, -30, -119);
    scene.add(light);
}