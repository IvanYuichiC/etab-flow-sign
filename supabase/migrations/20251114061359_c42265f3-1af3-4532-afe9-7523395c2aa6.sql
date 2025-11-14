-- Create the trigger function first
CREATE OR REPLACE FUNCTION public.generate_document_id_trigger()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.document_id := public.generate_document_id();
  RETURN NEW;
END;
$$;

-- Add trigger to auto-generate document_id on insert
CREATE OR REPLACE TRIGGER set_document_id
BEFORE INSERT ON public.documents
FOR EACH ROW
WHEN (NEW.document_id IS NULL)
EXECUTE FUNCTION public.generate_document_id_trigger();