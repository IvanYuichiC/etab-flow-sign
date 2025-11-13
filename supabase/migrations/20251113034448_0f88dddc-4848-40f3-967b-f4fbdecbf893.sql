-- Create enums for document types and status
CREATE TYPE public.document_type AS ENUM (
  'Memorandum',
  'Ordinance',
  'Resolution',
  'Permit',
  'Certificate',
  'Letter',
  'Other'
);

CREATE TYPE public.document_status AS ENUM (
  'Pending',
  'In Progress',
  'Completed',
  'Returned'
);

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  department TEXT,
  position TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view all profiles"
  ON public.profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Create documents table
CREATE TABLE public.documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  document_type public.document_type NOT NULL,
  department TEXT NOT NULL,
  status public.document_status NOT NULL DEFAULT 'Pending',
  created_by UUID NOT NULL REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS on documents
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

-- Documents policies
CREATE POLICY "Users can view all documents"
  ON public.documents FOR SELECT
  USING (true);

CREATE POLICY "Users can create documents"
  ON public.documents FOR INSERT
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Document creators can update their documents"
  ON public.documents FOR UPDATE
  USING (auth.uid() = created_by);

-- Create signatories table
CREATE TABLE public.signatories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id),
  order_index INTEGER NOT NULL,
  signed_at TIMESTAMPTZ,
  remarks TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(document_id, user_id)
);

-- Enable RLS on signatories
ALTER TABLE public.signatories ENABLE ROW LEVEL SECURITY;

-- Signatories policies
CREATE POLICY "Users can view all signatories"
  ON public.signatories FOR SELECT
  USING (true);

CREATE POLICY "Users can insert signatories"
  ON public.signatories FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Assigned signatories can update their records"
  ON public.signatories FOR UPDATE
  USING (auth.uid() = user_id);

-- Create audit_logs table
CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id),
  action TEXT NOT NULL,
  details TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS on audit_logs
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Audit logs policies
CREATE POLICY "Users can view all audit logs"
  ON public.audit_logs FOR SELECT
  USING (true);

CREATE POLICY "Users can insert audit logs"
  ON public.audit_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Function to generate unique document ID
CREATE OR REPLACE FUNCTION public.generate_document_id()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
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

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_documents_updated_at
  BEFORE UPDATE ON public.documents
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, department, position)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    NEW.email,
    NEW.raw_user_meta_data->>'department',
    NEW.raw_user_meta_data->>'position'
  );
  RETURN NEW;
END;
$$;

-- Trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();