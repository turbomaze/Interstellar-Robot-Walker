/**
 * @author turbomaze / https://igliu.com/
 */

THREE.GodControls = function(camera, scene, canvContainer, params) {
    params = params || {};
    var self = this;

    //variables related to the camera
	this.camera = camera;
    this.scene = scene;
    this.cameraHolder = new THREE.Object3D();
	this.cameraHolder.add(this.camera);
	this.scene.add(this.cameraHolder);

    //variables related to the dom element
	this.canvContainer = (canvContainer !== undefined)?canvContainer:document;
    this.canvContainer.style.cursor = 'pointer';

    //variables related to lag compensation
    this.numFramesToSample = params.numFramesToSample || 5;
    this.goalMSPerFrame = params.goalMSPerFrame || (1000/60);
    this.frames = 0;
	this.timeAccumulator = 0;
	this.lastSampleTime = this.numFramesToSample*this.goalMSperFrame;
	this.renderStartTime = false;

    //variables to do with controls
	this.keys = [];
    this.moveSpd = params.moveSpd || 0.03;
    this.rotSpd = params.rotSpd || 0.018;

    //misc variables
    this.every = params.every || function(){};
    this.everyChange = params.everyChange || function(){};

    //this function must be called inside your project's render function
	this.update = function() {
        this.frames++;
        if (this.focus) {
    		var mult = this.lastSampleTime;
            mult /= this.numFramesToSample*this.goalMSPerFrame;
    		var adjMoveSpd = mult*this.moveSpd;
    		var adjRotSpd = mult*this.rotSpd;

    		if (this.keys[87]) { //w
    			this.cameraHolder.translateZ(-adjMoveSpd);
    		} if (this.keys[65]) { //a
    			this.cameraHolder.translateX(-adjMoveSpd);
    		} if (this.keys[83]) { //s
    			this.cameraHolder.translateZ(adjMoveSpd);
    		} if (this.keys[68]) { //d
    			this.cameraHolder.translateX(adjMoveSpd);
    		}

    		if (this.keys[32]) { //space
    			this.cameraHolder.translateY(adjMoveSpd);
    		} if (this.keys[16]) { //shift
    			this.cameraHolder.translateY(-adjMoveSpd);
    		}

    		if (this.keys[38]) { //up
    			this.camera.rotateX(adjRotSpd);
    		} if (this.keys[40]) { //down
    			this.camera.rotateX(-adjRotSpd);
    		} if (this.keys[37]) { //left
    			this.cameraHolder.rotateY(1.25*adjRotSpd);
    		} if (this.keys[39]) { //right
    			this.cameraHolder.rotateY(-1.25*adjRotSpd);
    		}

            this.everyChange(this.cameraHolder);
    	}

        this.every(this.cameraHolder);

        var elapsed = this.renderStartTime ? (
            +new Date() - this.renderStartTime
        ) : this.goalMSPerFrame;
    	this.timeAccumulator += elapsed;
    	if (this.frames%this.numFramesToSample === 0) {
    		this.lastSampleTime = this.timeAccumulator;
    		this.timeAccumulator = 0;
    	}
    	this.renderStartTime = +new Date();
    };

    //call this to set the camera's position
    this.setCameraPosition = function(x, y, z) {
        this.cameraHolder.position.set(x, y, z);
    };

    //event listeners
    window.addEventListener('keydown', function(e) {
		self.keys[e.keyCode] = true;
		if (self.focus) {
			e.stopPropagation();
			e.preventDefault();
		}
	});
	window.addEventListener('keyup', function(e) {
		self.keys[e.keyCode] = false;
		if (self.focus) {
			e.stopPropagation();
			e.preventDefault();
		}
	});
	this.canvContainer.addEventListener('click', function() {
		self.canFocus = true;
		self.focus = true;
	});
	document.addEventListener('click', function() {
		self.focus = self.canFocus;
		self.canFocus = false;
	});
};
