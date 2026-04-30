-- PHASE 5: MASTER COPILOT — RAG INFRASTRUCTURE

-- 1. pgvector
CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA extensions;

-- 2. knowledge_documents
CREATE TYPE public.knowledge_doc_status AS ENUM (
  'pending',
  'processing',
  'processed',
  'failed'
);

CREATE TABLE public.knowledge_documents (
  id            UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  coach_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title         TEXT NOT NULL,
  status        public.knowledge_doc_status NOT NULL DEFAULT 'pending',
  error_message TEXT,
  chunk_count   INT  NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_knowledge_documents_coach_id ON public.knowledge_documents(coach_id);
CREATE INDEX idx_knowledge_documents_status   ON public.knowledge_documents(status);

CREATE TRIGGER update_knowledge_documents_updated_at
  BEFORE UPDATE ON public.knowledge_documents
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 3. knowledge_chunks
CREATE TABLE public.knowledge_chunks (
  id           UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id  UUID NOT NULL REFERENCES public.knowledge_documents(id) ON DELETE CASCADE,
  coach_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  chunk_index  INT  NOT NULL,
  content      TEXT NOT NULL,
  embedding    extensions.vector(1536),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_knowledge_chunks_document_id ON public.knowledge_chunks(document_id);
CREATE INDEX idx_knowledge_chunks_coach_id    ON public.knowledge_chunks(coach_id);

CREATE INDEX idx_knowledge_chunks_embedding
  ON public.knowledge_chunks
  USING hnsw (embedding extensions.vector_cosine_ops);

-- 4. RLS
ALTER TABLE public.knowledge_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.knowledge_chunks    ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Coaches can view own documents"
  ON public.knowledge_documents FOR SELECT
  USING (coach_id = auth.uid());

CREATE POLICY "Coaches can insert own documents"
  ON public.knowledge_documents FOR INSERT
  WITH CHECK (coach_id = auth.uid());

CREATE POLICY "Coaches can update own documents"
  ON public.knowledge_documents FOR UPDATE
  USING (coach_id = auth.uid())
  WITH CHECK (coach_id = auth.uid());

CREATE POLICY "Coaches can delete own documents"
  ON public.knowledge_documents FOR DELETE
  USING (coach_id = auth.uid());

CREATE POLICY "Coaches can view own chunks"
  ON public.knowledge_chunks FOR SELECT
  USING (coach_id = auth.uid());

CREATE POLICY "Coaches can insert own chunks"
  ON public.knowledge_chunks FOR INSERT
  WITH CHECK (coach_id = auth.uid());

CREATE POLICY "Coaches can update own chunks"
  ON public.knowledge_chunks FOR UPDATE
  USING (coach_id = auth.uid())
  WITH CHECK (coach_id = auth.uid());

CREATE POLICY "Coaches can delete own chunks"
  ON public.knowledge_chunks FOR DELETE
  USING (coach_id = auth.uid());

-- 5. match_knowledge_chunks RPC
CREATE OR REPLACE FUNCTION public.match_knowledge_chunks(
  query_embedding  extensions.vector(1536),
  match_threshold  FLOAT DEFAULT 0.7,
  match_count      INT   DEFAULT 5
)
RETURNS TABLE (
  id             UUID,
  document_id    UUID,
  document_title TEXT,
  content        TEXT,
  similarity     FLOAT
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_caller_id    UUID := auth.uid();
  v_target_coach UUID;
BEGIN
  IF v_caller_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  SELECT
    CASE
      WHEN p.role = 'coach'   THEN p.id
      WHEN p.role = 'athlete' THEN p.coach_id
      ELSE NULL
    END
  INTO v_target_coach
  FROM public.profiles p
  WHERE p.id = v_caller_id;

  IF v_target_coach IS NULL THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    kc.id,
    kc.document_id,
    kd.title AS document_title,
    kc.content,
    1 - (kc.embedding <=> query_embedding) AS similarity
  FROM public.knowledge_chunks kc
  JOIN public.knowledge_documents kd ON kd.id = kc.document_id
  WHERE kc.coach_id = v_target_coach
    AND kd.status = 'processed'
    AND kc.embedding IS NOT NULL
    AND 1 - (kc.embedding <=> query_embedding) > match_threshold
  ORDER BY kc.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

REVOKE ALL ON FUNCTION public.match_knowledge_chunks(extensions.vector, FLOAT, INT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.match_knowledge_chunks(extensions.vector, FLOAT, INT) TO authenticated;