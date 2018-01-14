var treeParticleSystem;
var treeParticleCount = 10;
var treeParticles;
var torchOriginalPos = [];
var torchParticleSystem = [];
var torchParticleCount = 30;
var torchParticles = [];
var torchVelocity = 0.03;

//set up the tree particles
function treeParticlesSetup() {

  //made by following this tutorial: https://aerotwist.com/tutorials/creating-particles-with-three-js/

  treeParticles = new THREE.Geometry();
  var particlePNG = textureLoader.load("textures/particle.png");
  var pMaterial = new THREE.PointsMaterial({
    color: colours.yellowParticle,
    size: 1,
    map: particlePNG,
    opacity: 1,
    transparent: true
  });

  //iterate through the amount of particles
  for (var i = 0; i < treeParticleCount; i++) {

    //place the particle at a random branch position
    var particle = cloneVector3(branches[getRandomIntInRange(0, branches.length)].pos);

    // create a velocity vector
    particle.velocity = new THREE.Vector3(
      0, // x
      -0.1, // y: random vel
      0); // z

    treeParticles.vertices.push(particle);
  }

  treeParticleSystem = new THREE.Points(treeParticles, pMaterial);
  treeParticleSystem.frustumCulled = false;
  scene.add(treeParticleSystem);

}


//update the positions of the particles
function particleUpdate() {

  var pCount = treeParticleCount;
  //iterate through the tree particles
  while (pCount--) {
    var treeParticle = treeParticles.vertices[pCount];

    //if the particle hits the floor, move it to a random branch
    if (treeParticle.y <= 0) {
      var branchPos = cloneVector3((branches[getRandomIntInRange(0, branches.length)].pos));
      treeParticle.x = branchPos.x;
      treeParticle.y = branchPos.y;
      treeParticle.z = branchPos.z;

      treeParticle.velocity.y = 0;
    }

    treeParticle.velocity.y = -0.1;
    treeParticle.add(treeParticle.velocity);
    treeParticleSystem.geometry.verticesNeedUpdate = true;
  }

  //for all the torch particles
  for (var i = 0; i < torchParticles.length; i++) {
    for (var j = 0; j < torchParticles[i].vertices.length; j++) {
      var torchParticle = torchParticles[i].vertices[j];
      //  console.log(torchParticle);

      //if it reaches a threshold, move the particle to a random torch
      if (torchParticle.y >= 18) {
        torchParticle.y = (16 * Math.random() * 0.1) + 16;
        torchParticle.z = torchOriginalPos[getRandomIntInRange(0, torchOriginalPos.length)].z + randSign() * (Math.random() * 0.1);
        torchParticle.velocity.y = 0;
      }

      torchParticle.velocity.y = torchVelocity;
      torchParticle.add(torchParticle.velocity);
      torchParticleSystem[i].geometry.verticesNeedUpdate = true;
    }
  }
}

//set up the torch particles
function torchParticlesSetup(torchPositions) {
  //record the original positions of the torches
  torchOriginalPos = torchPositions;

  var particleSize = 0.3;
  console.log(torchPositions);
  torchParticles[0] = new THREE.Geometry();
  torchParticles[1] = new THREE.Geometry();

  var tOrangeMaterial = new THREE.PointsMaterial({
    color: colours.orangeFlame,
    size: particleSize
  });

  var tYellowMaterial = new THREE.PointsMaterial({
    color: colours.yellowFlame,
    size: particleSize
  });

  //iterate through all the torches, creating "torchParticleCount" amount of particles for each
  for (var i = 0; i < torchPositions.length; i++) {
    for (var j = 0; j < torchParticleCount; j++) {
      var particle = cloneVector3(torchPositions[i]);

      if (i % 2 == 0) {
        particle.x += 0.3;
      } else {
        particle.x -= 0.3;
      }
      particle.y += 12;


      // create a velocity vector
      particle.velocity = new THREE.Vector3(
        0, // x
        torchVelocity, // y: random vel
        0); // z
      if (j % 2 == 0) {
        torchParticles[0].vertices.push(particle);
      } else {
        torchParticles[1].vertices.push(particle);
      }
    }
  }
  torchParticleSystem[0] = new THREE.Points(torchParticles[0], tOrangeMaterial);
  torchParticleSystem[1] = new THREE.Points(torchParticles[1], tYellowMaterial);

  for (var i = 0; i < torchParticleSystem.length; i++) {

    torchParticleSystem[i].frustumCulled = false;
    scene.add(torchParticleSystem[i]);
  }

}


//returns a random int in the range min - max-1
function getRandomIntInRange(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min)) + min; //The maximum is exclusive and the minimum is inclusive
}