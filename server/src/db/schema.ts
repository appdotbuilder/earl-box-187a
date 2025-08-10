import { serial, text, pgTable, timestamp, integer, varchar } from 'drizzle-orm/pg-core';

export const uploadedFilesTable = pgTable('uploaded_files', {
  id: serial('id').primaryKey(),
  filename: varchar('filename', { length: 255 }).notNull(), // Generated unique filename
  original_name: varchar('original_name', { length: 255 }).notNull(), // Original filename from user
  file_path: text('file_path').notNull(), // Path to file in uploads folder
  file_size: integer('file_size').notNull(), // File size in bytes
  mime_type: varchar('mime_type', { length: 100 }).notNull(), // MIME type (image/* or video/*)
  public_link: varchar('public_link', { length: 255 }).notNull().unique(), // Unique public sharing link
  uploaded_at: timestamp('uploaded_at').defaultNow().notNull(),
});

// TypeScript types for the table schema
export type UploadedFile = typeof uploadedFilesTable.$inferSelect; // For SELECT operations
export type NewUploadedFile = typeof uploadedFilesTable.$inferInsert; // For INSERT operations

// Important: Export all tables and relations for proper query building
export const tables = { uploadedFiles: uploadedFilesTable };