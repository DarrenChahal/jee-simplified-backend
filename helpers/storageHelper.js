import { Storage } from '@google-cloud/storage';
import path from 'path';
import config from '../config/prod.js'; // Using prod config for bucket name

// Initialize storage client
const storage = new Storage({
    projectId: 'solveiit' 
});

const bucketName = config.gcp?.storage_bucket || 'solveiit-assets';
const bucket = storage.bucket(bucketName);

/**
 * Uploads a file buffer to Google Cloud Storage
 * @param {Buffer} buffer - File buffer
 * @param {string} originalName - Original file name
 * @param {string} mimeType - File mime type
 * @returns {Promise<string>} - Public URL of the uploaded file
 */
export const uploadFileToGCS = (buffer, originalName, mimeType) => {
    return new Promise((resolve, reject) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const extension = path.extname(originalName);
        const fileName = `questions/${uniqueSuffix}${extension}`;
        
        const file = bucket.file(fileName);
        
        const stream = file.createWriteStream({
            metadata: {
                contentType: mimeType,
            },
            resumable: false
        });

        stream.on('error', (err) => {
            console.error('Error uploading to GCS:', err);
            reject(err);
        });

        stream.on('finish', () => {
            // Provide the public URL directly
            const publicUrl = `https://storage.googleapis.com/${bucketName}/${fileName}`;
            resolve(publicUrl);
        });

        stream.end(buffer);
    });
};
