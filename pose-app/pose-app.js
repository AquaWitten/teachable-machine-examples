// More API functions here:
// https://github.com/googlecreativelab/teachablemachine-community/tree/master/libraries/pose

// the link to your model provided by Teachable Machine export panel
//const URL = "https://teachablemachine.withgoogle.com/models/fbz9_1zvV/";
const URL = "https://teachablemachine.withgoogle.com/models/";
const MODEL_CLASS_LABELS = ["upward-salute", "extended-side", "warrior"];
let model, webcam, ctx, labelContainer, maxPredictions;
let lastClass, targetClass, lastChangeTime;
let poseLockedIn = false;
let targetPoseElements = [];

async function init() {
    const MODEL_ID = getModelId();
    const modelURL = URL + MODEL_ID + "/model.json";
    const metadataURL = URL + MODEL_ID + "/metadata.json";

    // load the model and metadata
    // Refer to tmImage.loadFromFiles() in the API to support files from a file picker
    // Note: the pose library adds a tmPose object to your window (window.tmPose)
    model = await tmPose.load(modelURL, metadataURL);
    maxPredictions = model.getTotalClasses();

    // Convenience function to setup a webcam
    const size = 400;
    const flip = true; // whether to flip the webcam
    webcam = new tmPose.Webcam(size, size, flip); // width, height, flip
    await webcam.setup(); // request access to the webcam
    await webcam.play();

    getTargetPoseElements();
    setNewNextPose();
    window.requestAnimationFrame(loop);

    //Hidde Camera placeholders
    hiddeCameraPlaceholders();

    // append/get elements to the DOM
    const canvas = document.getElementById("canvas");
    canvas.width = size;
    canvas.height = size;
    ctx = canvas.getContext("2d");
    labelContainer = document.getElementById("label-container");
    for (let i = 0; i < maxPredictions; i++) {
        // and class labels
        labelContainer.appendChild(document.createElement("div"));
    }
}

async function loop() {
    webcam.update(); // update the webcam frame
    //predictions array with object: {className, probability}
    let predictions = await predict();

    //Handle app logic
    let bestPrediction = findBestPrediction(predictions);
    let predictionClass = bestPrediction.className;

    if (predictionClass !== lastClass) {
        lastChangeTime = Date.now();
        if (poseLockedIn) {
            //Have a small timer that allows you to be off for a few milliseconds
        }
    } else if (predictionClass === targetClass && !poseLockedIn) {
        poseLockedIn = true;
        //Add class to start animation
        //Start timer to completion
        
    }
    lastClass = predictionClass;
    window.requestAnimationFrame(loop);
}

async function predict() {
    // Prediction #1: run input through posenet
    // estimatePose can take in an image, video or canvas html element
    const { pose, posenetOutput } = await model.estimatePose(webcam.canvas);
    // Prediction 2: run input through teachable machine classification model
    const prediction = await model.predict(posenetOutput);

    for (let i = 0; i < maxPredictions; i++) {
        const classPrediction =
            prediction[i].className +
            ": " +
            prediction[i].probability.toFixed(2);
        labelContainer.childNodes[i].innerHTML = classPrediction;
    }

    // finally draw the poses
    drawPose(pose);
    return prediction;
}

function drawPose(pose) {
    if (webcam.canvas) {
        ctx.drawImage(webcam.canvas, 0, 0);
        // draw the keypoints and skeleton
        if (pose) {
            const minPartConfidence = 0.5;
            tmPose.drawKeypoints(pose.keypoints, minPartConfidence, ctx);
            tmPose.drawSkeleton(pose.keypoints, minPartConfidence, ctx);
        }
    }
}

//Custom code
function getModelId() {
    let id = document.getElementById("model-id").value;
    console.log("Model ID: " + id);
    return id;
}

function hiddeCameraPlaceholders() {
    let cameraText = document.getElementById("webcam-text");
    let inputfield = document.getElementById("model-id-container");
    cameraText.style.display = "none";
    inputfield.style.display = "none";
}

function findBestPrediction(predictions) {
    return predictions.reduce((max, p) =>
        p.probability > max.probability ? p : max
    );
}

function getTargetPoseElements() {
    for (let i = 0; i < MODEL_CLASS_LABELS.length; i++) {
        targetPoseElements.push(document.getElementById(MODEL_CLASS_LABELS[i]));
    }
}

function setNewNextPose() {
    let newNextPoseIndex = Math.floor(
        Math.random() * MODEL_CLASS_LABELS.length
    );
    let potentialNextPose = MODEL_CLASS_LABELS[newNextPoseIndex];

    if (potentialNextPose !== targetClass) {
        targetClass = potentialNextPose;
    } else {
        setNewNextPose();
    }

    updateSelectionMarker(targetClass);
    console.log("New target pose: " + targetClass);
}

function updateSelectionMarker(targetClass) {
    for (let i = 0; i < targetPoseElements.length; i++) {
        targetPoseElements[i].classList.remove("selected");
    }

    switch (targetClass) {
        case "upward-salute":
            setSelectedClass(targetPoseElements[0]);
            break;
        case "extended-side":
            setSelectedClass(targetPoseElements[1]);
            break;
        case "warrior":
            setSelectedClass(targetPoseElements[2]);
    }
}

function setSelectedClass(object) {
    object.classList.add("selected");
}
