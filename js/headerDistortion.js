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

/** Codrops demo 2 — index2.html (default control panel values) */
export const DISTORTION_PRESET = {
    grid: 400,
    mouse: 0.21,
    strength: 0.36,
    relaxation: 0.96,
};

/**
 * Simulation speed multiplier (1 = default). Higher = faster settling and snappier hover.
 * Optional runtime override: `window.__HEADER_DISTORTION_SPEED` (same range, checked at init).
 */
export const HEADER_DISTORTION_SPEED = 1;

function resolveSimulationSpeed(override) {
    if (typeof override === 'number' && !isNaN(override)) {
        return clamp(override, 0.25, 4);
    }
    if (typeof window !== 'undefined' && typeof window.__HEADER_DISTORTION_SPEED === 'number') {
        return clamp(window.__HEADER_DISTORTION_SPEED, 0.25, 4);
    }
    return clamp(HEADER_DISTORTION_SPEED, 0.25, 4);
}

const CONTROLS_STORAGE_KEY = 'pipHeaderDistortionControls';

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

        /** When true, start from a flat field (no random “intro” shimmer). Used off the homepage. */
        this.skipIntro = options.skipIntro === true;
        this.simulationSpeed = resolveSimulationSpeed(options.simulationSpeed);

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
        if (typeof e.clientX !== 'number' || typeof e.clientY !== 'number') return;
        /* pointerdown: establish contact without velocity — otherwise every tap injects a huge
         * fake impulse (e.g. from prev 0,0 or from the last lift position). */
        if (e.type === 'pointerdown') {
            this.applyPointerPositionNoVelocity(e.clientX, e.clientY);
        } else {
            this.applyPointerPosition(e.clientX, e.clientY);
        }
    }

    onTouchLike(e) {
        var t = e.touches && e.touches.length ? e.touches[0] : e.changedTouches && e.changedTouches[0];
        if (!t) return;
        if (e.type === 'touchstart') {
            this.applyPointerPositionNoVelocity(t.clientX, t.clientY);
        } else {
            this.applyPointerPosition(t.clientX, t.clientY);
        }
    }

    /**
     * Sync pointer position and zero velocity (finger/mouse down). Distortion only reacts to movement.
     */
    applyPointerPositionNoVelocity(clientX, clientY) {
        var rect = this.container.getBoundingClientRect();
        if (rect.width < 1 || rect.height < 1) return;
        var nx = (clientX - rect.left) / rect.width;
        var ny = (clientY - rect.top) / rect.height;
        this.mouse.prevX = nx;
        this.mouse.prevY = ny;
        this.mouse.x = nx;
        this.mouse.y = ny;
        this.mouse.vX = 0;
        this.mouse.vY = 0;
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
            var stride = i * 4;
            if (this.skipIntro) {
                data[stride] = 0;
                data[stride + 1] = 0;
            } else {
                data[stride] = Math.random() * 255 - 125;
                data[stride + 1] = Math.random() * 255 - 125;
            }
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
        var s = this.simulationSpeed;
        var relPow = Math.pow(this.settings.relaxation, s);
        var velPow = Math.pow(0.9, s);
        for (i = 0; i < data.length; i += 4) {
            data[i] *= relPow;
            data[i + 1] *= relPow;
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

        this.mouse.vX *= velPow;
        this.mouse.vY *= velPow;
        this.texture.needsUpdate = true;
    }

    /**
     * Live-update sim parameters from the control panel. Regenerates the data texture only when grid changes.
     * @param {Partial<{grid:number,mouse:number,strength:number,relaxation:number}>} patch
     */
    applyControlSettings(patch) {
        if (!patch || typeof patch !== 'object') return;
        var prevGrid = this.settings.grid;
        if (patch.grid !== undefined && patch.grid !== null) {
            this.settings.grid = Math.round(clamp(Number(patch.grid), 2, 1000));
        }
        if (patch.mouse !== undefined && patch.mouse !== null) {
            this.settings.mouse = clamp(Number(patch.mouse), 0, 1);
        }
        if (patch.strength !== undefined && patch.strength !== null) {
            this.settings.strength = clamp(Number(patch.strength), 0, 1);
        }
        if (patch.relaxation !== undefined && patch.relaxation !== null) {
            this.settings.relaxation = clamp(Number(patch.relaxation), 0, 1);
        }
        if (this.settings.grid !== prevGrid) {
            this.regenerateGrid();
        }
    }

    getControlSettings() {
        return {
            grid: this.settings.grid,
            mouse: this.settings.mouse,
            strength: this.settings.strength,
            relaxation: this.settings.relaxation,
        };
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

function readStoredControls() {
    try {
        var raw = localStorage.getItem(CONTROLS_STORAGE_KEY);
        if (!raw) return null;
        return JSON.parse(raw);
    } catch (e) {
        return null;
    }
}

function writeStoredControls(settings) {
    try {
        localStorage.setItem(CONTROLS_STORAGE_KEY, JSON.stringify(settings));
    } catch (e) {}
}

function mergeControls(stored) {
    var d = DISTORTION_PRESET;
    if (!stored || typeof stored !== 'object') {
        return { grid: d.grid, mouse: d.mouse, strength: d.strength, relaxation: d.relaxation };
    }
    return {
        grid: typeof stored.grid === 'number' ? Math.round(clamp(stored.grid, 2, 1000)) : d.grid,
        mouse: typeof stored.mouse === 'number' ? clamp(stored.mouse, 0, 1) : d.mouse,
        strength: typeof stored.strength === 'number' ? clamp(stored.strength, 0, 1) : d.strength,
        relaxation: typeof stored.relaxation === 'number' ? clamp(stored.relaxation, 0, 1) : d.relaxation,
    };
}

function formatControlValue(key, v) {
    if (key === 'grid') return String(Math.round(v));
    return v.toFixed(2);
}

/**
 * @param {HTMLElement} headerEl
 * @param {object} sketch — DistortionSketch instance with applyControlSettings / getControlSettings
 */
function buildDistortionPanel(headerEl, sketch) {
    var initial = mergeControls(readStoredControls());
    sketch.applyControlSettings(initial);

    var root = document.createElement('div');
    root.className = 'header-distortion-controls';
    root.id = 'header-distortion-controls';

    var panel = document.createElement('div');
    panel.className = 'header-distortion-controls__panel';
    panel.id = 'header-distortion-panel';
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-modal', 'false');
    panel.setAttribute('aria-labelledby', 'hdr-distortion-legend');
    panel.setAttribute('aria-hidden', 'true');

    var trigger = document.createElement('button');
    trigger.type = 'button';
    trigger.className = 'header-distortion-controls__trigger';
    trigger.setAttribute('aria-label', 'Distortion settings');
    trigger.setAttribute('aria-expanded', 'false');
    trigger.setAttribute('aria-controls', 'header-distortion-panel');

    var triggerIconSettings = document.createElement('img');
    triggerIconSettings.className =
        'header-distortion-controls__trigger-icon header-distortion-controls__trigger-icon--settings';
    triggerIconSettings.src = new URL('images/settings.svg', window.location.href).href;
    triggerIconSettings.alt = '';
    triggerIconSettings.setAttribute('decoding', 'async');
    triggerIconSettings.setAttribute('aria-hidden', 'true');
    trigger.appendChild(triggerIconSettings);

    var triggerIconClose = document.createElement('img');
    triggerIconClose.className =
        'header-distortion-controls__trigger-icon header-distortion-controls__trigger-icon--close';
    triggerIconClose.src = new URL('images/x.svg', window.location.href).href;
    triggerIconClose.alt = '';
    triggerIconClose.setAttribute('decoding', 'async');
    triggerIconClose.setAttribute('aria-hidden', 'true');
    trigger.appendChild(triggerIconClose);

    var fieldset = document.createElement('fieldset');
    fieldset.className = 'header-distortion-controls__fieldset';

    var legend = document.createElement('legend');
    legend.className = 'header-distortion-controls__legend';
    legend.id = 'hdr-distortion-legend';
    legend.textContent = 'Simulation';

    fieldset.appendChild(legend);

    var inputs = {};

    function addRow(key, label, min, max, step) {
        var row = document.createElement('div');
        row.className = 'header-distortion-controls__row';

        var lab = document.createElement('label');
        lab.className = 'header-distortion-controls__label';
        lab.setAttribute('for', 'hdr-dist-' + key);
        lab.textContent = label;

        var input = document.createElement('input');
        input.type = 'range';
        input.id = 'hdr-dist-' + key;
        input.className = 'header-distortion-controls__range';
        input.min = String(min);
        input.max = String(max);
        input.step = String(step);
        input.dataset.key = key;

        var val = document.createElement('span');
        val.className = 'header-distortion-controls__value';
        val.setAttribute('aria-live', 'polite');

        input.addEventListener('input', function () {
            var v = parseFloat(input.value);
            val.textContent = formatControlValue(key, v);
            var patch = {};
            patch[key] = v;
            sketch.applyControlSettings(patch);
            writeStoredControls(sketch.getControlSettings());
        });

        input.value = String(sketch.getControlSettings()[key]);
        val.textContent = formatControlValue(key, parseFloat(input.value));

        inputs[key] = { input: input, val: val };

        lab.appendChild(input);
        row.appendChild(lab);
        row.appendChild(val);
        fieldset.appendChild(row);
    }

    addRow('grid', 'Grid resolution', 2, 1000, 1);
    addRow('mouse', 'Mouse radius', 0, 1, 0.01);
    addRow('strength', 'Strength', 0, 1, 0.01);
    addRow('relaxation', 'Relaxation', 0, 1, 0.01);

    var actions = document.createElement('div');
    actions.className = 'header-distortion-controls__actions';

    var reset = document.createElement('button');
    reset.type = 'button';
    reset.className = 'header-distortion-controls__reset';
    reset.textContent = 'Reset to defaults';

    reset.addEventListener('click', function () {
        sketch.applyControlSettings(DISTORTION_PRESET);
        writeStoredControls(sketch.getControlSettings());
        var s = sketch.getControlSettings();
        var k;
        for (k in inputs) {
            if (Object.prototype.hasOwnProperty.call(inputs, k)) {
                var pair = inputs[k];
                pair.input.value = String(s[k]);
                pair.val.textContent = formatControlValue(k, s[k]);
            }
        }
    });

    actions.appendChild(reset);

    panel.appendChild(fieldset);
    panel.appendChild(actions);

    function setPanelOpen(open) {
        if (open) {
            root.classList.add('header-distortion-controls--open');
        } else {
            root.classList.remove('header-distortion-controls--open');
        }
        panel.setAttribute('aria-hidden', open ? 'false' : 'true');
        if ('inert' in panel) {
            panel.inert = !open;
        }
        trigger.setAttribute('aria-expanded', open ? 'true' : 'false');
        trigger.setAttribute('aria-label', open ? 'Close distortion settings' : 'Distortion settings');
    }

    trigger.addEventListener('click', function () {
        setPanelOpen(!root.classList.contains('header-distortion-controls--open'));
    });

    document.addEventListener('keydown', function onDistortionKeydown(e) {
        if (e.key !== 'Escape' || !root.classList.contains('header-distortion-controls--open')) {
            return;
        }
        setPanelOpen(false);
        trigger.focus();
    });

    root.appendChild(panel);
    root.appendChild(trigger);

    headerEl.appendChild(root);

    setPanelOpen(false);
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

    /** Random initial displacement + settle = intro; only on index (`#homepage-container`). */
    var isHomepage = root.id === 'homepage-container';
    var sketchOpts = { skipIntro: !isHomepage };

    var bgUrl = img.getAttribute('data-header-bg');

    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        return;
    }

    var testCanvas = document.createElement('canvas');
    var gl = testCanvas.getContext('webgl') || testCanvas.getContext('experimental-webgl');
    if (!gl) return;

    function revealBackground() {
        img.classList.add('header-image-ready');
    }

    /** Deferred header: assign real URL only after WebGL is available (see utils.loadHeaderDistortion). */
    function assignAndWaitForBackground() {
        if (bgUrl) {
            img.src = bgUrl;
        }
        return waitForHeaderImage(img).then(function () {
            if (typeof img.decode === 'function') {
                return img.decode().catch(function () {});
            }
        });
    }

    /* Legacy markup: background image already in src (no data-header-bg). */
    if (!bgUrl) {
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
                    var sketchLegacy = new DistortionSketch({ dom: mount });
                    buildDistortionPanel(header, sketchLegacy);
                    sketchLegacy.render();
                    header.classList.add('header-distortion-active');
                    revealBackground();
                } catch (err) {
                    console.warn('headerDistortion: WebGL sketch failed', err);
                    revealBackground();
                }
            })
            .catch(function (err) {
                console.warn('headerDistortion: legacy init failed', err);
                revealBackground();
            });
        return;
    }

    waitForLayout()
        .then(function () {
            return assignAndWaitForBackground();
        })
        .then(function () {
            try {
                var sketch = new DistortionSketch(Object.assign({ dom: mount }, sketchOpts));
                buildDistortionPanel(header, sketch);
                sketch.render();
                header.classList.add('header-distortion-active');
                revealBackground();
            } catch (err) {
                console.warn('headerDistortion: WebGL sketch failed', err);
                revealBackground();
            }
        })
        .catch(function (err) {
            console.warn('headerDistortion: init failed', err);
            revealBackground();
        });
}
