//colour storage
const colours = {
    greenFog: 0x073310,
    greenLeaf: 0x005706,
    brownTrunk: 0x572700,
    orangeFlame: 0xE25822,
    yellowParticle: 0xFFED73,
    yellowLight: 0x8C6F32,
    yellowFlame: 0xE8E523,
    yellowGold: 0xFFD700,
    whitePure: 0xFFFFFF,
    pinkLightLyd: 0xFF89C5,
    silverMetal: 0x6F6F6F,
    blackPure: 0x000000,
};

const textureLoader = new THREE.TextureLoader();

//wrap textures accordingly
function wrapTexture(texture, x, y) {
    for (var i = 0; i < texture.length; i++) {
        texture[i].wrapS = THREE.RepeatWrapping;
        texture[i].wrapT = THREE.RepeatWrapping;
        texture[i].repeat.set(x, y);
    }
}
