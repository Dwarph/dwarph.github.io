/*
 * Made by following this tutorial:
 * http://www.jgallant.com/procedurally-generating-trees-with-space-colonization-algorithm-in-xna/
 *
 * However, this tutorial is for C#, and to generate a 2D tree. I adapted its code for THREE.js and a 3D space.
 *
 */

var doneGrowing = false;
var position;


var noOfLeaves = 200;
var treeRadius = 20;
var trunkHeight = 40;
var minDistance = 5;
var maxDistance = 90;
var branchLength = 7;

var rootBranch;
var leaves = [];
var branches = [];

/* TREE GENERATION FUNCTIONS */

//call this to generate the tree at a position
function generateTree(positionNew) {

  position = positionNew;
  generateLeaves();
  generateTrunk();
  grow();
  for (var i = 0; i < 3; i++) {
    pruneTree();
  }

  drawTree();
}


//place leaves randomly around a sphere of radius treeRadius
function generateLeaves() {
  //Randomly place leaves within a radius treeRadius
  for (var i = 0; i < noOfLeaves; i++) {
    leaves[i] = {

      pos: new THREE.Vector3(
        randSign() * (position.x + (Math.random() * treeRadius)),
        (position.y + (Math.random() * treeRadius)),
        randSign() * (position.z + (Math.random() * treeRadius))
      )
    }
  }
}

//Generate the trunk
function generateTrunk() {
  //add the root branch first
  rootBranch = {
    parent: null,
    pos: position,
    growDirection: new THREE.Vector3(0, -1, 0),
    growCount: 0,
    originalGrowDirection: new THREE.Vector3(0, -1, 0)
  }
  rootBranch.name = "branch" + branches.length;
  branches.push(rootBranch);

  //create a branch which grows towards the tree
  var current = {
    parent: rootBranch,
    pos: new THREE.Vector3(position.x, position.y - branchLength, position.z - branchLength),
    growDirection: new THREE.Vector3(0, -1, 0),
    growCount: 0,
    originalGrowDirection: new THREE.Vector3(0, -1, 0)
  }
  current.name = "branch" + branches.length;
  branches.push(current);

  while ((rootBranch.pos - current.pos).length < trunkHeight) {
    var trunk = {
      parent: current,
      pos: new THREE.Vector3(current.pos.x, current.pos.y - branchLength, current.pos.z - branchLength),
      growDirection: new THREE.Vector3(0, -1, 0),
      growCount: 0,
      originalGrowDirection: new THREE.Vector3(0, -1, 0)
    }
    trunk.name = "branch" + branches.length;
    branches.push(trunk);
    current = trunk;
  }
}

//grow the rest of the branches
function grow() {
  //if we are done, return out of the function
  if (doneGrowing) {
    return
  }
  //if there are no leaves left, we are done
  if (leaves.length == 0) {
    doneGrowing = true;
    return;
  }

  //iterate through all leaves
  for (var i = 0; i < leaves.length; i++) {

    var leafRemoved = false;

    leaves[i].closestBranch = null;
    leaves[i].closestBranchNum = null;
    var direction = new THREE.Vector3(0, 0, 0);

    //find the nearest branch to the current leaf
    for (var j = 0; j < branches.length; j++) {

      direction = cloneVector3(leaves[i].pos).sub(branches[j].pos);
      var distance = Math.round(leaves[i].pos.distanceTo(branches[j].pos));
      direction.normalize();

      //if the distance is less than the minimum distance, remove a leaf
      if (distance <= minDistance) {
        leaves.splice(i, 1);
        i--;
        leafRemoved = true;
        break;
      }
      //otherwise, if the distance is less than the max distance
      else if (distance <= maxDistance) {
        //set the closest branch as this current one, if it doesn't have a current closest branch
        if (leaves[i].closestBranch == null) {
          leaves[i].closestBranch = branches[j];
          leaves[i].closestBranchNum = j;
          //otherwise, if it is closer than the closest branch, set it as the current branch
        } else if ((leaves[i].pos.distanceTo(leaves[i].closestBranch.pos)) > distance) {
          leaves[i].closestBranch = branches[j];
          leaves[i].closestBranchNum = j;
        }
      }
      //if we haven't removed a leaf
      if (!leafRemoved) {
        //if the current leaf has a closest branch
        if (leaves[i].closestBranch != null) {
          //add a grow direction to the closestbranch
          var dir = cloneVector3(leaves[i].pos).sub(leaves[i].closestBranch.pos);
          dir.normalize();
          leaves[i].closestBranch.growDirection.add(dir);
          leaves[i].closestBranch.growCount++;
          branches[leaves[i].closestBranchNum].growCount++;
        }
      }
    }

    //add the new branches to the tree
    var newBranches = [];
    //iterate through all branches
    for (var j = 0; j < branches.length; j++) {

      //if the current branch needs to grow
      if (branches[j].growCount > 0) {

        var clonedBranch = cloneData(branches[j]);
        var avgDirection = cloneVector3(clonedBranch.growDirection).divide(numToVector3(clonedBranch.growCount));
        avgDirection.normalize();

        //create a new branch in the grow direction needed
        var newBranch = {
          growCount: 0,
          parent: branches[j],
          pos: cloneVector3(clonedBranch.pos).add(avgDirection.multiply(numToVector3(branchLength))),
          growDirection: avgDirection,
          originalGrowDirection: avgDirection
        }

        //add the newbranch
        newBranches.push(newBranch);

        //reset the old branch
        branches[j].growCount = 0;
        branches[j].growDirection = cloneVector3(branches[j].originalGrowDirection);
      }
    }

    var branchAdded = false;
    //iterate through new branches, adding them all to the branches array
    for (var j = 0; j < newBranches.length; j++) {
      newBranches[j].name = "branch" + branches.length;
      branches.push(newBranches[j]);
      branchAdded = true;

    }
    //if there hasn't been a branch added, we are done growing.
    if (!branchAdded) {
      doneGrowing = true;
    }
  }
  // console.log(branches);
}

//Get rid of unneeded branches, in order to decrease polygon count in the scene
function pruneTree() {
  var spliceCount = 0;
  //iterate through all the branches
  for (var i = 0; i < branches.length; i++) {

    var branchName = branches[i].name;
    var isParent = false;
    //Find out if the current branch is a parent
    for (var j = 0; j < branches.length; j++) {
      if (branches[j].parent) {
        if (branches[j].parent.name === branchName) {
          //  someArray.splice(x,1);
          isParent = true;
        }
      }
    }

    //if it is not a parent
    //remove it from the array before the array is drawn.
    if (!isParent) {
      // console.log("SPLICE" + branchName);
      branches.splice(i, 1);
      spliceCount++;
    }
  }
  //  console.log("SPLICED:" + spliceCount);
}


/* DRAW FUNCTIONS */

/*draw the tree in the order
 * branches
 * trunk
 * leaves
 * residual "leaves" not reached by branches
 */
function drawTree() {
  drawAsLines();
  drawTrunk();
  drawLineLeaves();
  drawLeaves();
}

// draw the positions in the "leaves" array
function drawLeaves() {

  /*define a set of points of where the leaves are
   * by iterating through the leaves and pushing them to the leaf geometry
   */
  var leafGeom = new THREE.Geometry();
  for (var i = 0; i < leaves.length; i++) {
    var material = new THREE.PointsMaterial({
      color: colours.greenLeaf
    });
    leafGeom.vertices.push(leaves[i].pos);

  }
  var point = new THREE.Points(leafGeom, material);
  scene.add(point);

  // draw the first leaf point in a different colour
  // this was used for debugging

  /* var mat = new THREE.PointsMaterial({color: 0xff0000});
   var geom = new THREE.Geometry();
   geom.vertices.push(position);
   geom.vertices.push(branches[0].pos);
   var posPoint = new THREE.Points(geom, mat);
  scene.add(posPoint); */

}

// Draw the branches as lines
function drawAsLines() {
  //iterate through the branches, apart from the trunk
  for (var i = 1; i < branches.length; i++) {

    var material = new THREE.LineBasicMaterial({
      color: colours.brownTrunk,
      //  linewidth: 5
    });
    //if it is the first line, give it a different colour.
    //used for debugging
    if (i == 0) {
      material = new THREE.LineBasicMaterial({
        color: 0x00ff00
      });
    }

    //add the branch to a geomatry
    var geometry = new THREE.Geometry();
    geometry.vertices.push(branches[i].pos);

    //if the branch has a parent, draw the line from the branch pos to parent pos
    if (branches[i].parent != null) {
      geometry.vertices.push(branches[i].parent.pos);
    }
    //otherwise draw from the initial position
    // (only used for the trunk)
    else {
      geometry.vertices.push(new THREE.Vector3(0, 0, 0));
    }
    var line = new THREE.Line(geometry, material);
    //add the branch to the scene
    scene.add(line);
  }
}

//Draw the trunk as a cylinder
function drawTrunk() {
  var trunkBotRad = 2;
  var trunkTopRad = 1;

  var geometry = new THREE.CylinderGeometry(trunkTopRad, trunkBotRad, position.y, 6);
  var material = new THREE.MeshBasicMaterial({
    color: colours.brownTrunk
  });
  var trunk = new THREE.Mesh(geometry, material);

  //set the position to be directly under the tree, where the trunk belongs
  trunk.position.y += position.y / 2;
  scene.add(trunk);
}

//draw leaves connected to the lines
function drawLineLeaves() {

  var leafGeom = new THREE.Geometry();
  //iterate through the branches, adding a leaf to every branch pos
  for (var i = 0; i < branches.length; i++) {
    var material = new THREE.PointsMaterial({
      color: colours.greenLeaf,
      size: 5,
    });
    leafGeom.vertices.push(branches[i].pos);
  }
  var point = new THREE.Points(leafGeom, material);
  scene.add(point);
}


/* HELPER FUNCTIONS */


/* Use the JSON parse to clone the data.
 * source:
 * https://stackoverflow.com/questions/14491405/javascript-passing-arrays-to-functions-by-value-leaving-original-array-unaltere
 */
function cloneData(data) {
  // Convert the data into a string first
  var jsonString = JSON.stringify(data);

  //  Parse the string to create a new instance of the data
  return JSON.parse(jsonString);
}


function cloneVector3(v3) {
  return new THREE.Vector3(v3.x, v3.y, v3.z);
}

function numToVector3(num) {
  return new THREE.Vector3(num, num, num);
}

function randSign() {
  var rand = Math.random();

  if (rand > 0.5) {
    return 1;
  } else {
    return -1;
  }

}

//generate a random sign (+ or -)
//create a vector3 all of 1 number
//clone a vector3
//Check if an object already exists in an array
function checkIfExists(array, item) {
  for (var i = 0; i < array.length; i++) {
    if (Object.is(array[i], item)) {
      return true;
    }
  }
  return false;
}

//check to see if the remove function works
function checkArrRemoval() {
  var arr = [];
  arr[0] = 1;
  arr[1] = 2;
  arr[2] = 3;
  console.log(arr);
  arr.splice(1, 1);
  console.log(arr);

}