const skinParts = ["head", "body", "rightArm", "leftArm", "rightLeg", "leftLeg"];
const skinLayers = ["innerLayer", "outerLayer"];
const availableAnimations = {
    idle: skinview3d.IdleAnimation,
    walk: skinview3d.WalkingAnimation,
    run: skinview3d.RunningAnimation,
    fly: skinview3d.FlyingAnimation
};
const SIZE = 10;

//let skinViewer1, skinViewer2;
//let rotateAnimation1, rotateAnimation2;
//let primaryAnimation1, primaryAnimation2;

let skinViewers = [];
let rotateAnimations = [];
let primaryAnimations = [];

let orbitControl;

function obtainTextureUrl(id) {
    const urlInput = document.getElementById(id);
    const fileInput = document.getElementById(id + "_upload");
    const unsetButton = document.getElementById(id + "_unset");
    const file = fileInput.files[0];
    if (file === undefined) {
        if (!unsetButton.classList.contains("hidden")) {
            unsetButton.classList.add("hidden");
        }
        return urlInput.value;
    } else {
        unsetButton.classList.remove("hidden");
        urlInput.value = `Local file: ${file.name}`;
        urlInput.readOnly = true;
        return URL.createObjectURL(file);
    }
}

function reloadSkin() {
    const input = document.getElementById("skin_url");
    let url = obtainTextureUrl("skin_url");

    function funReloadSkin(skinViewer) {
        if (url == "") {
            url = 'img/steve.png';
        }

        skinViewer.loadSkin(url, {

        })
            .then(() => input.setCustomValidity(""))
            .catch(e => {
                input.setCustomValidity("Image can't be loaded.");
                console.error(e);
            });
    }

    for (const skinViewer of skinViewers) {
        funReloadSkin(skinViewer);
    }
}

function reloadPanorama() {
    const input = document.getElementById("panorama_url");
    const url = obtainTextureUrl("panorama_url");

    function funReloadPanorama(skinViewer) {
        if (url === "") {
            skinViewer.background = "white";
            input.setCustomValidity("");
        } else {
            skinViewer.loadPanorama(url)
                .then(() => input.setCustomValidity(""))
                .catch(e => {
                    input.setCustomValidity("Image can't be loaded.");
                    console.error(e);
                });
        }
    }

    for (const skinViewer of skinViewers) {
        funReloadPanorama(skinViewer);
    }
}

function initializeControls() {

    function reInitializeControls(skinViewer, rotateAnimation, primaryAnimation) {
        //skinViewer.animations.add(availableAnimations['run']);
        //primaryAnimation.speed = document.getElementById("primary_animation_speed").value;

        document.getElementById("global_animation_speed").addEventListener("change", e => skinViewer.animations.speed = e.target.value);
        document.getElementById("animation_pause_resume").addEventListener("click", () => skinViewer.animations.paused = !skinViewer.animations.paused);
        document.getElementById("rotate_animation").addEventListener("change", e => {
            if (e.target.checked && rotateAnimation === null) {
                rotateAnimation = skinViewer.animations.add(skinview3d.RotatingAnimation);
                rotateAnimation.speed = document.getElementById("rotate_animation_speed").value;
            } else if (!e.target.checked && rotateAnimation !== null) {
                rotateAnimation.resetAndRemove();
                rotateAnimation = null;
            }
        });

        for (const el of document.querySelectorAll('input[type="radio"][name="primary_animation"]')) {
            el.addEventListener("change", e => {
                if (primaryAnimation !== null) {
                    primaryAnimation.resetAndRemove();
                    primaryAnimation = null;
                }
                if (e.target.value !== "") {
                    primaryAnimation = skinViewer.animations.add(availableAnimations[e.target.value]);
                    primaryAnimation.speed = document.getElementById("primary_animation_speed").value;
                }
            });
        }

        for (const part of skinParts) {
            for (const layer of skinLayers) {
                document.querySelector(`#layers_table input[type="checkbox"][data-part="${part}"][data-layer="${layer}"]`)
                    .addEventListener("change", e => skinViewer.playerObject.skin[part][layer].visible = e.target.checked);
            }
        }

        document.getElementById("rotate_animation_speed").addEventListener("change", e => {
            if (rotateAnimation !== null) {
                rotateAnimation.speed = e.target.value;
            }
        });

        document.getElementById("primary_animation_speed").addEventListener("change", e => {
            if (primaryAnimation !== null) {
                primaryAnimation.speed = e.target.value;
            }
        });


        
    }

    for (var i = 0; i < SIZE; i++) {
        reInitializeControls(skinViewers[i], rotateAnimations[i], primaryAnimations[i]);
    }

}

function initializeViewer() {
    
    function reInitializeViewer(skinViewer, rotateAnimation, primaryAnimation) {
        skinViewer.width = 300;
        skinViewer.height = 300;
        skinViewer.fov = 70;
        skinViewer.zoom = 0.90;
        skinViewer.globalLight.intensity = 0.40;
        skinViewer.cameraLight.intensity = 0.60;

        orbitControl = skinview3d.createOrbitControls(skinViewer);

        skinViewer.animations.speed = document.getElementById("global_animation_speed").value;
        if (document.getElementById("rotate_animation").checked) {
            rotateAnimation = skinViewer.animations.add(skinview3d.RotatingAnimation);
            rotateAnimation.speed = document.getElementById("rotate_animation_speed").value;
        }
        const primaryAnimationName = document.querySelector('input[type="radio"][name="primary_animation"]:checked').value;
        if (primaryAnimationName !== "") {
            primaryAnimation = skinViewer.animations.add(availableAnimations[primaryAnimationName]);
            primaryAnimation.speed = document.getElementById("primary_animation_speed").value;
        }
        orbitControl.enableRotate = true;
        orbitControl.enableZoom = true;
        orbitControl.enablePan = false;
        for (const part of skinParts) {
            for (const layer of skinLayers) {
                skinViewer.playerObject.skin[part][layer].visible =
                    document.querySelector(`#layers_table input[type="checkbox"][data-part="${part}"][data-layer="${layer}"]`).checked;
            }
        }
    }

    for (const skinViewer of skinViewers) {
        reInitializeViewer(skinViewer);
    }



    const initializeUploadButton = (id, callback) => {
        const urlInput = document.getElementById(id);
        const fileInput = document.getElementById(id + "_upload");
        const unsetButton = document.getElementById(id + "_unset");
        const unsetAction = () => {
            urlInput.readOnly = false;
            urlInput.value = "";
            fileInput.value = fileInput.defaultValue;
            callback();
        };
        fileInput.addEventListener("change", e => callback());
        urlInput.addEventListener("keydown", e => {
            if (e.key === "Backspace" && urlInput.readOnly) {
                unsetAction();
            }
        });
        unsetButton.addEventListener("click", e => unsetAction());
    };
    initializeUploadButton("skin_url", reloadSkin);
    initializeUploadButton("panorama_url", reloadPanorama);

    document.getElementById("skin_url").addEventListener("change", () => reloadSkin());
    document.getElementById("panorama_url").addEventListener("change", () => reloadPanorama());


    reloadSkin();
    reloadPanorama();
}

function initializeAnimation() {
    for(var i = 0; i < SIZE; i++) {
        rotateAnimations.push(null);
        primaryAnimations.push(null);
    }
}

function initializeSkinViewer() {

    for(var i=0; i<SIZE; i++) {
        const skinViewer = new skinview3d.FXAASkinViewer({
            canvas: document.getElementById("skin_container" + i)
        });
        skinViewers.push(skinViewer);
    }
}

function onMouse(num){
    rotateAnimations[num] = skinViewers[num].animations.add(skinview3d.RotatingAnimation);
    rotateAnimations[num].speed = document.getElementById("rotate_animation_speed").value;
}
function outMouse(num){
    rotateAnimations[num].resetAndRemove();
    rotateAnimations[num] = null;
}

initializeSkinViewer();
initializeAnimation();

initializeViewer();

initializeControls();