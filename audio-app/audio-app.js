// More API functions here:
// https://github.com/googlecreativelab/teachablemachine-community/tree/master/libraries/image

// the link to your model provided by Teachable Machine export panel
//const URL = "https://teachablemachine.withgoogle.com/models/YyxaZHkhU/";
const URL = "https://teachablemachine.withgoogle.com/models/";
const analysisTimeMs = 1000;

let model, webcam, labelContainer, maxPredictions;
let markeringsId = ["tv", "kaffe", "lys"];
let markeringsobjekter = [];

let lastClass = "";
let currentStableClass = "";
lastChangeTime = 0;

async function createModel(modelID) {
    const checkpointURL = URL + modelID + "/model.json"; // model topology
    const metadataURL = URL + modelID + "/metadata.json"; // model metadata

    const recognizer = speechCommands.create(
        "BROWSER_FFT", // fourier transform type, not useful to change
        undefined, // speech commands vocabulary feature, not useful for your models
        checkpointURL,
        metadataURL
    );

    // check that model and metadata are loaded via HTTPS requests.
    await recognizer.ensureModelLoaded();

    return recognizer;
}

async function init() {
    let modelID = getModelId();
    if (modelID != "") {
        const recognizer = await createModel(modelID);
        const classLabels = recognizer.wordLabels(); // get class labels
        console.log(classLabels);
        const labelContainer = document.getElementById("label-container");
        for (let i = 0; i < classLabels.length; i++) {
            labelContainer.appendChild(document.createElement("div"));
        }

        // listen() takes two arguments:
        // 1. A callback function that is invoked anytime a word is recognized.
        // 2. A configuration object with adjustable fields
        recognizer.listen(
            (result) => {
                const scores = result.scores; // probability of prediction for each class
                // render the probability scores per class
                for (let i = 0; i < classLabels.length; i++) {
                    const classPrediction =
                        classLabels[i] + ": " + result.scores[i].toFixed(2);
                    labelContainer.childNodes[i].innerHTML = classPrediction;
                }
            },
            {
                includeSpectrogram: false, // in case listen should return result.spectrogram
                probabilityThreshold: 0.75,
                invokeCallbackOnNoiseAndUnknown: true,
                overlapFactor: 0.5, // probably want between 0.5 and 0.75. More info in README
            }
        );

        // Stop the recognition in 5 seconds.
        // setTimeout(() => recognizer.stopListening(), 5000);
    } else {
        alert("Model ID mangler!");
    }
}

// Load the image model and setup the webcam
/* async function init(button) {
    button.disabled = true;
    lastChangeTime = Date.now;

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

    removePlaceholders();
    window.requestAnimationFrame(loop);
    appendElementsToDom();
    findModelElements();
} */

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

function getModelId() {
    let id = document.getElementById("model-id").value;
    console.log("Model ID: " + id);
    return id;
}

function removePlaceholders() {
    //Remove kamera placeholder text and input field
    let cameraText = document.getElementById("webcam-text");
    let inputfield = document.getElementById("model-id");
    cameraText.style.display = "none";
    inputfield.style.display = "none";
}

function appendElementsToDom() {
    // append elements to the DOM
    document.getElementById("webcam-container").appendChild(webcam.canvas);
    labelContainer = document.getElementById("label-container");
    for (let i = 0; i < maxPredictions; i++) {
        // and class labels
        labelContainer.appendChild(document.createElement("div"));
    }
}

function findModelElements() {
    for (let i = 0; i < markeringsId.length; i++) {
        markeringsobjekter.push(document.getElementById(markeringsId[i]));
    }
}
