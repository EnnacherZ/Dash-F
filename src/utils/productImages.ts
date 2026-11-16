const MAX_DIMENSION = 1600;
const TARGET_BYTES = 650 * 1024;

const loadImage = (file: File): Promise<HTMLImageElement> => new Promise((resolve, reject) => {
  const url = URL.createObjectURL(file);
  const image = new Image();
  image.onload = () => {
    URL.revokeObjectURL(url);
    resolve(image);
  };
  image.onerror = () => {
    URL.revokeObjectURL(url);
    reject(new Error(`Could not read image ${file.name}.`));
  };
  image.src = url;
});

const canvasBlob = (canvas: HTMLCanvasElement, quality: number): Promise<Blob> =>
  new Promise((resolve, reject) => {
    canvas.toBlob(
      blob => blob ? resolve(blob) : reject(new Error('Could not optimize image.')),
      'image/jpeg',
      quality,
    );
  });

/** Keep a five-photo multipart request below common serverless body limits. */
export async function optimizeProductImage(file: File): Promise<File> {
  if (!file.type.startsWith('image/')) throw new Error(`${file.name} is not an image.`);
  if (file.size <= TARGET_BYTES && file.type !== 'image/png') return file;

  const image = await loadImage(file);
  const scale = Math.min(1, MAX_DIMENSION / Math.max(image.naturalWidth, image.naturalHeight));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
  canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Image optimization is unavailable in this browser.');
  context.fillStyle = '#ffffff';
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.drawImage(image, 0, 0, canvas.width, canvas.height);

  let quality = 0.86;
  let blob = await canvasBlob(canvas, quality);
  while (blob.size > TARGET_BYTES && quality > 0.48) {
    quality -= 0.08;
    blob = await canvasBlob(canvas, quality);
  }

  const baseName = file.name.replace(/\.[^.]+$/, '') || 'product';
  return new File([blob], `${baseName}.jpg`, {
    type: 'image/jpeg',
    lastModified: file.lastModified,
  });
}

export const optimizeProductImages = (files: File[]): Promise<File[]> =>
  Promise.all(files.map(optimizeProductImage));
