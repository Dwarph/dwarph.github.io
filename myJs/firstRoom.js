// function createFirstRoom(){
//
//     var ambientLight = new THREE.AmbientLight(0x555500);
//     scene.add(ambientLight);
//
//     var light = new THREE.PointLight( 0xffffff, 5, 1000, 2 );
//     light.position.set( 0, 10, 0 );
//     scene.add( light );
//
//
//     var geometry = new THREE.BoxGeometry( 50, 0, 50 );
//     var material = new THREE.MeshBasicMaterial({color:0xFFFFFF});
//     var cube = new THREE.Mesh( geometry, material );
//     // cube.material.color.setHex(0x131610);
//     scene.add( cube );
// }

function createFirstRoom() {
    makeFirstRoomWalls();
    makeFirstRoomLights();
}

function makeFirstRoomWalls() {

    var roomGeom = [];
    var roomMesh = [];
    var materials = [];
    var stoneWallTexture = [];
    var stoneFloorTexture = [];
    var stoneEntranceTexture = [];
    var wallHeight = 30;
    var floorSize = 50;


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
    roomGeom[0] = new THREE.BoxGeometry(floorSize, 0.5, floorSize);

    //walls
    roomGeom[1] = new THREE.BoxGeometry(0.5, wallHeight, floorSize);
    roomGeom[2] = new THREE.BoxGeometry(0.5, wallHeight, floorSize);
    roomGeom[3] = new THREE.BoxGeometry(18, wallHeight, 0.5);
    roomGeom[4] = new THREE.BoxGeometry(18, wallHeight, 0.5);

    roomGeom[5] = new THREE.BoxGeometry(floorSize, wallHeight, 0.5);

    /* MESHES */
    for (var i = 0; i < roomGeom.length; i++) {
        roomMesh[i] = new THREE.Mesh(roomGeom[i], materials[i]);
        if (i > 0) {
            roomMesh[i] = new THREE.Mesh(roomGeom[i], materials[1]);
        }
        if (i == 3 || i == 4) {
            roomMesh[i] = new THREE.Mesh(roomGeom[i], materials[2]);
        }


    }
    roomMesh[1].position.y += wallHeight / 2;
    roomMesh[1].position.x -= floorSize / 2;

    roomMesh[2].position.y += wallHeight / 2;
    roomMesh[2].position.x += floorSize / 2;

    roomMesh[3].position.y += wallHeight / 2;
    roomMesh[3].position.z -= floorSize / 2;
    roomMesh[3].position.x -= 16;

    roomMesh[4].position.y += wallHeight / 2;
    roomMesh[4].position.z -= floorSize / 2;
    roomMesh[4].position.x += 16;

    roomMesh[5].position.y += wallHeight / 2;
    roomMesh[5].position.z += floorSize / 2;

    for (var i = 0; i < roomMesh.length; i++) {
        scene.add(roomMesh[i]);
    }
    // roomGeom[0].computeVertexNormals();

}

//make the two lights in the room
function makeFirstRoomLights() {
    // var ambientLight = new THREE.AmbientLight(colours.whitePure, 0.5);
    // scene.add(ambientLight);

    //var hemiLight = new THREE.HemisphereLight(colours.blackPure, colours.greenFog, 0.2);
    //scene.add( hemiLight );

    var light = new THREE.PointLight(colours.yellowLight, 2, 200);
    light.position.set(0, 10, 0);
    scene.add(light);
}