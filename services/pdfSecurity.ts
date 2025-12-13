
import { PDFDocument } from 'pdf-lib';

export const isPdfEncrypted = async (file: File): Promise<boolean> => {
    try {
        const arrayBuffer = await file.arrayBuffer();
        const doc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
        return doc.isEncrypted;
    } catch (e) {
        // If it throws, it might be corrupt or encrypted in a way pdf-lib can't just 'ignore' easily without erroring on parse
        return false;
    }
};

export const unlockPdf = async (file: File, password: string): Promise<Blob> => {
    try {
        const arrayBuffer = await file.arrayBuffer();
        // Load with the provided password
        const doc = await PDFDocument.load(arrayBuffer, { password });
        
        // Saving automatically removes encryption unless .encrypt() is called again
        const decryptedBytes = await doc.save();
        return new Blob([decryptedBytes], { type: 'application/pdf' });
    } catch (e: any) {
        console.error("Unlock failed:", e);
        throw new Error("Incorrect password or failed to decrypt.");
    }
};
