/**
 * Header pixel distortion — adapted from DistortedPixels (MIT)
 * https://github.com/akella/DistortedPixels
 * Codrops: https://tympanus.net/codrops/?p=58318
 *
 * Single preset: Codrops demo 2 ("Fungible Love") — index2.html data-* tuning.
 */

import * as THREE from 'https://unpkg.com/three@0.136.0/build/three.module.js';

const VERTEX_SHADER = `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}
`;

const FRAGMENT_SHADER = `
uniform sampler2D uDataTexture;
uniform sampler2D uTexture;
uniform vec4 resolution;
varying vec2 vUv;
void main() {
	vec2 newUV = (vUv - vec2(0.5)) * resolution.zw + vec2(0.5);
	vec4 offset = texture2D(uDataTexture, vUv);
	gl_FragColor = texture2D(uTexture, newUV - 0.02 * offset.rg);
}
`;

/** Codrops demo 2 — index2.html */
const DISTORTION_PRESET = {
    grid: 607,
    mouse: 0.11,
    strength: 0.36,
    relaxation: 0.96,
};

/**
 * Draw the decoded bitmap into a canvas and upload as CanvasTexture.
 * WebGL often fails to sample from HTMLImageElement textures (black) even after decode; this path is reliable.
 */
function createCanvasTextureFromImage(img) {
    var w = img.naturalWidth;
    var h = img.naturalHeight;
    if (!w || !h) return null;
    try {
        var c = document.createElement('canvas');
        c.width = w;
        c.height = h;
        var ctx = c.getContext('2d');
        if (!ctx) return null;
        ctx.drawImage(img, 0, 0);
        var tex = new THREE.CanvasTexture(c);
        tex.minFilter = THREE.LinearFilter;
        tex.magFilter = THREE.LinearFilter;
        tex.needsUpdate = true;
        return tex;
    } catch (e) {
        return null;
    }
}

function clamp(number, min, max) {
    return Math.max(min, Math.min(number, max));
}

class DistortionSketch {
    constructor(options) {
        this.container = options.dom;
        this.img = this.container.querySelector('img');
        this.width = this.container.offsetWidth;
        this.height = this.container.offsetHeight;
        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.setSize(this.width, this.height);
        this.renderer.setClearColor(0xfffdef, 1);
        this.renderer.toneMapping = THREE.NoToneMapping;
        this.renderer.outputEncoding = THREE.LinearEncoding;
        this.renderer.physicallyCorrectLights = false;

        this.renderer.domElement.className = 'header-distortion-canvas';
        this.renderer.domElement.setAttribute('aria-hidden', 'true');
        this.container.appendChild(this.renderer.domElement);

        var frustumSize = 1;
        this.camera = new THREE.OrthographicCamera(
            frustumSize / -2,
            frustumSize / 2,
            frustumSize / 2,
            frustumSize / -2,
            -1000,
            1000
        );
        this.camera.position.set(0, 0, 2);

        this.mouse = { x: 0, y: 0, prevX: 0, prevY: 0, vX: 0, vY: 0 };

        this.isPlaying = true;
        this._rafId = 0;
        this._boundResize = this.resize.bind(this);
        this._boundRender = this.render.bind(this);
        this._setPointerFromClient = this.setPointerFromClient.bind(this);
        this._onTouchLike = this.onTouchLike.bind(this);
        this._passiveOpts = { passive: true };

        this.settings = {
            grid: DISTORTION_PRESET.grid,
            mouse: DISTORTION_PRESET.mouse,
            strength: DISTORTION_PRESET.strength,
            relaxation: DISTORTION_PRESET.relaxation,
        };

        this.size = 0;
        this.texture = null;
        this.material = null;
        this.geometry = null;
        this.plane = null;

        this.imageAspect = 1 / 1.5;

        this.addObjects();
        this.resize();
        this.setupResize();
        this.setupPointerInput();
        if (this.img) {
            this.img.addEventListener('load', this._boundResize);
        }
    }

    /**
     * Input sources:
     * - pointer* — real touch / pen on supporting browsers
     * - mousemove — ALWAYS registered alongside pointer: Chrome device-mode often emits mousemove but NOT pointermove
     *   when moving the mouse over the page, so pointer-only listeners never run.
     * - touch* — older WebViews without Pointer Event Level 2
     */
    setupPointerInput() {
        var o = this._passiveOpts;
        var target = document;
        this._inputEventTarget = target;
        if (window.PointerEvent) {
            target.addEventListener('pointermove', this._setPointerFromClient, o);
            target.addEventListener('pointerdown', this._setPointerFromClient, o);
        }
        target.addEventListener('mousemove', this._setPointerFromClient, o);
        target.addEventListener('touchmove', this._onTouchLike, o);
        target.addEventListener('touchstart', this._onTouchLike, o);
    }

    setPointerFromClient(e) {
        if (typeof e.clientX === 'number' && typeof e.clientY === 'number') {
            this.applyPointerPosition(e.clientX, e.clientY);
        }
    }

    onTouchLike(e) {
        var t = e.touches && e.touches.length ? e.touches[0] : e.changedTouches && e.changedTouches[0];
        if (!t) return;
        this.applyPointerPosition(t.clientX, t.clientY);
    }

    applyPointerPosition(clientX, clientY) {
        var rect = this.container.getBoundingClientRect();
        if (rect.width < 1 || rect.height < 1) return;
        var nx = (clientX - rect.left) / rect.width;
        var ny = (clientY - rect.top) / rect.height;
        /* Desktop: pointermove + mousemove both fire for the same physical move. The second call
         * would set vX/vY to 0 because prev was just updated — killing distortion. DevTools mobile
         * often only gets mousemove, so we keep both listeners and skip duplicate coordinates. */
        if (
            Math.abs(nx - this.mouse.prevX) < 1e-7 &&
            Math.abs(ny - this.mouse.prevY) < 1e-7
        ) {
            return;
        }
        this.mouse.vX = nx - this.mouse.prevX;
        this.mouse.vY = ny - this.mouse.prevY;
        this.mouse.prevX = nx;
        this.mouse.prevY = ny;
        this.mouse.x = nx;
        this.mouse.y = ny;
    }

    setupResize() {
        window.addEventListener('resize', this._boundResize);
        if (typeof ResizeObserver !== 'undefined') {
            this._resizeObserver = new ResizeObserver(this._boundResize);
            this._resizeObserver.observe(this.container);
        }
    }

    resize() {
        this.width = this.container.offsetWidth;
        this.height = this.container.offsetHeight;
        if (this.width < 1 || this.height < 1) {
            if (!this._pendingResize) {
                this._pendingResize = true;
                var self = this;
                requestAnimationFrame(function () {
                    self._pendingResize = false;
                    self.resize();
                });
            }
            return;
        }
        this.renderer.setSize(this.width, this.height);

        if (this.img && this.img.naturalWidth > 0) {
            this.imageAspect = this.img.naturalHeight / this.img.naturalWidth;
        }

        var a1;
        var a2;
        if (this.height / this.width > this.imageAspect) {
            a1 = (this.width / this.height) * this.imageAspect;
            a2 = 1;
        } else {
            a1 = 1;
            a2 = this.height / this.width / this.imageAspect;
        }

        this.material.uniforms.resolution.value.x = this.width;
        this.material.uniforms.resolution.value.y = this.height;
        this.material.uniforms.resolution.value.z = a1;
        this.material.uniforms.resolution.value.w = a2;

        this.regenerateGrid();
    }

    regenerateGrid() {
        this.size = this.settings.grid;

        var width = this.size;
        var height = this.size;
        var size = width * height;
        var data = new Float32Array(4 * size);

        for (var i = 0; i < size; i++) {
            var r = Math.random() * 255 - 125;
            var r1 = Math.random() * 255 - 125;
            var stride = i * 4;
            data[stride] = r;
            data[stride + 1] = r1;
            data[stride + 2] = 0;
            data[stride + 3] = 1;
        }

        if (this.texture) {
            this.texture.dispose();
        }
        this.texture = new THREE.DataTexture(data, width, height, THREE.RGBAFormat, THREE.FloatType);
        this.texture.magFilter = THREE.NearestFilter;
        this.texture.minFilter = THREE.NearestFilter;

        if (this.material) {
            this.material.uniforms.uDataTexture.value = this.texture;
            this.material.uniforms.uDataTexture.value.needsUpdate = true;
        }
    }

    addObjects() {
        this.regenerateGrid();
        var texture = createCanvasTextureFromImage(this.img);
        if (!texture) {
            texture = new THREE.Texture(this.img);
            texture.needsUpdate = true;
        }
        this._uTexture = texture;

        this.material = new THREE.ShaderMaterial({
            side: THREE.DoubleSide,
            uniforms: {
                resolution: { value: new THREE.Vector4() },
                uTexture: { value: texture },
                uDataTexture: { value: this.texture },
            },
            vertexShader: VERTEX_SHADER,
            fragmentShader: FRAGMENT_SHADER,
        });

        this.geometry = new THREE.PlaneGeometry(1, 1, 1, 1);
        this.plane = new THREE.Mesh(this.geometry, this.material);
        this.scene = new THREE.Scene();
        this.scene.add(this.plane);
    }

    updateDataTexture() {
        var data = this.texture.image.data;
        var i;
        for (i = 0; i < data.length; i += 4) {
            data[i] *= this.settings.relaxation;
            data[i + 1] *= this.settings.relaxation;
        }

        var gridMouseX = this.size * this.mouse.x;
        var gridMouseY = this.size * (1 - this.mouse.y);
        var maxDist = this.size * this.settings.mouse;
        var aspect = this.height / this.width;

        var ii;
        var j;
        for (ii = 0; ii < this.size; ii++) {
            for (j = 0; j < this.size; j++) {
                var distance = Math.pow(gridMouseX - ii, 2) / aspect + Math.pow(gridMouseY - j, 2);
                var maxDistSq = maxDist * maxDist;

                if (distance < maxDistSq) {
                    var index = 4 * (ii + this.size * j);
                    var power = maxDist / Math.sqrt(distance);
                    power = clamp(power, 0, 10);
                    data[index] += this.settings.strength * 100 * this.mouse.vX * power;
                    data[index + 1] -= this.settings.strength * 100 * this.mouse.vY * power;
                }
            }
        }

        this.mouse.vX *= 0.9;
        this.mouse.vY *= 0.9;
        this.texture.needsUpdate = true;
    }

    render() {
        if (!this.isPlaying) return;
        this.updateDataTexture();
        this._rafId = requestAnimationFrame(this._boundRender);
        this.renderer.render(this.scene, this.camera);
    }

    destroy() {
        this.isPlaying = false;
        if (this._rafId) {
            cancelAnimationFrame(this._rafId);
            this._rafId = 0;
        }
        window.removeEventListener('resize', this._boundResize);
        var o = this._passiveOpts;
        var target = this._inputEventTarget || document;
        if (window.PointerEvent) {
            target.removeEventListener('pointermove', this._setPointerFromClient, o);
            target.removeEventListener('pointerdown', this._setPointerFromClient, o);
        }
        target.removeEventListener('mousemove', this._setPointerFromClient, o);
        target.removeEventListener('touchmove', this._onTouchLike, o);
        target.removeEventListener('touchstart', this._onTouchLike, o);
        if (this.img) {
            this.img.removeEventListener('load', this._boundResize);
        }
        if (this._resizeObserver) {
            this._resizeObserver.disconnect();
            this._resizeObserver = null;
        }

        if (this.renderer) {
            if (this.renderer.domElement.parentNode) {
                this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
            }
            this.renderer.dispose();
            this.renderer = null;
        }
        if (this.material) {
            this.material.dispose();
            this.material = null;
        }
        if (this.geometry) {
            this.geometry.dispose();
            this.geometry = null;
        }
        if (this.texture) {
            this.texture.dispose();
            this.texture = null;
        }
        if (this._uTexture) {
            this._uTexture.dispose();
            this._uTexture = null;
        }
        this.plane = null;
        this.scene = null;
    }
}

function waitForLayout() {
    return new Promise(function (resolve) {
        requestAnimationFrame(function () {
            requestAnimationFrame(resolve);
        });
    });
}

function waitForHeaderImage(el) {
    if (el.complete && el.naturalWidth > 0) {
        return Promise.resolve();
    }
    return new Promise(function (resolve) {
        el.addEventListener(
            'load',
            function onLoad() {
                el.removeEventListener('load', onLoad);
                resolve();
            },
            false
        );
        el.addEventListener(
            'error',
            function onErr() {
                el.removeEventListener('error', onErr);
                resolve();
            },
            false
        );
    });
}

/**
 * @param {ParentNode} root - document or container that includes `.homepage-header` and `[data-header-distortion]`
 */
export function initHeaderDistortion(root) {
    root = root || document;
    var header = root.querySelector('.homepage-header');
    var mount = root.querySelector('[data-header-distortion]');
    if (!header || !mount) return;

    var img = mount.querySelector('img');
    if (!img) return;

    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        return;
    }

    var testCanvas = document.createElement('canvas');
    var gl = testCanvas.getContext('webgl') || testCanvas.getContext('experimental-webgl');
    if (!gl) return;

    waitForLayout()
        .then(function () {
            return waitForHeaderImage(img);
        })
        .then(function () {
            if (typeof img.decode === 'function') {
                return img.decode().catch(function () {});
            }
        })
        .then(function () {
            try {
                var sketch = new DistortionSketch({ dom: mount });
                sketch.render();
                header.classList.add('header-distortion-active');
            } catch (err) {
                console.warn('headerDistortion: WebGL sketch failed', err);
            }
        });
}
