const skinParts = ["head", "body", "rightArm", "leftArm", "rightLeg", "leftLeg"];
		const skinLayers = ["innerLayer", "outerLayer"];
		const availableAnimations = {
			idle: skinview3d.IdleAnimation,
			walk: skinview3d.WalkingAnimation,
			run: skinview3d.RunningAnimation,
			fly: skinview3d.FlyingAnimation
		};

		let skinViewer;
		let orbitControl;
		let rotateAnimation;
		let primaryAnimation;

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
			const url = obtainTextureUrl("skin_url");
			if (url === "") {
				skinViewer.loadSkin(null);
				input.setCustomValidity("");
			} else {
				skinViewer.loadSkin(url, {
					model: document.getElementById("skin_model").value,
					ears: document.getElementById("ears_source").value === "current_skin"
				})
					.then(() => input.setCustomValidity(""))
					.catch(e => {
						input.setCustomValidity("Image can't be loaded.");
						console.error(e);
					});
			}
		}

		function reloadCape() {
			const input = document.getElementById("cape_url");
			const url = obtainTextureUrl("cape_url");
			if (url === "") {
				skinViewer.loadCape(null);
				input.setCustomValidity("");
			} else {
				const selectedBackEquipment = document.querySelector('input[type="radio"][name="back_equipment"]:checked');
				skinViewer.loadCape(url, { backEquipment: selectedBackEquipment.value })
					.then(() => input.setCustomValidity(""))
					.catch(e => {
						input.setCustomValidity("Image can't be loaded.");
						console.error(e);
					});
			}
		}

		function reloadEars(skipSkinReload = false) {
			const sourceType = document.getElementById("ears_source").value;
			let hideInput = true;
			if (sourceType === "none") {
				skinViewer.loadEars(null);
			} else if (sourceType === "current_skin") {
				if (!skipSkinReload){
					reloadSkin();
				}
			} else {
				hideInput = false;
				document.querySelectorAll("#default_ears option[data-texture-type]").forEach(opt => {
					opt.disabled = opt.dataset.textureType !== sourceType;
				});

				const input = document.getElementById("ears_url");
				const url = obtainTextureUrl("ears_url");
				if (url === "") {
					skinViewer.loadEars(null);
					input.setCustomValidity("");
				} else {
					skinViewer.loadEars(url, { textureType: sourceType })
						.then(() => input.setCustomValidity(""))
						.catch(e => {
							input.setCustomValidity("Image can't be loaded.");
							console.error(e);
						});
				}
			}

			const el = document.getElementById("ears_texture_input");
			if (hideInput) {
				if (!(el.classList.contains("hidden"))){
					el.classList.add("hidden");
				}
			} else {
				el.classList.remove("hidden");
			}
		}

		function reloadPanorama() {
			const input = document.getElementById("panorama_url");
			const url = obtainTextureUrl("panorama_url");
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

		function initializeControls() {

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
			document.getElementById("rotate_animation_speed").addEventListener("change", e => {
				if (rotateAnimation !== null) {
					rotateAnimation.speed = e.target.value;
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
			document.getElementById("primary_animation_speed").addEventListener("change", e => {
				if (primaryAnimation !== null) {
					primaryAnimation.speed = e.target.value;
				}
			});
			document.getElementById("control_rotate").addEventListener("change", e => orbitControl.enableRotate = e.target.checked);
			document.getElementById("control_zoom").addEventListener("change", e => orbitControl.enableZoom = e.target.checked);
			document.getElementById("control_pan").addEventListener("change", e => orbitControl.enablePan = e.target.checked);
			for (const part of skinParts) {
				for (const layer of skinLayers) {
					document.querySelector(`#layers_table input[type="checkbox"][data-part="${part}"][data-layer="${layer}"]`)
						.addEventListener("change", e => skinViewer.playerObject.skin[part][layer].visible = e.target.checked);
				}
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
			initializeUploadButton("cape_url", reloadCape);
			initializeUploadButton("ears_url", reloadEars);
			initializeUploadButton("panorama_url", reloadPanorama);

			document.getElementById("skin_url").addEventListener("change", () => reloadSkin());
			document.getElementById("skin_model").addEventListener("change", () => reloadSkin());
			document.getElementById("cape_url").addEventListener("change", () => reloadCape());
			document.getElementById("ears_source").addEventListener("change", () => reloadEars());
			document.getElementById("ears_url").addEventListener("change", () => reloadEars());
			document.getElementById("panorama_url").addEventListener("change", () => reloadPanorama());

			for (const el of document.querySelectorAll('input[type="radio"][name="back_equipment"]')) {
				el.addEventListener("change", e => {
					if (skinViewer.playerObject.backEquipment === null) {
						// cape texture hasn't been loaded yet
						// this option will be processed on texture loading
					} else {
						skinViewer.playerObject.backEquipment = e.target.value;
					}
				});
			}

			document.getElementById("reset_all").addEventListener("click", () => {
				skinViewer.dispose();
				orbitControl.dispose();
				initializeViewer();
			});
		}

		function initializeViewer() {
			skinViewer = new skinview3d.FXAASkinViewer({
				canvas: document.getElementById("skin_container")
			});
			orbitControl = skinview3d.createOrbitControls(skinViewer);
			rotateAnimation = null;
			primaryAnimation = null;

			
            skinViewer.width = 300;
            skinViewer.height = 300;
            skinView.fov = 70;
            skinViewer.zoom = 0.90;
            skinViewer.globalLight.intensity = 0.40;
            skinViewer.cameraLight.intensity = 0.60;


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
			orbitControl.enableRotate = document.getElementById("control_rotate").checked;
			orbitControl.enableZoom = document.getElementById("control_zoom").checked;
			orbitControl.enablePan = document.getElementById("control_pan").checked;
			for (const part of skinParts) {
				for (const layer of skinLayers) {
					skinViewer.playerObject.skin[part][layer].visible =
						document.querySelector(`#layers_table input[type="checkbox"][data-part="${part}"][data-layer="${layer}"]`).checked;
				}
			}
			reloadSkin();
			reloadCape();
			reloadEars(true);
			reloadPanorama();
		}

		initializeControls();
		initializeViewer();