import { saveAs } from "file-saver";

export default function downloadImage(
  imageData: ImageData,
  filename: string = "image"
) {
  const canvas = document.createElement("canvas");
  canvas.width = imageData.width;
  canvas.height = imageData.height;
  const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;
  ctx.putImageData(imageData, 0, 0);
  canvas.toBlob((blob) => saveAs(blob as Blob, filename + ".png"));
}
