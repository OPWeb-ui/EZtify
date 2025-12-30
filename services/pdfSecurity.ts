
import { PDFDocument } from 'pdf-lib';

/**
 * Checks if a PDF file is encrypted (password protected).
 */
export const isPdfEncrypted = async (file: File): Promise<boolean> => {
    try {
        const arrayBuffer = await file.arrayBuffer();
        // Attempt to load without password. If it throws 'PasswordRequired', it is encrypted.
        // pdf-lib's isEncrypted property is reliable after load.
        const doc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
        return doc.isEncrypted;
    } catch (e) {
        // If loading fails entirely, it is likely encrypted or corrupt
        return true;
    }
};

/**
 * Unlocks a password-protected PDF.
 */
export const unlockPdf = async (
    file: File, 
    password: string,
    onProgress?: (percent: number) => void,
    onStatusUpdate?: (status: string) => void
): Promise<Blob> => {
    try {
        onStatusUpdate?.('Reading document...');
        onProgress?.(20);
        const arrayBuffer = await file.arrayBuffer();
        
        onStatusUpdate?.('Decrypting content...');
        onProgress?.(50);
        
        // Load with password
        const doc = await PDFDocument.load(arrayBuffer, { password });
        
        onStatusUpdate?.('Saving unlocked file...');
        onProgress?.(80);
        
        // Saving a loaded document removes encryption by default unless encrypt() is explicitly called
        const decryptedBytes = await doc.save();
        
        onProgress?.(100);
        return new Blob([decryptedBytes], { type: 'application/pdf' });
    } catch (e: any) {
        console.error("Unlock failed:", e);
        throw new Error("Incorrect password or extraction failed.");
    }
};
