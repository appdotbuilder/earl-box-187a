import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { uploadedFilesTable } from '../db/schema';
import { type UploadFileInput } from '../schema';
import { uploadFile } from '../handlers/upload_file';
import { eq } from 'drizzle-orm';

// Test input for a sample image file
const testImageInput: UploadFileInput = {
  filename: 'test-image-123.jpg',
  original_name: 'my-photo.jpg',
  file_path: '/uploads/test-image-123.jpg',
  file_size: 2048576, // 2MB
  mime_type: 'image/jpeg',
  public_link: 'https://example.com/files/abc123def456'
};

// Test input for a sample video file
const testVideoInput: UploadFileInput = {
  filename: 'test-video-456.mp4',
  original_name: 'my-video.mp4',
  file_path: '/uploads/test-video-456.mp4',
  file_size: 10485760, // 10MB
  mime_type: 'video/mp4',
  public_link: 'https://example.com/files/xyz789abc123'
};

describe('uploadFile', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should upload an image file', async () => {
    const result = await uploadFile(testImageInput);

    // Basic field validation
    expect(result.filename).toEqual('test-image-123.jpg');
    expect(result.original_name).toEqual('my-photo.jpg');
    expect(result.file_path).toEqual('/uploads/test-image-123.jpg');
    expect(result.file_size).toEqual(2048576);
    expect(result.mime_type).toEqual('image/jpeg');
    expect(result.public_link).toEqual('https://example.com/files/abc123def456');
    expect(result.id).toBeDefined();
    expect(result.uploaded_at).toBeInstanceOf(Date);
  });

  it('should upload a video file', async () => {
    const result = await uploadFile(testVideoInput);

    // Basic field validation
    expect(result.filename).toEqual('test-video-456.mp4');
    expect(result.original_name).toEqual('my-video.mp4');
    expect(result.file_path).toEqual('/uploads/test-video-456.mp4');
    expect(result.file_size).toEqual(10485760);
    expect(result.mime_type).toEqual('video/mp4');
    expect(result.public_link).toEqual('https://example.com/files/xyz789abc123');
    expect(result.id).toBeDefined();
    expect(result.uploaded_at).toBeInstanceOf(Date);
  });

  it('should save file to database', async () => {
    const result = await uploadFile(testImageInput);

    // Query the database to verify file was saved
    const files = await db.select()
      .from(uploadedFilesTable)
      .where(eq(uploadedFilesTable.id, result.id))
      .execute();

    expect(files).toHaveLength(1);
    expect(files[0].filename).toEqual('test-image-123.jpg');
    expect(files[0].original_name).toEqual('my-photo.jpg');
    expect(files[0].file_path).toEqual('/uploads/test-image-123.jpg');
    expect(files[0].file_size).toEqual(2048576);
    expect(files[0].mime_type).toEqual('image/jpeg');
    expect(files[0].public_link).toEqual('https://example.com/files/abc123def456');
    expect(files[0].uploaded_at).toBeInstanceOf(Date);
  });

  it('should handle large file sizes within limit', async () => {
    const largeFileInput: UploadFileInput = {
      filename: 'large-video-789.mov',
      original_name: 'large-video.mov',
      file_path: '/uploads/large-video-789.mov',
      file_size: 199 * 1024 * 1024, // 199MB (within 200MB limit)
      mime_type: 'video/quicktime',
      public_link: 'https://example.com/files/large123'
    };

    const result = await uploadFile(largeFileInput);

    expect(result.file_size).toEqual(199 * 1024 * 1024);
    expect(result.mime_type).toEqual('video/quicktime');
    expect(result.id).toBeDefined();
  });

  it('should enforce unique public links', async () => {
    // Upload first file
    await uploadFile(testImageInput);

    // Try to upload another file with the same public link
    const duplicateInput: UploadFileInput = {
      filename: 'different-file.png',
      original_name: 'different.png',
      file_path: '/uploads/different-file.png',
      file_size: 1024,
      mime_type: 'image/png',
      public_link: testImageInput.public_link // Same public link
    };

    // Should throw error due to unique constraint
    await expect(uploadFile(duplicateInput)).rejects.toThrow(/unique/i);
  });

  it('should handle multiple file uploads with different links', async () => {
    // Upload multiple files
    const result1 = await uploadFile(testImageInput);
    const result2 = await uploadFile(testVideoInput);

    // Verify both files exist in database
    const allFiles = await db.select()
      .from(uploadedFilesTable)
      .execute();

    expect(allFiles).toHaveLength(2);
    
    // Check that IDs are different
    expect(result1.id).not.toEqual(result2.id);
    
    // Check that public links are different
    expect(result1.public_link).not.toEqual(result2.public_link);
    
    // Verify file content
    const file1 = allFiles.find(f => f.id === result1.id);
    const file2 = allFiles.find(f => f.id === result2.id);
    
    expect(file1?.mime_type).toEqual('image/jpeg');
    expect(file2?.mime_type).toEqual('video/mp4');
  });

  it('should preserve upload timestamps correctly', async () => {
    const beforeUpload = new Date();
    const result = await uploadFile(testImageInput);
    const afterUpload = new Date();

    // Verify timestamp is within reasonable range
    expect(result.uploaded_at >= beforeUpload).toBe(true);
    expect(result.uploaded_at <= afterUpload).toBe(true);

    // Query database to verify timestamp persistence
    const files = await db.select()
      .from(uploadedFilesTable)
      .where(eq(uploadedFilesTable.id, result.id))
      .execute();

    expect(files[0].uploaded_at).toBeInstanceOf(Date);
    expect(files[0].uploaded_at.getTime()).toEqual(result.uploaded_at.getTime());
  });
});