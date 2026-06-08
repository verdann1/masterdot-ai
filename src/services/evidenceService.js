import { Camera, CameraResultType, CameraSource } from "@capacitor/camera";

export async function captureEvidence() {
  const photo = await Camera.getPhoto({
    quality: 70,
    allowEditing: false,
    resultType: CameraResultType.DataUrl,
    source: CameraSource.Prompt,
  });

  if (!photo?.dataUrl) return null;

  return {
    id: Date.now(),
    type: "image",
    date: new Date().toLocaleString("pt-BR"),
    dataUrl: photo.dataUrl,
  };
}