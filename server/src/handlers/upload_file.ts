import { db } from '../db';
import { uploadedFilesTable } from '../db/schema';
import { type UploadFileInput, type UploadedFile } from '../schema';

export const uploadFile = async (input: UploadFileInput): Promise<UploadedFile> => {
  try {
    // Insert file record into database
    const result = await db.insert(uploadedFilesTable)
      .values({
        filename: input.filename,
        original_name: input.original_name,
        file_path: input.file_path,
        file_size: input.file_size,
        mime_type: input.mime_type,
        public_link: input.public_link
      })
      .returning()
      .execute();

    // Return the uploaded file record
    const uploadedFile = result[0];
    return uploadedFile;
  } catch (error) {
    console.error('File upload failed:', error);
    throw error;
  }
};