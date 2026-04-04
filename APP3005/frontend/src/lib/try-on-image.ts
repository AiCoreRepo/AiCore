export function normalizeTryOnImageData(
  imageData: string | null | undefined,
  fallbackMimeType = "image/jpeg",
): string | null {
  if (!imageData || !imageData.trim()) {
    return null;
  }

  return imageData.startsWith("data:")
    ? imageData
    : `data:${fallbackMimeType};base64,${imageData}`;
}
