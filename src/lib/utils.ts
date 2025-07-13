export async function readStream(
    stream: ReadableStream<string>,
    onChunk?: (chunk: string) => void
): Promise<string> {
    const reader = stream.getReader();
    let fullResponse = "";

    // eslint-disable-next-line no-constant-condition
    while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        fullResponse += value;
        if (onChunk) {
            onChunk(fullResponse);
        }
    }

    return fullResponse;
}

export function fileToDataURL(file: File): Promise<{ mediaType: string, data: string }> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            if (typeof reader.result !== 'string') {
                return reject(new Error('File could not be read as a data URL'));
            }
            const [, data] = reader.result.split(',');
            const mediaType = reader.result.split(';')[0].split(':')[1];
            resolve({ mediaType, data });
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

export function formatDate(date: Date) {
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

    const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
    if (diffDays >= -6) {
        return rtf.format(diffDays, "day");
    }

    return new Intl.DateTimeFormat("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
    }).format(date);
}

export function deepEqual(obj1: any, obj2: any): boolean {
    if (obj1 === obj2) return true;

    if (obj1 && typeof obj1 === 'object' && obj2 && typeof obj2 === 'object') {
        if (Object.keys(obj1).length !== Object.keys(obj2).length) return false;

        for (const key in obj1) {
            if (Object.prototype.hasOwnProperty.call(obj1, key)) {
                if (!Object.prototype.hasOwnProperty.call(obj2, key)) return false;
                if (!deepEqual(obj1[key], obj2[key])) return false;
            }
        }
        return true;
    }
    return false;
}
