import { db } from '../db';
import { uploadedFilesTable } from '../db/schema';
import { type FileStats } from '../schema';
import { count, sum } from 'drizzle-orm';

export const getFileStats = async (): Promise<FileStats> => {
  try {
    // Query to get both count and sum of file sizes in a single query
    const result = await db.select({
      total_files: count(uploadedFilesTable.id),
      total_size: sum(uploadedFilesTable.file_size)
    })
    .from(uploadedFilesTable)
    .execute();

    const stats = result[0];
    
    return {
      total_files: stats.total_files,
      total_size: stats.total_size ? parseInt(stats.total_size) : 0
    };
  } catch (error) {
    console.error('File stats query failed:', error);
    throw error;
  }
};