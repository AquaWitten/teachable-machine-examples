// More API functions here:
// https://github.com/googlecreativelab/teachablemachine-community/tree/master/libraries/image

// the link to your model provided by Teachable Machine export panel
//const URL = "https://teachablemachine.withgoogle.com/models/E-0_hzAhF/";
const URL = "https://teachablemachine.withgoogle.com/models/";

let labelContainer;
let markeringsId = ["kaffe", "lys", "tv"];
let markeringsobjekter = [];
let currentSelection;
let lastPrediction = { score: 0, label: "" };

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
        findModelElements();

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
                appendElementsToDom(labelContainer, classLabels, scores);

                let predictions = combineScoreAndLabel(scores, classLabels);
                let bestPrediction = findBestPrediction(predictions);

                if (bestPrediction.label != lastPrediction.label) {
                    lastPrediction = bestPrediction;
                    handlePrediction(bestPrediction);
                }
            },
            {
                includeSpectrogram: false, // in case listen should return result.spectrogram
                probabilityThreshold: 0.7,
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

function findBestPrediction(predictions) {
    predictions.sort((a, b) => b.score - a.score);
    return predictions[0];
}

function combineScoreAndLabel(scores, labels) {
    if (scores.length != scores.length) {
        console.error("Amount of Scores and labels do not match");
        return null;
    }
    let predictions = [];
    for (let i = 0; i < scores.length; i++) {
        predictions.push({
            score: scores[i],
            label: labels[i],
        });
    }

    return predictions;
}

function handlePrediction(prediction) {
    switch (prediction.label.toLowerCase()) {
        case "tænd":
            console.log("Tænd registreret");
            if (currentSelection != null) {
                currentSelection.classList.add("on");
                currentSelection.classList.remove("off");
                removeSelection();
            }
            removeSelection();
            break;
        case "sluk":
            console.log("Sluk registreret");
            if (currentSelection != null) {
                currentSelection.classList.add("off");
                currentSelection.classList.remove("on");
                removeSelection();
            }
            break;
        case "kaffe":
            console.log("Kaffe registreret");
            removeSelection();
            setSelection(markeringsobjekter[0]);
            break;
        case "lys":
            console.log("Lys registreret");
            removeSelection();
            setSelection(markeringsobjekter[1]);
            break;
        case "tv":
            console.log("TV registreret");
            removeSelection();
            setSelection(markeringsobjekter[2]);
            break;
        case "background noise":
        case "unknown":
            console.log("Baggrundslyd registeret");
            break;
        default:
            console.log("uidentificerbart objekt");
    }
}

function removeSelection() {
    if (currentSelection == null) {
        console.log("Current selection is null");
        return;
    }

    currentSelection.classList.remove("selected");
    currentSelection = null;
}

function setSelection(objekt) {
    objekt.classList.add("selected");
    currentSelection = objekt;
}

function getModelId() {
    let id = document.getElementById("model-id").value;
    console.log("Model ID: " + id);
    return id;
}

function appendElementsToDom(labelContainer, classLabels, scores) {
    // render the probability scores per class
    for (let i = 0; i < classLabels.length; i++) {
        const classPrediction = classLabels[i] + ": " + scores[i].toFixed(2);
        labelContainer.childNodes[i].innerHTML = classPrediction;
    }
}

function findModelElements() {
    for (let i = 0; i < markeringsId.length; i++) {
        markeringsobjekter.push(document.getElementById(markeringsId[i]));
    }
}
