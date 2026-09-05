-- Enable vector extension for RAG similarity search
CREATE EXTENSION IF NOT EXISTS vector;

-- CreateTable knowledge_documents
CREATE TABLE IF NOT EXISTS "knowledge_documents" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileUrl" TEXT,
    "fileType" TEXT NOT NULL DEFAULT 'text/plain',
    "fileSize" INTEGER NOT NULL DEFAULT 0,
    "content" TEXT,
    "status" TEXT NOT NULL DEFAULT 'READY',
    "chunkCount" INTEGER NOT NULL DEFAULT 0,
    "courseId" TEXT,
    "authorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "knowledge_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable document_chunks
CREATE TABLE IF NOT EXISTS "document_chunks" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "chunkIndex" INTEGER NOT NULL DEFAULT 0,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "document_chunks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "knowledge_documents_courseId_idx" ON "knowledge_documents"("courseId");
CREATE INDEX IF NOT EXISTS "knowledge_documents_authorId_idx" ON "knowledge_documents"("authorId");
CREATE INDEX IF NOT EXISTS "knowledge_documents_status_idx" ON "knowledge_documents"("status");
CREATE INDEX IF NOT EXISTS "document_chunks_documentId_idx" ON "document_chunks"("documentId");

-- AddForeignKey
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'knowledge_documents_courseId_fkey'
    ) THEN
        ALTER TABLE "knowledge_documents" ADD CONSTRAINT "knowledge_documents_courseId_fkey" 
        FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'knowledge_documents_authorId_fkey'
    ) THEN
        ALTER TABLE "knowledge_documents" ADD CONSTRAINT "knowledge_documents_authorId_fkey" 
        FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'document_chunks_documentId_fkey'
    ) THEN
        ALTER TABLE "document_chunks" ADD CONSTRAINT "document_chunks_documentId_fkey" 
        FOREIGN KEY ("documentId") REFERENCES "knowledge_documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;
