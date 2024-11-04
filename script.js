let model;
let scale = 1;  // For zoom
let rotate = 0;  // For rotation
let top3Results = [];  // To store top 3 predictions

// Load TensorFlow.js with WebGL backend
tf.setBackend('webgl').then(() => {
    console.log('Using WebGL backend');
    loadModel();
});

// Load the TensorFlow.js model
async function loadModel() {
    try {
        model = await tf.loadGraphModel('https://dasmedhubweightfiles.blob.core.windows.net/dasmedhub-models/model.json?sp=r&st=2024-11-04T13:03:18Z&se=2024-11-29T21:03:18Z&sv=2022-11-02&sr=b&sig=ceteUzwBtdwCG0ot2bAj%2FXI7hkgNMweuD%2FdMNbku5gE%3D');  // Adjust model path accordingly
        console.log('Model loaded successfully');
    } catch (error) {
        console.error('Error loading model:', error);
    }
}

// DOM elements
const imageUpload = document.getElementById('image-upload');
const uploadedImage = document.getElementById('uploaded-image');
const predictButton = document.getElementById('predict-button');
const resultDiv = document.getElementById('result');
const zoomInButton = document.getElementById('zoom-in');
const zoomOutButton = document.getElementById('zoom-out');
const rotateLeftButton = document.getElementById('rotate-left');
const rotateRightButton = document.getElementById('rotate-right');
const downloadPdfButton = document.getElementById('download-pdf');

// Image Upload Event
imageUpload.addEventListener('change', (event) => {
    const file = event.target.files[0];
    const reader = new FileReader();

    resultDiv.innerText = '';  // Clear previous predictions

    reader.onload = function (e) {
        uploadedImage.src = e.target.result;
        uploadedImage.style.display = 'block';
        predictButton.style.display = 'inline-block';
        predictButton.disabled = false;  // Enable the predict button
    };

    if (file) {
        reader.readAsDataURL(file);
    }
});

// Predict Function
async function predict() {
    try {
        predictButton.disabled = true;  // Disable during prediction
        resultDiv.innerText = 'Predicting...';

        // Preprocess image
        const tensorImg = tf.browser.fromPixels(uploadedImage)
            .resizeBilinear([224, 224])
            .toFloat()
            .div(tf.scalar(255))
            .expandDims();

        // Make the prediction
        const logits = model.predict(tensorImg);
        const predictions = logits.arraySync()[0];  // Get raw predictions
        console.log('Raw Predictions:', predictions);

       
        // Class names must match your model's labels
        const classNames = ['Acute Lymphoblastic Leukemia Benign', 'Acute Lymphoblastic Leukemia Early', 'Acute Lymphoblastic Leukemia Pre', 'Acute Lymphoblastic Leukemia Pro', 
            'Brain Glioma', 'Brain Meningioma', 'Brain Tumor', 
            'Breast Benign', 'Breast Malignant', 
            'Cervix Dyskeratotic', 'Cervix Koilocytotic', 'Cervix Metaplastic', 'Cervix Parabasal', 
            'Cervix Superficial Intermediate', 'Colon Adenocarcinoma', 'Colon Benign Tissue', 
            'Kidney Normal', 'Kidney Tumor', 
            'Lung Adenocarcinoma', 'Lung Benign Tissue', 'Lung Squamous Cell Carcinoma', 
            'Chronic Lymphocytic Leukemia', 'Follicular Lymphoma', 'Mantle Cell Lymphoma', 
            'Oral Normal', 'Oral Squamous Cell Carcinoma'];

        // Get the top prediction
        const predictedClassIndex = predictions.indexOf(Math.max(...predictions));
        const result = `Prediction: ${classNames[predictedClassIndex]} (Confidence: ${(Math.max(...predictions) * 100).toFixed(1)}%)`;
        resultDiv.innerText = result;

        // Get top 3 predictions
        const sortedPredictions = predictions.slice().sort((a, b) => b - a);
        top3Results = sortedPredictions.slice(0, 3).map(prediction => {
            const index = predictions.indexOf(prediction);
            return `${classNames[index]} (Confidence: ${(prediction * 100).toFixed(1)}%)`;
        });
        console.log('Top 3 Predictions:', top3Results);

        // Enable "Download Result" button
        downloadPdfButton.style.display = 'inline-block';
        downloadPdfButton.disabled = false;
    } catch (error) {
        console.error('Error making prediction:', error);
        resultDiv.innerText = 'Error making prediction. Try again.';
        predictButton.disabled = false;
    }
}

// Image Manipulation Functions
zoomInButton.addEventListener('click', () => {
    scale += 0.1;
    uploadedImage.style.transform = `scale(${scale}) rotate(${rotate}deg)`;
});

zoomOutButton.addEventListener('click', () => {
    if (scale > 0.1) scale -= 0.1;
    uploadedImage.style.transform = `scale(${scale}) rotate(${rotate}deg)`;
});

rotateLeftButton.addEventListener('click', () => {
    rotate -= 90;
    uploadedImage.style.transform = `scale(${scale}) rotate(${rotate}deg)`;
});

rotateRightButton.addEventListener('click', () => {
    rotate += 90;
    uploadedImage.style.transform = `scale(${scale}) rotate(${rotate}deg)`;
});

// Show form and collect demographics
downloadPdfButton.addEventListener('click', () => {
    document.getElementById('demographics-form').style.display = 'block';
});

// Generate PDF after filling out the form
document.getElementById('generate-pdf').addEventListener('click', () => {
    generatePDF(resultDiv.innerText, top3Results, uploadedImage.src);
});

function generatePDF(mainPrediction, top3Predictions, imageUrl) {
    const name = document.getElementById('name').value;
    const patient_id = document.getElementById('patient_id').value;
    const age = document.getElementById('age').value;
    const gender = document.getElementById('gender').value;

    // Validate form data
    if (!name || !patient_id || !age || !gender) {
        alert('Please fill out all demographic fields.');
        return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    // Add demographics and results
    doc.setFontSize(16);
    doc.text("Multi-Cancer Classification Result", 10, 10);
    
    doc.setFontSize(12);
    let y = 20; // Start y-position for demographic details

    doc.text(`Patient Name: ${name}`, 10, y);
    y += 10; // Adjust spacing for the next line
    doc.text(`Patient ID: ${patient_id}`, 10, y);
    y += 10;
    doc.text(`Age: ${age}`, 10, y);
    y += 10;
    doc.text(`Gender: ${gender}`, 10, y);
    y += 10;
    doc.text(`Main Prediction: ${mainPrediction}`, 10, y);
    y += 10;
    doc.text("Top 3 Predictions:", 10, y);

    // Add top predictions list
    top3Predictions.forEach((prediction, index) => {
        y += 10;
        doc.text(`${index + 1}. ${prediction}`, 10, y);
    });

    // Add uploaded image to PDF
    doc.addImage(imageUrl, 'JPEG', 10, y + 20, 180, 120);

    // Save the PDF
    doc.save('multi-cancer-prediction-result.pdf');

    // Hide the form after generating PDF
    document.getElementById('demographics-form').style.display = 'none';
}



