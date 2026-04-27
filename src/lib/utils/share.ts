import { strToU8, strFromU8, zlibSync, unzlibSync } from 'fflate';

/**
 * Safely compresses and encodes any JSON-compatible object into a URL-friendly Base64 string.
 */
export function encodeData(data: any): string {
    try {
        const jsonStr = JSON.stringify(data);

        // Convert string to Uint8Array and compress
        const buf = strToU8(jsonStr);
        const compressed = zlibSync(buf, { level: 9 }); // Maximum compression

        // Safely convert Uint8Array to binary string (avoids call stack limits on huge arrays)
        let binString = '';
        for (let i = 0; i < compressed.length; i++) {
            binString += String.fromCharCode(compressed[i]);
        }

        // Base64URL encode for clean, URL-safe strings (no need for encodeURIComponent)
        return btoa(binString)
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=+$/, '');

    } catch (e) {
        console.error("Failed to encode data:", e);
        throw new Error("Could not compress and encode data for sharing.");
    }
}

/**
 * Decodes a Base64 string, extracts it from a full URL, handles
 * both compressed and legacy uncompressed payloads, and parses it.
 */
export function decodeData(encoded: string): any {
    let base64Str = encoded.trim();

    try {
        // Smart URL parameter extraction
        if (base64Str.includes('import=')) {
            // Append a dummy HTTPS origin if it's a relative path so the URL constructor doesn't panic
            const urlString = base64Str.startsWith('http') ? base64Str : `https://dummy.com/${base64Str.replace(/^\/?/, '')}`;
            const url = new URL(urlString);
            const importParam = url.searchParams.get('import');
            if (importParam) {
                base64Str = importParam;
            }
        }

        // Normalize Base64URL back to Standard Base64
        let normalizedBase64 = base64Str.replace(/-/g, '+').replace(/_/g, '/');
        while (normalizedBase64.length % 4) {
            normalizedBase64 += '=';
        }

        // Attempt 1: Decompress and Parse (New Format)
        try {
            const binString = atob(normalizedBase64);
            const bytes = new Uint8Array(binString.length);
            for (let i = 0; i < binString.length; i++) {
                bytes[i] = binString.charCodeAt(i);
            }

            const decompressed = unzlibSync(bytes);
            const jsonStr = strFromU8(decompressed);
            return JSON.parse(jsonStr);

        } catch (err) {
            // Attempt 2: Legacy Uncompressed Fallback (Old Format)
            console.warn("Decompression failed, attempting legacy uncompressed decode...");
            const legacyStr = decodeURIComponent(atob(base64Str));
            return JSON.parse(legacyStr);
        }

    } catch (e) {
        console.error("Decode error:", e);
        throw new Error("Invalid base64 string or URL.");
    }
}