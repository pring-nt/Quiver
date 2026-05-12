import { strToU8, strFromU8, zlibSync, unzlibSync } from 'fflate';

const KEY_MAP: Record<string, string> = {
    courses: 'c', groups: 'g', sections: 's', slots: 'sl',
    courseCode: 'cc', groupId: 'gi', sectionIds: 'si', pickCount: 'pc',
    section: 'sc', professor: 'p', modality: 'm', remarks: 'r',
    day: 'd', startTime: 'st', endTime: 'et', room: 'rm', isOnline: 'o',
    id: 'i', name: 'n'
};

const KEY_UNMAP = Object.fromEntries(Object.entries(KEY_MAP).map(([k, v]) => [v, k]));

function minify(obj: any): any {
    if (Array.isArray(obj)) return obj.map(minify);
    if (obj && typeof obj === 'object') {
        return Object.fromEntries(
            Object.entries(obj)
                .filter(([, v]) =>
                        v !== '' &&
                        !(Array.isArray(v) && v.length === 0)
                )
                .map(([k, v]) => [KEY_MAP[k] ?? k, minify(v)])
        );
    }
    return obj;
}

function unminify(obj: any): any {
    if (Array.isArray(obj)) return obj.map(unminify);
    if (obj && typeof obj === 'object') {
        return Object.fromEntries(
            Object.entries(obj).map(([k, v]) => [KEY_UNMAP[k] ?? k, unminify(v)])
        );
    }
    return obj;
}

export function encodeData(data: any): string {
    try {
        const jsonStr = JSON.stringify(minify(data));
        const compressed = zlibSync(strToU8(jsonStr), { level: 9 });
        const binString = Array.from(compressed, c => String.fromCharCode(c)).join('');
        return btoa(binString)
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=+$/, '');
    } catch (e) {
        console.error("Failed to encode data:", e);
        throw new Error("Could not compress and encode data for sharing.");
    }
}

export function decodeData(encoded: string): any {
    let base64Str = encoded.trim();

    try {
        if (base64Str.includes('import=')) {
            const urlString = base64Str.startsWith('http') ? base64Str : `https://dummy.com/${base64Str.replace(/^\/?/, '')}`;
            const url = new URL(urlString);
            const importParam = url.searchParams.get('import');
            if (importParam) base64Str = importParam;
        }

        let normalizedBase64 = base64Str.replace(/-/g, '+').replace(/_/g, '/');
        while (normalizedBase64.length % 4) normalizedBase64 += '=';

        const binString = atob(normalizedBase64);
        const bytes = new Uint8Array(binString.length);
        for (let i = 0; i < binString.length; i++) bytes[i] = binString.charCodeAt(i);

        return unminify(JSON.parse(strFromU8(unzlibSync(bytes))));
    } catch (e) {
        console.error("Decode error:", e);
        throw new Error("Invalid base64 string or URL.");
    }
}

export function generateShareUrl(data: any): string {
    const encoded = encodeData(data);
    const url = new URL(window.location.origin);
    url.searchParams.set('import', encoded);
    return url.toString();
}