import { z } from 'zod';

// File upload schema
export const uploadedFileSchema = z.object({
  id: z.number(),
  filename: z.string(),
  original_name: z.string(),
  file_path: z.string(),
  file_size: z.number(),
  mime_type: z.string(),
  public_link: z.string(),
  uploaded_at: z.coerce.date()
});

export type UploadedFile = z.infer<typeof uploadedFileSchema>;

// Input schema for file upload
export const uploadFileInputSchema = z.object({
  filename: z.string(),
  original_name: z.string(),
  file_path: z.string(),
  file_size: z.number().max(200 * 1024 * 1024), // 200MB limit
  mime_type: z.string().refine((type) => 
    type.startsWith('image/') || type.startsWith('video/'),
    { message: 'Only image and video files are allowed' }
  ),
  public_link: z.string()
});

export type UploadFileInput = z.infer<typeof uploadFileInputSchema>;

// Schema for file stats
export const fileStatsSchema = z.object({
  total_files: z.number(),
  total_size: z.number()
});

export type FileStats = z.infer<typeof fileStatsSchema>;

// Schema for retrieving file by public link
export const getFileByLinkInputSchema = z.object({
  public_link: z.string()
});

export type GetFileByLinkInput = z.infer<typeof getFileByLinkInputSchema>;