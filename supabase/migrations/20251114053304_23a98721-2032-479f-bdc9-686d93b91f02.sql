-- Create storage bucket for document files
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'documents',
  'documents',
  false,
  52428800,
  ARRAY['application/pdf', 'image/jpeg', 'image/png', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
);

-- Storage policies for documents bucket
CREATE POLICY "Users can upload their own documents"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'documents' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view documents they have access to"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'documents' AND
  (
    -- Document creator can view
    auth.uid()::text = (storage.foldername(name))[1]
    OR
    -- Signatories can view
    EXISTS (
      SELECT 1 FROM public.signatories s
      INNER JOIN public.documents d ON s.document_id = d.id
      WHERE s.user_id = auth.uid()
      AND (storage.foldername(name))[2] = d.id::text
    )
  )
);

CREATE POLICY "Users can update their own documents"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'documents' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Add file_url column to documents table
ALTER TABLE public.documents ADD COLUMN file_url TEXT;

-- Update documents RLS policy for tracking - only creator can view via track page
CREATE POLICY "Only document creators can track documents"
ON public.documents
FOR SELECT
TO authenticated
USING (created_by = auth.uid());

-- Drop the old policy that allowed everyone to view
DROP POLICY IF EXISTS "Users can view all documents" ON public.documents;