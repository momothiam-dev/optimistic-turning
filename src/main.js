// src/main.js
import * as tf from '@tensorflow/tfjs';

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------
// URL du modèle TF.js (à placer dans le dossier public/model/)
const MODEL_URL = '/model/4x/model.json';

// ---------------------------------------------------------------------------
// UI Elements
// ---------------------------------------------------------------------------
const fileInput = document.getElementById('file-input');
const uploadSection = document.getElementById('upload-section');
const resultSection = document.getElementById('result-section');
const resultCanvas = document.getElementById('result-canvas');
const downloadBtn = document.getElementById('download-btn');

// ---------------------------------------------------------------------------
// Load model (cached after first call)
// ---------------------------------------------------------------------------
let modelPromise = null;
function loadModel() {
  if (!modelPromise) {
    console.log('Loading upscaling model…');
    modelPromise = tf.loadGraphModel(MODEL_URL);
  }
  return modelPromise;
}

// ---------------------------------------------------------------------------
// Helpers – image ↔ tensor
// ---------------------------------------------------------------------------
function imageToTensor(img) {
  const tensor = tf.browser.fromPixels(img).toFloat().div(tf.scalar(255));
  return tensor.expandDims(0); // shape [1, h, w, 3]
}

async function tensorToCanvas(tensor) {
  const [batch, h, w, c] = tensor.shape;
  const imgTensor = tensor.squeeze().mul(tf.scalar(255)).clipByValue(0, 255).cast('int32');
  const data = await imgTensor.data();
  const imageData = new ImageData(w, h);
  for (let i = 0; i < data.length; i++) {
    imageData.data[i] = data[i];
  }
  const ctx = resultCanvas.getContext('2d');
  resultCanvas.width = w;
  resultCanvas.height = h;
  ctx.putImageData(imageData, 0, 0);
}

// ---------------------------------------------------------------------------
// Core upscaling flow
// ---------------------------------------------------------------------------
async function upscaleImage(file) {
  const model = await loadModel();

  const img = new Image();
  const url = URL.createObjectURL(file);
  img.src = url;
  await img.decode();
  URL.revokeObjectURL(url);

  const inputTensor = imageToTensor(img);
  // model.executeAsync returns a tensor (or array of tensors)
  const outputTensor = await model.executeAsync(inputTensor);

  await tensorToCanvas(outputTensor);
  resultSection.classList.remove('hidden');

  downloadBtn.onclick = () => {
    resultCanvas.toBlob((blob) => {
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `upscaled_${file.name}`;
      link.click();
      URL.revokeObjectURL(link.href);
    }, 'image/png');
  };
}

// ---------------------------------------------------------------------------
// UI interactions
// ---------------------------------------------------------------------------
uploadSection.addEventListener('click', () => fileInput.click());

fileInput.addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  try {
    await upscaleImage(file);
  } catch (err) {
    console.error(err);
    alert('Erreur pendant le traitement de l\'image. Consultez la console pour plus de détails.');
  }
});
