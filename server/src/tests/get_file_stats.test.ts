import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { uploadedFilesTable } from '../db/schema';
import { getFileStats } from '../handlers/get_file_stats';

describe('getFileStats', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return zero stats when no files exist', async () => {
    const result = await getFileStats();

    expect(result.total_files).toEqual(0);
    expect(result.total_size).toEqual(0);
  });

  it('should return correct stats for single file', async () => {
    // Create a test file record
    await db.insert(uploadedFilesTable)
      .values({
        filename: 'test-image.jpg',
        original_name: 'my-photo.jpg',
        file_path: '/uploads/test-image.jpg',
        file_size: 1024000, // 1MB
        mime_type: 'image/jpeg',
        public_link: 'https://example.com/files/test-123'
      })
      .execute();

    const result = await getFileStats();

    expect(result.total_files).toEqual(1);
    expect(result.total_size).toEqual(1024000);
  });

  it('should return correct stats for multiple files', async () => {
    // Create multiple test file records with different sizes
    const testFiles = [
      {
        filename: 'image1.jpg',
        original_name: 'photo1.jpg',
        file_path: '/uploads/image1.jpg',
        file_size: 500000, // 500KB
        mime_type: 'image/jpeg',
        public_link: 'https://example.com/files/img1-123'
      },
      {
        filename: 'video1.mp4',
        original_name: 'vacation.mp4',
        file_path: '/uploads/video1.mp4',
        file_size: 5000000, // 5MB
        mime_type: 'video/mp4',
        public_link: 'https://example.com/files/vid1-456'
      },
      {
        filename: 'image2.png',
        original_name: 'screenshot.png',
        file_path: '/uploads/image2.png',
        file_size: 2500000, // 2.5MB
        mime_type: 'image/png',
        public_link: 'https://example.com/files/img2-789'
      }
    ];

    for (const file of testFiles) {
      await db.insert(uploadedFilesTable)
        .values(file)
        .execute();
    }

    const result = await getFileStats();

    expect(result.total_files).toEqual(3);
    expect(result.total_size).toEqual(8000000); // 500KB + 5MB + 2.5MB = 8MB
  });

  it('should handle large file counts correctly', async () => {
    // Create many small files to test count aggregation
    const fileCount = 50;
    const fileSize = 10000; // 10KB each

    const files = Array.from({ length: fileCount }, (_, i) => ({
      filename: `file${i}.jpg`,
      original_name: `original${i}.jpg`,
      file_path: `/uploads/file${i}.jpg`,
      file_size: fileSize,
      mime_type: 'image/jpeg',
      public_link: `https://example.com/files/file${i}-${Math.random().toString(36).substr(2, 9)}`
    }));

    // Insert all files in batches
    const batchSize = 10;
    for (let i = 0; i < files.length; i += batchSize) {
      const batch = files.slice(i, i + batchSize);
      await db.insert(uploadedFilesTable)
        .values(batch)
        .execute();
    }

    const result = await getFileStats();

    expect(result.total_files).toEqual(fileCount);
    expect(result.total_size).toEqual(fileCount * fileSize); // 50 * 10KB = 500KB
  });

  it('should handle files with zero size', async () => {
    // Test edge case with zero-sized files
    await db.insert(uploadedFilesTable)
      .values([
        {
          filename: 'empty.txt',
          original_name: 'empty.txt',
          file_path: '/uploads/empty.txt',
          file_size: 0, // Zero size
          mime_type: 'image/jpeg', // Still valid MIME type
          public_link: 'https://example.com/files/empty-123'
        },
        {
          filename: 'normal.jpg',
          original_name: 'normal.jpg',
          file_path: '/uploads/normal.jpg',
          file_size: 1000,
          mime_type: 'image/jpeg',
          public_link: 'https://example.com/files/normal-456'
        }
      ])
      .execute();

    const result = await getFileStats();

    expect(result.total_files).toEqual(2);
    expect(result.total_size).toEqual(1000); // Only the non-zero file contributes to size
  });
});