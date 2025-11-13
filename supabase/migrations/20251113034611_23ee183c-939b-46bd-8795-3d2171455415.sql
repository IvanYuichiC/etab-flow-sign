-- Fix search_path for update_updated_at_column function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Fix search_path for generate_document_id function
CREATE OR REPLACE FUNCTION public.generate_document_id()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_id TEXT;
  counter INTEGER := 1;
BEGIN
  LOOP
    new_id := 'DOC-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(counter::TEXT, 5, '0');
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.documents WHERE document_id = new_id);
    counter := counter + 1;
  END LOOP;
  RETURN new_id;
END;
$$;