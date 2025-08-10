import { db } from '../db';
import { uploadedFilesTable } from '../db/schema';
import { type GetFileByLinkInput, type UploadedFile } from '../schema';
import { eq } from 'drizzle-orm';

export const getFileByLink = async (input: GetFileByLinkInput): Promise<UploadedFile | null> => {
  try {
    // Query the database for a file with the given public link
    const results = await db.select()
      .from(uploadedFilesTable)
      .where(eq(uploadedFilesTable.public_link, input.public_link))
      .limit(1)
      .execute();

    // Return the file if found, otherwise null
    if (results.length === 0) {
      return null;
    }

    const file = results[0];
    return {
      ...file,
      // No numeric conversions needed - all fields are either strings, integers, or dates
      // uploaded_at is already a Date object from the database
    };
  } catch (error) {
    console.error('Failed to retrieve file by public link:', error);
    throw error;
  }
};