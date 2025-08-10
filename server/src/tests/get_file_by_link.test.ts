import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { uploadedFilesTable } from '../db/schema';
import { type GetFileByLinkInput, type UploadFileInput } from '../schema';
import { getFileByLink } from '../handlers/get_file_by_link';

// Test data for creating files
const testFileData: UploadFileInput = {
  filename: 'test-image-123.jpg',
  original_name: 'vacation-photo.jpg',
  file_path: '/uploads/test-image-123.jpg',
  file_size: 1024 * 1024, // 1MB
  mime_type: 'image/jpeg',
  public_link: 'abc123-unique-link'
};

const anotherTestFile: UploadFileInput = {
  filename: 'video-file-456.mp4',
  original_name: 'birthday-video.mp4',
  file_path: '/uploads/video-file-456.mp4',
  file_size: 50 * 1024 * 1024, // 50MB
  mime_type: 'video/mp4',
  public_link: 'def456-another-link'
};

describe('getFileByLink', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return file when public link exists', async () => {
    // Create a test file in the database
    const insertResult = await db.insert(uploadedFilesTable)
      .values({
        filename: testFileData.filename,
        original_name: testFileData.original_name,
        file_path: testFileData.file_path,
        file_size: testFileData.file_size,
        mime_type: testFileData.mime_type,
        public_link: testFileData.public_link
      })
      .returning()
      .execute();

    const createdFile = insertResult[0];

    // Test retrieving the file by public link
    const input: GetFileByLinkInput = {
      public_link: testFileData.public_link
    };

    const result = await getFileByLink(input);

    // Verify the file was found and returned correctly
    expect(result).not.toBeNull();
    expect(result!.id).toEqual(createdFile.id);
    expect(result!.filename).toEqual('test-image-123.jpg');
    expect(result!.original_name).toEqual('vacation-photo.jpg');
    expect(result!.file_path).toEqual('/uploads/test-image-123.jpg');
    expect(result!.file_size).toEqual(1024 * 1024);
    expect(result!.mime_type).toEqual('image/jpeg');
    expect(result!.public_link).toEqual('abc123-unique-link');
    expect(result!.uploaded_at).toBeInstanceOf(Date);
  });

  it('should return null when public link does not exist', async () => {
    const input: GetFileByLinkInput = {
      public_link: 'non-existent-link'
    };

    const result = await getFileByLink(input);

    expect(result).toBeNull();
  });

  it('should return correct file when multiple files exist', async () => {
    // Create multiple test files
    await db.insert(uploadedFilesTable)
      .values([
        {
          filename: testFileData.filename,
          original_name: testFileData.original_name,
          file_path: testFileData.file_path,
          file_size: testFileData.file_size,
          mime_type: testFileData.mime_type,
          public_link: testFileData.public_link
        },
        {
          filename: anotherTestFile.filename,
          original_name: anotherTestFile.original_name,
          file_path: anotherTestFile.file_path,
          file_size: anotherTestFile.file_size,
          mime_type: anotherTestFile.mime_type,
          public_link: anotherTestFile.public_link
        }
      ])
      .execute();

    // Test retrieving the second file by its public link
    const input: GetFileByLinkInput = {
      public_link: anotherTestFile.public_link
    };

    const result = await getFileByLink(input);

    // Verify we got the correct file (the video file, not the image)
    expect(result).not.toBeNull();
    expect(result!.filename).toEqual('video-file-456.mp4');
    expect(result!.original_name).toEqual('birthday-video.mp4');
    expect(result!.mime_type).toEqual('video/mp4');
    expect(result!.file_size).toEqual(50 * 1024 * 1024);
    expect(result!.public_link).toEqual('def456-another-link');
  });

  it('should handle empty string public link', async () => {
    const input: GetFileByLinkInput = {
      public_link: ''
    };

    const result = await getFileByLink(input);

    expect(result).toBeNull();
  });

  it('should handle case sensitivity in public links', async () => {
    // Create a test file with a specific case public link
    await db.insert(uploadedFilesTable)
      .values({
        filename: testFileData.filename,
        original_name: testFileData.original_name,
        file_path: testFileData.file_path,
        file_size: testFileData.file_size,
        mime_type: testFileData.mime_type,
        public_link: 'CaseSensitive-Link-123'
      })
      .execute();

    // Test with exact case - should find the file
    const exactCaseInput: GetFileByLinkInput = {
      public_link: 'CaseSensitive-Link-123'
    };

    const exactResult = await getFileByLink(exactCaseInput);
    expect(exactResult).not.toBeNull();
    expect(exactResult!.public_link).toEqual('CaseSensitive-Link-123');

    // Test with different case - should not find the file
    const differentCaseInput: GetFileByLinkInput = {
      public_link: 'casesensitive-link-123'
    };

    const differentCaseResult = await getFileByLink(differentCaseInput);
    expect(differentCaseResult).toBeNull();
  });
});