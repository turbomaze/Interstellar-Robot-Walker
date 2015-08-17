/******************\
|   Interstellar   |
|   Robot Walker   |
| @author Anthony  |
| @version v0.2    |
| @date 2015/07/09 |
| @edit 2015/08/16 |
\******************/

var InterstellarWalker = (function() {
    'use strict';

    /**********
     * config */
    var DIMS = [720, 405]; //canvas dims
    var THICK = 0.55555; //thickness of the robot legs
    var LEGL = 5; //length of the robot legs

    /*************
     * constants */
    var timeStep = 1/60;
    var motorInc = 12; //how many physics steps to run the motor for
    var motorSpd = 0.35; //the motor speed for each of those steps

    /*********************
     * working variables */
    var world;
    var camera, controls, scene, renderer;
    var objs = [];
    var constraints = [];
    var motorSteps = [];

    /******************
     * work functions */
    function initInterstellarWalker() {
        //init engine and renderer
        initThree();
        initCannon();

        //add objects
        var vertOff = LEGL/2 + 0.1;
        var b1 = getBox(THICK, LEGL, THICK, 1, function(body) {
            body.position = new CANNON.Vec3(0, vertOff, 0);
            body.angularVelocity.set(0, 0, 0);
            body.angularDamping = 0;
        });
        var b2 = getBox(THICK, LEGL, THICK, 1, function(body) {
            body.position = new CANNON.Vec3(THICK, vertOff, 0);
        });
        var c1 = getCyl(THICK/4, 2*THICK, 1, function(body) {
            body.position = new CANNON.Vec3(
                THICK/2, (LEGL-THICK)/2 + vertOff, 0
            );
            body.collisionFilterGroup = 0;
            body.quaternion = new CANNON.Quaternion(
                Math.sqrt(2)/2, Math.sqrt(2)/2, 0, 0
            );
        });
        addObj(b1);
        addObj(b2);
        addObj(c1);

        //create hinge constraints
        var cn1 = new CANNON.HingeConstraint(
            b1[0],
            c1[0], {
                pivotA: new CANNON.Vec3(0, (LEGL-THICK)/2, 0),
                axisA: new CANNON.Vec3(1, 0, 0),
                pivotB: new CANNON.Vec3(0, -THICK/2, 0),
                axisB: new CANNON.Vec3(0, 0, 0)
            }
        );
        constraints.push(cn1);
        motorSteps.push(-1);
        var cn2 = new CANNON.HingeConstraint(
            b2[0],
            c1[0], {
                pivotA: new CANNON.Vec3(0, (LEGL-THICK)/2, 0),
                axisA: new CANNON.Vec3(1, 0, 0),
                pivotB: new CANNON.Vec3(0, THICK/2, 0),
                axisB: new CANNON.Vec3(0, 0, 0)
            }
        );
        constraints.push(cn2);
        motorSteps.push(-1);
        for (var ci = 0; ci < constraints.length; ci++) {
            world.addConstraint(constraints[ci]);
        }

        //let the games begin
        animate();
    }

    function initCannon() {
        //setup the world
        world = new CANNON.World();
        world.gravity.set(0, -9.81, 0);
        world.broadphase = new CANNON.NaiveBroadphase();
        world.solver.iterations = 10;

        //add the floor
        var floor = getFloor();
        addObj(floor);

        //event listeners for manual motor control
        document.addEventListener('keyup', function(e) {
            if (e.keyCode === 86) { //v
                motorSteps[0] = motorInc;
                constraints[0].setMotorSpeed(motorSpd);
                constraints[0].enableMotor();
            } else if (e.keyCode === 78) { //n
                motorSteps[1] = motorInc;
                constraints[1].setMotorSpeed(motorSpd);
                constraints[1].enableMotor();
            } else if (e.keyCode === 67) { //c
                motorSteps[0] = motorInc;
                constraints[0].setMotorSpeed(-motorSpd);
                constraints[0].enableMotor();
            } else if (e.keyCode === 77) { //m
                motorSteps[1] = motorInc;
                constraints[1].setMotorSpeed(-motorSpd);
                constraints[1].enableMotor();
            }
        });
    }

    function initThree() {
        //scene and camera
        scene = new THREE.Scene();
        camera = new THREE.PerspectiveCamera(
            75, DIMS[0]/DIMS[1], 1, 1000
        );
        controls = new THREE.GodControls(
            camera, scene, $s('#canvas-container'), {
                moveSpd: 0.27,
                rotSpd: 0.016
            }
        );
        controls.setCameraPosition(0, 4, 5);

        //renderer
        renderer = new THREE.WebGLRenderer({antialias: true});
        renderer.setSize(DIMS[0], DIMS[1]);
        $s('#canvas-container').appendChild(renderer.domElement);
    }

    function animate() {
        requestAnimationFrame(animate);
        updatePhysics();
        render();
    }

    function updatePhysics() {
        //step the physics world
        world.step(timeStep);

        //move the motors
        for (var ai = 0; ai < motorSteps.length; ai++) {
            if (motorSteps[ai] === 0) {
                constraints[ai].disableMotor();
                motorSteps[ai] = -1;
            }
            if (motorSteps[ai] > -1) motorSteps[ai] -= 1;
        }

        //copy coordinates from Cannon.js to Three.js
        for (var ai = 0; ai < objs.length; ai++) {
            objs[ai][1].position.copy(objs[ai][0].position);
            objs[ai][1].quaternion.copy(objs[ai][0].quaternion);
        }
    }

    function render() {
        renderer.render(scene, camera);
        controls.update();
    }

    function addObj(pair) {
        world.addBody(pair[0]);
        scene.add(pair[1]);
        objs.push(pair);
    }

    function getCyl(r, h, mass, bodyFunc) {
        //cannon.js
        var shape = new CANNON.Cylinder(r, r, h, 32);
        var body = new CANNON.Body({
            mass: mass
        });
        body.addShape(shape);
        bodyFunc = bodyFunc || function() {};
        bodyFunc(body);

        //three.js
        var geometry = new THREE.CylinderGeometry(r, r, h, 32);
        var material = new THREE.MeshBasicMaterial({
            color: 0xff0000, wireframe: true
        });
        var mesh = new THREE.Mesh(geometry, material);

        return [body, mesh];
    }

    function getBox(l, h, w, mass, bodyFunc) {
        //cannon.js
        var shape = new CANNON.Box(new CANNON.Vec3(l/2, h/2, w/2));
        var body = new CANNON.Body({
            mass: mass
        });
        body.addShape(shape);
        bodyFunc = bodyFunc || function() {};
        bodyFunc(body);

        //three.js
        var geometry = new THREE.BoxGeometry(l, h, w);
        var material = new THREE.MeshBasicMaterial({
            color: 0xff0000, wireframe: true
        });
        var mesh = new THREE.Mesh(geometry, material);

        return [body, mesh];
    }

    function getFloor() {
        //cannon.js
        var groundBody = new CANNON.Body({
            mass: 0,
            position: new CANNON.Vec3(0, 0, 0),
            quaternion: new CANNON.Quaternion(
                0, Math.sqrt(2)/2, Math.sqrt(2)/2, 0
            )
        });
        var groundShape = new CANNON.Plane();
        groundBody.addShape(groundShape);

        //three.js
        var geometry = new THREE.PlaneGeometry(100, 100);
        var material = new THREE.MeshBasicMaterial({
            color: 0x3FCDCD, side: THREE.DoubleSide
        })
        var groundMesh = new THREE.Mesh(geometry, material);

        return [groundBody, groundMesh];
    }

    /********************
     * helper functions */
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
