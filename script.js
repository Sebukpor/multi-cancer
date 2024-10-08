let model;
let scale = 1; // For zoom
let rotate = 0; // For rotation

// Load TensorFlow.js with WebGL backend
tf.setBackend('webgl').then(() => {
    console.log('Using WebGL backend');
    loadModel();
});

// Load the TensorFlow.js model
async function loadModel() {
    try {
        model = await tf.loadGraphModel('model/model.json');
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

// Image Upload Event
imageUpload.addEventListener('change', (event) => {
    const file = event.target.files[0];
    const reader = new FileReader();

    reader.onload = function (e) {
        uploadedImage.src = e.target.result; // Set the image source
        uploadedImage.style.display = 'block'; // Show the image
        predictButton.style.display = 'inline-block'; // Show predict button
    };

    if (file) {
        reader.readAsDataURL(file); // Read the image file as a data URL
    }
});

// Predict Function
async function predict() {
    try {
        predictButton.disabled = true; // Disable the button during prediction
        resultDiv.innerText = 'Predicting...';

        // Preprocess image (resize, normalize, expand dimensions)
        const tensorImg = tf.browser.fromPixels(uploadedImage)
            .resizeBilinear([224, 224]) // Resize to model input shape
            .toFloat()
            .div(tf.scalar(255)) // Normalize to [0, 1]
            .expandDims(); // Add batch dimension

        // Make prediction
        const logits = model.predict(tensorImg);
        const predictions = logits.arraySync()[0];

         const classNames = ['Acute Lymphoblastic Leukemia Benign', 'Acute Lymphoblastic Leukemia Early', 'Acute Lymphoblastic Leukemia Pre', 'Acute Lymphoblastic Leukemia Pro', 
                'Brain Glioma', 'Brain Meningioma', 'Brain Tumor', 
                'Breast Benign', 'Breast Malignant', 
                'Cervix Dyskeratotic', 'Cervix Koilocytotic', 'Cervix Metaplastic', 'Cervix Parabasal', 
                'Cervix Superficial Intermediate', 'Colon Adenocarcinoma', 'Colon Benign Tissue', 
                'Kidney Normal', 'Kidney Tumor', 
                'Lung Adenocarcinoma', 'Lung Benign Tissue', 'Lung Squamous Cell Carcinoma', 
                'Chronic Lymphocytic Leukemia', 'Follicular Lymphoma', 'Mantle Cell Lymphoma', 
                'Oral Normal', 'Oral Squamous Cell Carcinoma'];

        const predictedClassIndex = predictions.indexOf(Math.max(...predictions));
        const result = `Prediction: ${classNames[predictedClassIndex]} (Confidence: ${(Math.max(...predictions) * 100).toFixed(1)}%)`;
        resultDiv.innerText = result;

        predictButton.disabled = false; // Enable the button again
    } catch (error) {
        console.error('Error making prediction:', error);
        resultDiv.innerText = 'Error making prediction';
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