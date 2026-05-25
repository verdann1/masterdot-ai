import { Camera, CameraResultType, CameraSource } from "@capacitor/camera";

export async function captureEvidence() {
  const image = await Camera.getPhoto({
    quality: 70,
    allowEditing: false,
    resultType: CameraResultType.DataUrl,
    source: CameraSource.Prompt,
  });

  return {
    id: Date.now(),
    date: new Date().toLocaleString("pt-BR"),
    type: "image",
    dataUrl: image.dataUrl,
  };
}