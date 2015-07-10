/******************\
|   Interstellar   |
|   Robot Walker   |
| @author Anthony  |
| @version 0.1     |
| @date 2015/07/09 |
| @edit 2015/07/09 |
\******************/

Physijs.scripts.worker = 'js/physijs_worker.js';
Physijs.scripts.ammo = 'ammo.js';

var InterstellarWalker = (function() {
    'use strict';

    /**********
     * config */
    var DIMS = [960, 500];

    /*************
     * constants */

    /*********************
     * working variables */
    var scene, camera, controls, renderer;

    /******************
     * work functions */
    function initInterstellarWalker() {
        //set up the three.js scene
        scene = new Physijs.Scene;
        camera = new THREE.PerspectiveCamera(
            35, DIMS[0]/DIMS[1], 1, 10000
        );
        controls = new THREE.GodControls(
            camera, scene, $s('#canvas-container'), {
                moveSpd: 0.87,
                rotSpd: 0.016
            }
        );
        controls.setCameraPosition(60, 50, 60);

        renderer = new THREE.WebGLRenderer({antialias: true});
        renderer.setSize(DIMS[0], DIMS[1]);
        renderer.setClearColor(0xF0FAFC);
        renderer.shadowMapEnabled = true;
		renderer.shadowMapSoft = true;
        $s('#canvas-container').appendChild(renderer.domElement);

        //add lights
        addLights();

        //add the floor
        addFloor();

        //add boxes
        addBox(20, 40);
        addBox(40, 42);

        //add the robot
        addRobot();

        //render
        requestAnimationFrame(render);
    }

    function render() {
        scene.simulate(); //physics
        controls.update(); //camera controller
        renderer.render(scene, camera); //render the scene
        requestAnimationFrame(render); //next frame
    }

    function addRobot() {
        var limbLength = 25;
        var limbRatio = 9; //length to thickness ratio
        for (var ai = 0; ai < 4; ai++) {
            var limb1 = getRobotLimb(limbLength, limbRatio);
            limb1.position.x = ai*limbLength/limbRatio;
            scene.add(limb1);
        }
    }

    function getRobotLimb(length, ltr) {
        var thickness = length/ltr;
        var limb = new Physijs.BoxMesh(
            new THREE.BoxGeometry(thickness, length, thickness),
            new THREE.MeshLambertMaterial({
                color: 0x888888
            })
        );
        limb.position.set(0, length, 0);
        limb.castShadow = true;
        return limb;
    }

    function addBox(altitude, disp) {
        var box = new Physijs.BoxMesh(
            new THREE.BoxGeometry(5, 5, 5),
            new THREE.MeshLambertMaterial({
                color: 0x888888
            })
        );
        box.position.x = disp;
        box.position.z = 0;
        box.position.y = altitude;
        box.castShadow = true;
        scene.add(box);
    }

    function addFloor() {
        var floor = new Physijs.PlaneMesh(
            new THREE.PlaneGeometry(1000, 1000),
            Physijs.createMaterial(new THREE.MeshBasicMaterial({
                color: 0x3FCDCD, side: THREE.DoubleSide
            }), 0.7, 0.4),
            0
        );
        floor.rotation.x = -Math.PI/2;
        floor.receiveShadow = true;
        scene.add(floor);
    }

    function addLights() {
        var dirlight = new THREE.DirectionalLight(0xFFFFFF);
		dirlight.position.set(35, 60, -20);
		dirlight.target.position.copy(scene.position);
		dirlight.castShadow = true;
		dirlight.shadowCameraLeft = -60;
		dirlight.shadowCameraTop = -60;
		dirlight.shadowCameraRight = 60;
		dirlight.shadowCameraBottom = 60;
		dirlight.shadowCameraNear = 5;
		dirlight.shadowCameraFar = 200;
        dirlight.shadowCameraVisible = false;
		dirlight.shadowBias = -.0001
		dirlight.shadowMapWidth = dirlight.shadowMapHeight = 2048;
		dirlight.shadowDarkness = .7;
		scene.add(dirlight);
    }

    /***********
     * objects */
    function $s(id) { //for convenience
        if (id.charAt(0) !== '#') return false;
        return document.getElementById(id.substring(1));
    }

    function getRandInt(low, high) { //output is in [low, high)
        return Math.floor(low + Math.random()*(high-low));
    }

    function round(n, places) {
        var mult = Math.pow(10, places);
        return Math.round(mult*n)/mult;
    }

    return {
        init: initInterstellarWalker
    };
})();

window.addEventListener('load', InterstellarWalker.init);
