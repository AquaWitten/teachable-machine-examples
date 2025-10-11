// More API functions here:
// https://github.com/googlecreativelab/teachablemachine-community/tree/master/libraries/image

// the link to your model provided by Teachable Machine export panel
//const URL = "https://teachablemachine.withgoogle.com/models/fbz9_1zvV/";
const URL = "https://teachablemachine.withgoogle.com/models/";
const analysisTimeMs = 1000;

let model, webcam, ctx, labelContainer, maxPredictions;

let markeringsobjekter = [];

let lastClass = "";
let currentStableClass = "";
lastChangeTime = 0;

//New
let lastPose, nextPose;
let markeringsId = ["upward-salute", "extended-side", "warrior"];

//New end

// Load the image model and setup the webcam
async function init(button) {
    button.disabled = true;
    lastChangeTime = Date.now;
    let modelID = getModelId();
    const modelURL = URL + modelID + "/model.json";
    const metadataURL = URL + modelID + "/metadata.json";

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

    hiddeCameraPlaceholders();
    window.requestAnimationFrame(loop);

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

    for (let i = 0; i < markeringsId.length; i++) {
        markeringsobjekter.push(document.getElementById(markeringsId[i]));
    }
}

async function loop() {
    webcam.update(); // update the webcam frame
    let predictions = await predict();

    let bestPrediction = findBestPrediction(predictions);
    console.log("bestPrediction");
    //markHigestPrediction(bestPrediction.className);

    let now = Date.now();
    if (bestPrediction.className !== lastClass) {
        //Class changed
        lastClass = bestPrediction.className;
        lastChangeTime = now;
    } else {
        if (currentStableClass !== lastClass) {
            if (now >= lastChangeTime + analysisTimeMs) {
                console.log("Current stable class opdateret");
                currentStableClass = bestPrediction.className;
                lastClass = currentStableClass;
                markHigestPrediction(currentStableClass);
            }
        }
    }

    window.requestAnimationFrame(loop);
}

// run the webcam image through the image model
async function predict() {
    // Prediction #1: run input through posenet
    // estimatePose can take in an image, video or canvas html element
    const { pose, posenetOutput } = await model.estimatePose(webcam.canvas);
    // Prediction 2: run input through teachable machine classification model
    const prediction = await model.predict(posenetOutput);

    drawPredictionLabels(prediction);

    // finally draw the poses
    drawPose(pose);

    // predict can take in an image, video or canvas html element
    return model.predict(webcam.canvas);
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

function drawPredictionLabels(prediction) {
    for (let i = 0; i < maxPredictions; i++) {
        const classPrediction =
            prediction[i].className +
            ": " +
            prediction[i].probability.toFixed(2);
        labelContainer.childNodes[i].innerHTML = classPrediction;
    }
}

function findBestPrediction(predictions) {
    return predictions.reduce((max, p) =>
        p.probability > max.probability ? p : max
    );
}

function markHigestPrediction(className) {
    switch (className) {
        case "upward salute":
            console.log("Metal er fundet");
            resetMarking();
            selectMarkering(markeringsobjekter[0]);
            break;
        case "extended side angle":
            console.log("Plastik er fundet");
            resetMarking();
            selectMarkering(markeringsobjekter[1]);
            break;
        case "warrior":
            console.log("Restaffald er fundet");
            resetMarking();
            selectMarkering(markeringsobjekter[2]);
            break;
        default:
            console.log("uidentificerbart objekt");
            resetMarking();
    }
}

function resetMarking() {
    for (let i = 0; i < markeringsobjekter.length; i++) {
        let object = markeringsobjekter[i];
        object.classList.remove("selected");
        if (object.classList.contains("open")) {
            object.classList.remove("open");
            object.classList.add("closed");
        }
    }
}

function selectMarkering(objekt) {
    objekt.classList.add("selected");
    objekt.classList.remove("closed");
    objekt.classList.add("open");
}

function getModelId() {
    let id = document.getElementById("model-id").value;
    console.log("Model ID: " + id);
    return id;
}

//Analyse the current pose
function isCurrentPoseCorrent(pose) {
    //Pose is the correct pose next pose
    if (pose !== lastClass && pose === targetClass) {
        //Start count down
    }
    //Last pose, current pose and nextpose are the same
    //Continue count down
    else if (pose === lastClass && pose === targetClass) {
        //DO nothing?
    }
    //current pose is different from next pose, next pose and last pose are the same
    else if (pose !== targetClass && lastClass === targetClass) {
        //Stop count down and reset
    }

    lastClass = pose;
}

function setNewNextPose() {
    let newNextPoseIndex = Math.floor(Math.random() * markeringsId.length);
    let potentialNextPose = markeringsId[newNextPoseIndex];

    if (potentialNextPose !== targetClass) {
        targetClass = potentialNextPose;
    } else {
        setNewNextPose();
    }
}

function hiddeCameraPlaceholders() {
    let cameraText = document.getElementById("webcam-text");
    let inputfield = document.getElementById("model-id");
    cameraText.style.display = "none";
    inputfield.style.display = "none";
}
