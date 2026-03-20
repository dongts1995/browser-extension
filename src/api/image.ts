export async function compressAndEncodeImage(
    url: string,
    quality = 0.85,
    maxWidth = 512
): Promise<string> {
    const res = await fetch(url);
    const blob = await res.blob();
    const bitmap = await createImageBitmap(blob);

    const scale = maxWidth / bitmap.width;
    const width = maxWidth;
    const height = bitmap.height * scale;

    const canvas = new OffscreenCanvas(width, height);
    const ctx = canvas.getContext("2d");

    ctx?.drawImage(bitmap, 0, 0, width, height);

    const compressedBlob = await canvas.convertToBlob({
        type: "image/jpeg",
        quality,
    });

    const base64 = await blobToBase64(compressedBlob);
    return `data:image/jpeg;base64,${base64}`;
}

function blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            resolve((reader.result as string).split(",")[1]);
        };
        reader.readAsDataURL(blob);
    });
}
