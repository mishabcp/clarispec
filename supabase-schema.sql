-- ============================================
-- CLARISPEC DATABASE SCHEMA
-- Run this entire script in Supabase SQL Editor
-- (Dashboard > SQL Editor > New Query > Paste > Run)
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================
-- USERS (managed by Supabase Auth, we extend it)
-- =====================
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  company_name TEXT,
  role TEXT DEFAULT 'project_manager',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================
-- PROJECTS
-- =====================
CREATE TABLE projects (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  client_name TEXT,
  client_industry TEXT,
  initial_brief TEXT NOT NULL,
  status TEXT DEFAULT 'gathering' CHECK (status IN ('gathering', 'completed', 'archived')),
  depth_level TEXT DEFAULT 'standard' CHECK (depth_level IN ('quick', 'standard', 'deep')),
  requirement_score INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================
-- CONVERSATION MESSAGES
-- =====================
CREATE TABLE messages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  message_type TEXT DEFAULT 'chat' CHECK (message_type IN ('chat', 'question', 'suggestion', 'summary', 'system')),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================
-- REQUIREMENT AREAS
-- =====================
CREATE TABLE requirement_areas (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  area_name TEXT NOT NULL,
  is_covered BOOLEAN DEFAULT FALSE,
  coverage_score INTEGER DEFAULT 0,
  notes TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================
-- DOCUMENTS
-- =====================
CREATE TABLE documents (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  doc_type TEXT NOT NULL CHECK (doc_type IN (
    'brd',
    'srs',
    'user_stories',
    'architecture_overview',
    'workflow',
    'mvp_scope',
    'feature_list',
    'timeline'
  )),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  version INTEGER DEFAULT 1,
  is_edited BOOLEAN DEFAULT FALSE,
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================
-- SUPERADMINS (separate auth, not tied to Supabase Auth)
-- =====================
CREATE TABLE superadmins (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================
-- DOCUMENT SELECTIONS
-- =====================
CREATE TABLE document_selections (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  doc_type TEXT NOT NULL,
  is_selected BOOLEAN DEFAULT TRUE,
  UNIQUE(project_id, doc_type)
);

-- =====================
-- ROW LEVEL SECURITY
-- =====================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE requirement_areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_selections ENABLE ROW LEVEL SECURITY;

-- Profiles: users can only see their own
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Projects: users can only see/edit their own
CREATE POLICY "Users can manage own projects" ON projects FOR ALL USING (auth.uid() = user_id);

-- Messages: users can manage messages in their own projects
CREATE POLICY "Users can manage own project messages" ON messages FOR ALL
  USING (EXISTS (SELECT 1 FROM projects WHERE projects.id = messages.project_id AND projects.user_id = auth.uid()));

-- Requirement areas: same
CREATE POLICY "Users can manage own requirement areas" ON requirement_areas FOR ALL
  USING (EXISTS (SELECT 1 FROM projects WHERE projects.id = requirement_areas.project_id AND projects.user_id = auth.uid()));

-- Documents: same
CREATE POLICY "Users can manage own documents" ON documents FOR ALL
  USING (EXISTS (SELECT 1 FROM projects WHERE projects.id = documents.project_id AND projects.user_id = auth.uid()));

-- Document selections: same
CREATE POLICY "Users can manage own document selections" ON document_selections FOR ALL
  USING (EXISTS (SELECT 1 FROM projects WHERE projects.id = document_selections.project_id AND projects.user_id = auth.uid()));

-- =====================
-- AUTO-CREATE PROFILE ON SIGNUP
-- =====================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
