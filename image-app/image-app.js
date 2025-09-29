// More API functions here:
// https://github.com/googlecreativelab/teachablemachine-community/tree/master/libraries/image

// the link to your model provided by Teachable Machine export panel
const URL = "https://teachablemachine.withgoogle.com/models/kpsqAbiMH/";
const analysisTimeMs = 1000;

let model, webcam, labelContainer, maxPredictions;
let markeringsId = ["metal", "plastic", "restaffald"];
let markeringsobjekter = [];

let lastClass = "";
let currentStableClass = "";
lastChangeTime = 0;

// Load the image model and setup the webcam
async function init(button) {
    button.disabled = true;
    lastChangeTime = Date.now;
    const modelURL = URL + "model.json";
    const metadataURL = URL + "metadata.json";

    // load the model and metadata
    // Refer to tmImage.loadFromFiles() in the API to support files from a file picker
    // or files from your local hard drive
    // Note: the pose library adds "tmImage" object to your window (window.tmImage)
    model = await tmImage.load(modelURL, metadataURL);
    maxPredictions = model.getTotalClasses();

    // Convenience function to setup a webcam
    const flip = true; // whether to flip the webcam
    webcam = new tmImage.Webcam(400, 400, true); // width, height, flip
    await webcam.setup(); // request access to the webcam
    await webcam.play();
    window.requestAnimationFrame(loop);

    // append elements to the DOM
    document.getElementById("webcam-container").appendChild(webcam.canvas);
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
    drawPredictionLabels(predictions);
    let bestPrediction = findBestPrediction(predictions);
    //markHigestPrediction(bestPrediction.className);

    let now = Date.now();
    if (bestPrediction.className !== lastClass) {
        /* console.log("Nye prediction er anderledes end sidste"); */
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
    // predict can take in an image, video or canvas html element
    return model.predict(webcam.canvas);
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
    return (bestPrediction = predictions.reduce((max, p) =>
        p.probability > max.probability ? p : max
    ));
}

function markHigestPrediction(className) {
    switch (className) {
        case "metal":
            console.log("Metal er fundet");
            resetMarking();
            selectMarkering(markeringsobjekter[0]);
            break;
        case "plastik":
            console.log("Plastik er fundet");
            resetMarking();
            selectMarkering(markeringsobjekter[1]);
            break;
        case "restaffald":
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
