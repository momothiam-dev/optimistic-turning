// src/main.js
// UpscalerJS implementation – loads model from CDN, no tf import needed.

// ---------------------------------------------------------------------------
// UI Elements
// ---------------------------------------------------------------------------
const fileInput = document.getElementById('file-input');
const uploadSection = document.getElementById('upload-section');
const resultSection = document.getElementById('result-section');
const resultCanvas = document.getElementById('result-canvas');
const downloadBtn = document.getElementById('download-btn');

// ---------------------------------------------------------------------------
// UpscalerJS loader (CDN version)
// ---------------------------------------------------------------------------
let upscaler = null;
async function loadUpscaler() {
  if (!upscaler) {
    console.log('Loading UpscalerJS Real‑ESRGAN model…');
    // `Upscaler` is provided by the script tag added to index.html.
    upscaler = new Upscaler({
      model: 'esrgan-legacy', // 4× upscaler, FP16, works on WebGL/WebGPU
      scale: 4,
    });
    await upscaler.ready;
  }
  return upscaler;
}

// ---------------------------------------------------------------------------
// Core upscaling flow using UpscalerJS
// ---------------------------------------------------------------------------
async function upscaleImage(file) {
  const up = await loadUpscaler();
  // UpscalerJS handles image decoding, tiling and conversion internally.
  const upscaledCanvas = await up.upscale(file);
  // Draw the result onto the existing result canvas.
  const ctx = resultCanvas.getContext('2d');
  resultCanvas.width = upscaledCanvas.width;
  resultCanvas.height = upscaledCanvas.height;
  ctx.drawImage(upscaledCanvas, 0, 0);
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
