export interface ImageProcessOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  outputType?: string;
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error('Unable to load image'));
      image.src = String(reader.result);
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function getTargetSize(image: HTMLImageElement, maxWidth: number, maxHeight: number) {
  const ratio = Math.min(maxWidth / image.width, maxHeight / image.height, 1);
  return {
    width: Math.round(image.width * ratio),
    height: Math.round(image.height * ratio),
  };
}

export async function processImage(
  file: File,
  options: ImageProcessOptions = { maxWidth: 1920, maxHeight: 1080, quality: 0.85 }
): Promise<File> {
  if (!file.type.startsWith('image/')) return file;

  const maxWidth = options.maxWidth ?? 1920;
  const maxHeight = options.maxHeight ?? 1080;
  const quality = options.quality ?? 0.85;
  const outputType = options.outputType ?? file.type;

  const image = await loadImage(file);
  const { width, height } = getTargetSize(image, maxWidth, maxHeight);

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');
  if (!context) return file;

  context.drawImage(image, 0, 0, width, height);

  const blob: Blob | null = await new Promise((resolve) =>
    canvas.toBlob(
      (result) => resolve(result),
      outputType,
      quality
    )
  );

  if (!blob) return file;
  return new File([blob], file.name, { type: outputType });
}
