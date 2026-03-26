# Clarispec — AI-Powered Requirements Engineering & Documentation Platform
## Complete Project Documentation

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Tech Stack](#2-tech-stack)
3. [Free Services Setup](#3-free-services-setup)
4. [Project Folder Structure](#4-project-folder-structure)
5. [Database Schema (Supabase)](#5-database-schema-supabase)
6. [Environment Variables](#6-environment-variables)
7. [Authentication](#7-authentication)
8. [Application Pages & Routes](#8-application-pages--routes)
9. [Core Features — Detailed Specification](#9-core-features--detailed-specification)
10. [AI System — Prompt Engineering](#10-ai-system--prompt-engineering)
11. [Document Generation System](#11-document-generation-system)
12. [UI Components](#12-ui-components)
13. [Design System](#13-design-system)
14. [Step-by-Step Build Order](#14-step-by-step-build-order)
15. [Deployment](#15-deployment)
16. [Keeping This Documentation Up to Date](#16-keeping-this-documentation-up-to-date)

---

## 1. Project Overview

### What is Clarispec?
Clarispec is a web application for **project managers** at software development companies and freelancers. It uses AI to conduct structured, intelligent conversations that extract client requirements and automatically generates all necessary planning and project documentation.

### The Problem It Solves
| Problem | How Clarispec Solves It |
|---|---|
| PM needs domain knowledge of client's industry | AI understands any industry automatically |
| Requirement gathering requires research | AI has broad knowledge, no research needed |
| Easy to miss important questions | AI follows structured frameworks, never skips |
| Document preparation takes days | AI generates documents in seconds |
| Requires strong critical thinking | AI reasons through gaps and edge cases |

### Who Uses It
- **Project Managers** at software development companies
- **Freelance developers** doing requirements gathering before development
- **Tech leads / consultants** who handle pre-project scoping

### Core User Journey
```
1. PM creates a new project
2. PM enters the client's rough idea / brief
3. AI analyses the brief and begins asking smart questions
4. PM answers on behalf of the client
5. AI detects gaps and asks follow-ups until requirement is complete
6. PM selects depth level and documents needed
7. AI generates all selected documents
8. PM downloads / exports the documents
```

---

## 2. Tech Stack

| Layer | Technology | Reason |
|---|---|---|
| **Framework** | Next.js 14 (App Router) | Full-stack, free on Vercel |
| **Language** | TypeScript | Type safety |
| **Styling** | Tailwind CSS | Fast, utility-first |
| **UI Components** | shadcn/ui | Free, customizable |
| **Database** | Supabase (PostgreSQL) | Free tier, 500MB |
| **Authentication** | Supabase Auth | Free, built-in |
| **AI API** | Google Gemini (default: 2.5 Flash) | Configurable via `GEMINI_MODEL`; free tier limits apply |
| **File Export** | jsPDF + html2canvas | Client-side PDF generation |
| **Markdown Export** | markdown-it | Markdown rendering & export |
| **Hosting** | Vercel | Free for Next.js |
| **Icons** | Lucide React | Free, clean icons |

### Why Google Gemini (Free Tier)?
- **15 requests per minute** — enough for conversational use
- **1,000,000 tokens per day** — very generous for this use case
- **No credit card required** to start
- Excellent at structured reasoning and document generation
- Get API key at: https://aistudio.google.com/app/apikey
- Model is configurable via `GEMINI_MODEL` (default: `gemini-2.5-flash`)

---

## 3. Free Services Setup

### 3.1 Google Gemini API
1. Go to https://aistudio.google.com/app/apikey
2. Sign in with Google account
3. Click "Create API Key"
4. Copy the key → store as `GEMINI_API_KEY` in `.env.local`

### 3.2 Supabase
1. Go to https://supabase.com and create a free account
2. Create a new project (free tier: 1 project, 500MB database)
3. Go to **Settings → API**
4. Copy:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public key` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role key` → `SUPABASE_SERVICE_ROLE_KEY`
5. Run the SQL schema from Section 5 in the **Supabase SQL Editor**

### 3.3 Vercel
1. Go to https://vercel.com and sign in with GitHub
2. Connect the project repository
3. Add all environment variables in Vercel dashboard
4. Deploy

---

## 4. Project Folder Structure

```
clarispec/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   │   └── page.tsx
│   │   └── signup/
│   │       └── page.tsx
│   ├── (dashboard)/
│   │   ├── layout.tsx                  # Dashboard layout with sidebar
│   │   ├── dashboard/
│   │   │   └── page.tsx               # Projects list / home
│   │   ├── projects/
│   │   │   ├── new/
│   │   │   │   └── page.tsx           # Create new project
│   │   │   └── [projectId]/
│   │   │       ├── page.tsx           # Project overview
│   │   │       ├── gather/
│   │   │       │   └── page.tsx       # AI conversation page
│   │   │       └── documents/
│   │   │           ├── page.tsx       # Documents list
│   │   │           └── [docId]/
│   │   │               └── page.tsx   # Single document view/edit
│   │   └── settings/
│   │       └── page.tsx
│   └── api/
│       ├── ai/
│       │   ├── chat/
│       │   │   └── route.ts           # AI conversation endpoint
│       │   ├── analyze/
│       │   │   └── route.ts           # Analyze initial brief
│       │   └── generate/
│       │       └── route.ts           # Generate documents
│       └── projects/
│           ├── route.ts               # GET all, POST create
│           └── [projectId]/
│               ├── route.ts           # GET, PATCH, DELETE project
│               ├── messages/
│               │   └── route.ts       # GET, POST messages
│               └── documents/
│                   └── route.ts       # GET, POST documents
├── components/
│   ├── ui/                            # shadcn/ui components
│   ├── auth/
│   │   ├── LoginForm.tsx
│   │   └── SignupForm.tsx
│   ├── dashboard/
│   │   ├── Sidebar.tsx
│   │   ├── ProjectCard.tsx
│   │   └── StatsBar.tsx
│   ├── project/
│   │   ├── ProjectHeader.tsx
│   │   ├── ProjectSetup.tsx           # Depth & document selector
│   │   └── ProjectProgress.tsx
│   ├── gather/
│   │   ├── ChatInterface.tsx          # Main AI chat component
│   │   ├── MessageBubble.tsx
│   │   ├── QuestionCard.tsx           # AI question with suggestions
│   │   ├── TypingIndicator.tsx
│   │   └── RequirementProgress.tsx    # Shows completeness score
│   └── documents/
│       ├── DocumentCard.tsx
│       ├── DocumentViewer.tsx         # Full document view + edit
│       └── ExportMenu.tsx             # PDF / Markdown export
├── lib/
│   ├── supabase/
│   │   ├── client.ts                  # Browser supabase client
│   │   ├── server.ts                  # Server supabase client
│   │   └── middleware.ts              # Auth session update (used by root middleware)
│   ├── ai/
│   │   ├── gemini.ts                  # Gemini API client setup
│   │   ├── prompts/
│   │   │   ├── system.ts              # Base system prompt
│   │   │   ├── analyzer.ts            # Brief analysis prompt
│   │   │   ├── questioner.ts          # Question generation prompt
│   │   │   └── documents/
│   │   │       ├── brd.ts
│   │   │       ├── srs.ts
│   │   │       ├── userStories.ts
│   │   │       ├── architecture.ts
│   │   │       ├── workflow.ts
│   │   │       ├── mvpScope.ts
│   │   │       ├── featureList.ts
│   │   │       └── timeline.ts
│   │   └── conversation.ts            # Conversation state management
│   ├── documents/
│   │   ├── generator.ts               # Orchestrates document generation
│   │   ├── exportPDF.ts
│   │   └── exportMarkdown.ts
│   └── utils.ts
├── types/
│   └── index.ts                       # Global TypeScript types (DB entities, RequirementAreas, etc.)
├── middleware.ts                      # Auth middleware — delegates to lib/supabase/middleware
├── .env.local
├── .env.example
├── tailwind.config.ts
├── next.config.ts
└── package.json
```

---

## 5. Database Schema (Supabase)

Run the following SQL in the Supabase SQL Editor:

```sql
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
  client_industry TEXT,          -- e.g. "Healthcare", "E-commerce", "Fintech"
  initial_brief TEXT NOT NULL,   -- Raw brief entered by PM
  status TEXT DEFAULT 'gathering' CHECK (status IN ('gathering', 'completed', 'archived')),
  depth_level TEXT DEFAULT 'standard' CHECK (depth_level IN ('quick', 'standard', 'deep')),
  requirement_score INTEGER DEFAULT 0,  -- 0-100 completeness score
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
  metadata JSONB DEFAULT '{}',   -- Store question categories, suggestion types etc
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================
-- REQUIREMENT AREAS
-- Tracks which requirement areas have been covered
-- =====================
CREATE TABLE requirement_areas (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  area_name TEXT NOT NULL,          -- e.g. "Core Features", "User Roles", "Integrations"
  is_covered BOOLEAN DEFAULT FALSE,
  coverage_score INTEGER DEFAULT 0, -- 0-100
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
  content TEXT NOT NULL,           -- Markdown content
  version INTEGER DEFAULT 1,
  is_edited BOOLEAN DEFAULT FALSE, -- Was it manually edited after generation?
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================
-- DOCUMENT SELECTIONS
-- Which documents the user wants generated for a project
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

---

## 6. Environment Variables

Create a `.env.local` file in the project root:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Google Gemini AI
GEMINI_API_KEY=your_gemini_api_key
# Optional: default is gemini-2.5-flash
# GEMINI_MODEL=gemini-2.5-flash

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Create a `.env.example` file with the same keys but empty values (for Git).

---

## 7. Authentication

### Flow
- Email + Password signup/login via Supabase Auth
- On signup: profile row is auto-created via database trigger
- Protected routes via `middleware.ts` (root) which calls `updateSession` from `lib/supabase/middleware.ts`
- Uses `@supabase/ssr` for cookie-based session handling
- Redirect unauthenticated users to `/login` (except `/login`, `/signup`, and `/`)
- Redirect authenticated users from `/login`, `/signup`, and `/` to `/dashboard`

### Root middleware.ts
```typescript
import { updateSession } from '@/lib/supabase/middleware'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
```

### lib/supabase/middleware.ts
Uses `createServerClient` from `@supabase/ssr` to read/update cookies and `getUser()` for auth. Keeps session in sync and redirects as above.

---

## 8. Application Pages & Routes

### 8.1 `/login` — Login Page
- Email + password form
- Link to signup
- On success: redirect to `/dashboard`

### 8.2 `/signup` — Signup Page
- Full name, email, password, company name (optional)
- On success: redirect to `/dashboard`

### 8.3 `/dashboard` — Projects Dashboard
**Displays:**
- Welcome message with user's name
- Stats bar: Total Projects | In Progress | Completed | Documents Generated
- Grid of project cards
- "New Project" button

**Project Card shows:**
- Project name + client name
- Client industry tag
- Status badge (Gathering / Completed / Archived)
- Requirement completeness progress bar (0-100%)
- Number of documents generated
- Created date
- "Open Project" button

### 8.4 `/projects/new` — Create New Project
**Step 1 — Project Info:**
- Project name (required)
- Client name (optional)
- Client industry (dropdown: E-commerce, Healthcare, Fintech, Education, Real Estate, Logistics, Social Media, SaaS / B2B Tool, Entertainment, Government, Other)

**Step 2 — Initial Brief:**
- Large textarea: "Describe what the client wants to build"
- Helper text: "Don't worry about being technical — write it exactly as the client described it"
- Minimum 50 characters validation

**Step 3 — Configuration:**
- **Depth Level selector** (see Section 9.2)
- **Document selector** (see Section 9.3)

On submit:
- Save project to Supabase
- Save document selections
- Redirect to `/projects/[projectId]/gather`

### 8.5 `/projects/[projectId]/gather` — AI Requirement Gathering
This is the **main feature page**. Full-screen chat interface.

**Left Panel (30% width):**
- Project name + client
- Requirement completeness score (animated circular progress)
- Requirement areas checklist (which areas have been covered)
- Current depth level badge
- "I'm satisfied, generate documents" button (enabled when score > 60%)

**Right Panel (70% width):**
- Chat interface (scrollable message history)
- AI message bubbles with question cards
- User input box at the bottom
- Suggestion chips (quick answers AI provides as clickable options)

### 8.6 `/projects/[projectId]/documents` — Documents List
- Grid of document cards (only selected documents shown)
- Each card: Document title, type badge, generated date, word count
- "Regenerate" button per document
- "Export All" button
- Status: Generated / Pending / Generating

### 8.7 `/projects/[projectId]/documents/[docId]` — Document View
- Full document rendered in markdown
- Edit button (converts to editable textarea)
- Save edits button
- Export options: PDF, Markdown (via ExportMenu)
- Regenerate button (re-run AI generation for this doc)
- Breadcrumb navigation

### 8.8 `/projects/[projectId]` — Project Overview
- Project info header
- Summary of requirements gathered
- Quick links to Gather and Documents
- Edit project settings

### 8.9 `/settings` — User Settings
- Update full name, company name
- Change password

---

## 9. Core Features — Detailed Specification

### 9.1 AI Conversation Flow

The AI conversation follows a **structured phases model**:

**Phase 1 — Brief Analysis (automatic, no user input)**
- When project is created, AI immediately analyses the initial brief
- Identifies: industry, scale, type of software (web/mobile/both), known features
- Identifies gaps and unknown areas
- Creates a conversation plan
- Sends a welcome message + first question

**Phase 2 — Core Requirement Gathering**
AI asks questions in this order (never skips a category unless already answered):

1. **Purpose & Goals** — What is the primary goal? Who is the target user? What problem does it solve?
2. **User Roles** — Who are the different types of users? What can each do?
3. **Core Features** — What are the must-have features? What does the app do on a daily basis?
4. **User Flows** — How does a user go from registration to completing the key action?
5. **Third-party Integrations** — Payment gateways, email services, social login, maps, etc.
6. **Platform** — Web app, mobile app (iOS/Android), or both? Desktop app?
7. **Scale & Performance** — How many users expected? Any specific performance needs?
8. **Data & Privacy** — What sensitive data is handled? Any compliance requirements? (GDPR, HIPAA etc.)
9. **Non-functional Requirements** — Speed, availability, offline support, etc.
10. **Constraints & Preferences** — Budget range, preferred tech, timeline, existing systems to integrate with

**Phase 3 — Gap Detection**
After each answer, AI:
- Marks relevant requirement areas as covered
- Detects if any critical information is still missing
- Asks targeted follow-up questions for gaps
- Updates the completeness score

**Phase 4 — Confirmation**
When completeness score reaches the threshold for the selected depth level:
- AI sends a summary of all gathered requirements
- Asks if anything is missing or needs correction
- PM can add more or confirm it's complete

**Phase 5 — Document Generation**
- PM clicks "Generate Documents"
- AI generates each selected document one by one
- Progress indicator shown

---

### 9.2 Depth Levels

| Level | Description | Min Completeness to Generate | Questions Asked |
|---|---|---|---|
| **Quick Scan** | High-level overview, basic documents | 50% | Core features, users, platform only |
| **Standard** | Full requirement gathering, all main areas | 70% | All 10 categories |
| **Deep Dive** | Exhaustive, edge cases, detailed specs | 85% | All categories + edge cases + constraints |

The depth level affects:
- How many follow-up questions AI asks
- How detailed the generated documents are
- The minimum completeness score required before documents can be generated

---

### 9.3 Document Types & Selector

The user selects which documents to generate during project setup. They can change this before generating.

| Document | Abbreviation | Description | Default |
|---|---|---|---|
| Business Requirements Document | BRD | Business goals, stakeholders, scope, success metrics | ✅ ON |
| Software Requirements Specification | SRS | Detailed functional & non-functional requirements | ✅ ON |
| User Stories | US | As a [user], I want [feature] so that [reason] — with acceptance criteria | ✅ ON |
| Software Architecture Overview | SAO | High-level system design, components, suggested tech stack | ✅ ON |
| Workflow Document | WF | Step-by-step process flows for key features | ✅ ON |
| MVP Scope Document | MVP | What is core vs. future features. Phase 1 scope definition | ✅ ON |
| Feature List (MoSCoW) | FL | Must have / Should have / Could have / Won't have | ✅ ON |
| Project Timeline Estimate | PT | Rough phases, milestones, time estimates | ✅ ON |

---

### 9.4 Requirement Completeness Score

The score is calculated based on how many requirement areas have been covered:

```
Areas: Purpose(15%) + Users(10%) + CoreFeatures(20%) + UserFlows(15%) +
       Integrations(10%) + Platform(5%) + Scale(5%) + DataPrivacy(10%) +
       NonFunctional(5%) + Constraints(5%)
```

The score updates live in the sidebar as the conversation progresses. AI updates it after every message exchange.

---

### 9.5 AI Suggestions Feature

After each user answer, AI may provide:
- **Quick-pick chips**: Clickable suggestion buttons (e.g., after asking about payment: "Stripe", "PayPal", "Razorpay", "Not decided yet")
- **Proactive suggestions**: "Apps in this space usually also need X — do you want to include it?"
- **Best practice tips**: Inline info boxes about industry standards

---

## 10. AI System — Prompt Engineering

### 10.1 Gemini Client Setup (`lib/ai/gemini.ts`)

The model name is read from `GEMINI_MODEL` (default: `gemini-2.5-flash`). Two model getters are used:

- **getGeminiModel()** — for chat and analyze: temperature 0.7, maxOutputTokens 4096
- **getGeminiModelForDocs()** — for document generation: temperature 0.5, maxOutputTokens 8192

```typescript
import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
const MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash'

export function getGeminiModel() {
  return genAI.getGenerativeModel({
    model: MODEL,
    generationConfig: {
      temperature: 0.7,
      topK: 40,
      topP: 0.95,
      maxOutputTokens: 4096,
    },
  })
}

export function getGeminiModelForDocs() {
  return genAI.getGenerativeModel({
    model: MODEL,
    generationConfig: {
      temperature: 0.5,
      topK: 40,
      topP: 0.95,
      maxOutputTokens: 8192,
    },
  })
}
```

Install package: `npm install @google/generative-ai`

---

### 10.2 Base System Prompt (`lib/ai/prompts/system.ts`)

```
You are Clarispec, an expert software requirements analyst and project consultant.
Your role is to help project managers gather complete software requirements
from their clients and prepare professional technical documentation.

You have deep expertise in:
- Software development processes and methodologies
- Business analysis and requirement engineering
- Multiple industry domains (healthcare, e-commerce, fintech, education, etc.)
- Project management and scoping
- Software architecture concepts

Your personality:
- Professional yet approachable
- Ask one focused question at a time — never overwhelm with multiple questions
- Acknowledge the answer before asking the next question
- Provide brief, helpful context when asking a question
- Offer suggestions and examples when helpful
- Be thorough but efficient

Rules:
- Always ask ONE question at a time
- Never ask a question that has already been answered
- When you detect a gap or contradiction, address it
- Adapt your language to be non-technical when needed
- If the user seems unsure, offer example options as suggestions
```

---

### 10.3 Brief Analyzer Prompt (`lib/ai/prompts/analyzer.ts`)

This prompt is used to analyze the initial client brief before the conversation begins.

```
Analyze the following software project brief and return a JSON object with this structure:

{
  "detectedIndustry": string,
  "softwareType": "web" | "mobile" | "both" | "desktop" | "unknown",
  "knownFeatures": string[],
  "identifiedUserTypes": string[],
  "gapsDetected": string[],
  "suggestedFirstQuestion": string,
  "suggestedFirstOptions": ["option1", "option2", "option3", "option4"],
  "conversationPlan": string[],
  "initialRequirementAreas": {
    "purpose": boolean,
    "userRoles": boolean,
    "coreFeatures": boolean,
    "userFlows": boolean,
    "integrations": boolean,
    "platform": boolean,
    "scale": boolean,
    "dataPrivacy": boolean,
    "nonFunctional": boolean,
    "constraints": boolean
  },
  "initialScore": number
}

Brief: {BRIEF}

Return ONLY the JSON object, no markdown, no explanation.
```

---

### 10.4 Question Generator Prompt (`lib/ai/prompts/questioner.ts`)

Used on every conversation turn to generate the AI's next response:

```
You are conducting a requirement gathering session for a software project.

Project Brief: {BRIEF}
Client Industry: {INDUSTRY}
Depth Level: {DEPTH_LEVEL}

Conversation so far:
{CONVERSATION_HISTORY}

Current requirement coverage:
{REQUIREMENT_AREAS_JSON}

Current completeness score: {SCORE}%

Your task:
1. Acknowledge the user's last answer naturally (1-2 sentences)
2. Identify what important information is still missing based on the depth level
3. Ask the single most important missing question right now
4. Provide exactly 4 suggestion chips as multiple-choice options (each a complete, self-contained answer)

Respond in this JSON format:
{
  "acknowledgment": "string - acknowledge their answer",
  "question": "string - the next question to ask",
  "questionCategory": "purpose|userRoles|coreFeatures|userFlows|integrations|platform|scale|dataPrivacy|nonFunctional|constraints",
  "suggestions": ["option1", "option2", "option3", "option4"],
  "updatedScore": number,
  "updatedAreas": { same structure as requirement areas, updated booleans },
  "isComplete": boolean
}

Return ONLY the JSON object.
```

---

### 10.5 Document Generation Prompts

Each document has its own dedicated prompt. The conversation history is always passed in full.

#### BRD Prompt (`lib/ai/prompts/documents/brd.ts`)
```
Based on the following software requirement gathering conversation, generate a complete
Business Requirements Document (BRD) in Markdown format.

Project: {PROJECT_NAME}
Client: {CLIENT_NAME}
Industry: {INDUSTRY}

Conversation:
{CONVERSATION_HISTORY}

Generate a professional BRD with these sections:
1. Executive Summary
2. Business Objectives
3. Project Scope
4. Stakeholders
5. Business Requirements (functional)
6. Assumptions and Constraints
7. Success Metrics / KPIs
8. Out of Scope

Use professional language. Be specific. Use tables where appropriate.
Format in clean Markdown.
```

#### SRS Prompt (`lib/ai/prompts/documents/srs.ts`)
```
Based on the following requirement gathering conversation, generate a complete
Software Requirements Specification (SRS) document in Markdown format.

Project: {PROJECT_NAME}
Client: {CLIENT_NAME}
Industry: {INDUSTRY}

Conversation:
{CONVERSATION_HISTORY}

Generate a professional SRS with these sections:
1. Introduction (Purpose, Scope, Definitions)
2. Overall Description (Product Perspective, User Classes, Assumptions)
3. Functional Requirements (detailed list, numbered)
4. Non-Functional Requirements (performance, security, reliability, scalability)
5. System Constraints
6. External Interface Requirements

Use IEEE SRS standard as a guide. Be specific and detailed.
Format in clean Markdown with numbered requirements.
```

#### User Stories Prompt (`lib/ai/prompts/documents/userStories.ts`)
```
Based on the following requirement gathering conversation, generate comprehensive
User Stories in Markdown format.

Project: {PROJECT_NAME}
Industry: {INDUSTRY}

Conversation:
{CONVERSATION_HISTORY}

For each identified user role, generate user stories in this format:
**Story ID: US-[number]**
**Title:** Short title
**As a** [user role],
**I want to** [feature/action],
**So that** [benefit/reason].

**Acceptance Criteria:**
- Given [context], when [action], then [expected result]
- (list all relevant criteria)

**Priority:** Must Have / Should Have / Could Have
**Complexity:** Low / Medium / High

Group stories by user role. Be thorough — cover all features mentioned.
Format in clean Markdown.
```

#### Architecture Overview Prompt (`lib/ai/prompts/documents/architecture.ts`)
```
Based on the following requirement gathering conversation, generate a
Software Architecture Overview document in Markdown format.

This is a HIGH-LEVEL conceptual document for project managers — NOT for developers.
Avoid deep technical jargon. Explain technical choices in business terms.

Project: {PROJECT_NAME}
Industry: {INDUSTRY}

Conversation:
{CONVERSATION_HISTORY}

Generate the document with these sections:
1. System Overview (plain English description of how the system works)
2. Key Components (list the major parts of the system and what each does)
3. Suggested Technology Stack (with simple explanations of why each is recommended)
4. System Integrations (third-party services and why they're needed)
5. Security Considerations (key security needs in plain terms)
6. Scalability Considerations (how the system can grow)

Keep language accessible to non-technical stakeholders.
Format in clean Markdown.
```

#### Workflow Prompt (`lib/ai/prompts/documents/workflow.ts`)
```
Based on the following requirement gathering conversation, generate a
Workflow Document describing the key process flows of the software.

Project: {PROJECT_NAME}
Industry: {INDUSTRY}

Conversation:
{CONVERSATION_HISTORY}

For each major user flow / process, describe it in this format:

## [Flow Name]
**Actors:** [who is involved]
**Trigger:** [what starts this flow]
**Preconditions:** [what must be true before this starts]

**Steps:**
1. Step description
2. Step description
...

**Postconditions:** [what is true after this flow completes]
**Alternative Flows:** [what happens if something goes wrong or user takes a different path]

Cover all major flows identified in the requirements.
Format in clean Markdown.
```

#### MVP Scope Prompt (`lib/ai/prompts/documents/mvpScope.ts`)
```
Based on the following requirement gathering conversation, generate an
MVP (Minimum Viable Product) Scope Document in Markdown format.

Project: {PROJECT_NAME}
Industry: {INDUSTRY}

Conversation:
{CONVERSATION_HISTORY}

Generate the document with these sections:
1. MVP Definition (what is the MVP and its purpose)
2. MVP Goals (what must the MVP achieve)
3. Phase 1 — Core Scope (features included in MVP)
4. Phase 2 — Next Iteration (features for the next release)
5. Future Phases (long-term features)
6. Explicitly Out of Scope for MVP
7. MVP Success Criteria (how do we know the MVP succeeded)
8. Recommended MVP Timeline (rough estimate in weeks)

Be practical and realistic. Focus on the minimum needed to validate the core value.
Format in clean Markdown.
```

#### Feature List Prompt (`lib/ai/prompts/documents/featureList.ts`)
```
Based on the following requirement gathering conversation, generate a complete
Feature List using the MoSCoW prioritization method in Markdown format.

Project: {PROJECT_NAME}
Industry: {INDUSTRY}

Conversation:
{CONVERSATION_HISTORY}

Generate a comprehensive feature list with all features categorized as:
- **Must Have** — Critical features without which the product doesn't work
- **Should Have** — Important features that add significant value
- **Could Have** — Nice-to-have features if time/budget allows
- **Won't Have (this time)** — Explicitly out of scope for now

For each feature include:
| Feature | Category | Description | Rationale |

Also include:
- Summary count of features per category
- Notes on dependencies between features

Format in clean Markdown with tables.
```

#### Timeline Prompt (`lib/ai/prompts/documents/timeline.ts`)
```
Based on the following requirement gathering conversation, generate a
Project Timeline Estimate document in Markdown format.

Project: {PROJECT_NAME}
Industry: {INDUSTRY}

Conversation:
{CONVERSATION_HISTORY}

Generate the document with these sections:
1. Project Overview Summary
2. Estimated Phases with duration (in weeks):
   - Phase 1: Discovery & Design
   - Phase 2: Core Development (MVP)
   - Phase 3: Testing & QA
   - Phase 4: Deployment & Launch
   - Phase 5: Post-launch Support (optional)
3. Milestone Table: | Milestone | Deliverable | Estimated Week |
4. Key Dependencies and Risks
5. Total Estimated Duration
6. Important Assumptions behind the estimates

Note: These are rough estimates for planning purposes only.
Add a disclaimer that actual timelines depend on team size, technology choices, and scope changes.
Format in clean Markdown.
```

---

## 11. Document Generation System

### 11.1 Generator Orchestrator (`lib/documents/generator.ts`)

The generator uses `getGeminiModelForDocs()` (higher max tokens, lower temperature). It returns `{ title, content }`; the `/api/ai/generate` route saves documents to Supabase and updates project status.

```typescript
export async function generateDocument(
  docType: DocumentType,
  project: ProjectInfo,
  conversationHistory: string
): Promise<{ title: string; content: string }> {
  const model = getGeminiModelForDocs()
  const prompt = getPrompt(docType, project, conversationHistory)
  const result = await model.generateContent([{ text: SYSTEM_PROMPT }, { text: prompt }])
  let content = result.response.text()
  // Strip markdown code fences if present
  return { title: getDocTitle(docType), content: content.trim() }
}

export async function generateAllDocuments(
  selectedDocs: DocumentType[],
  project: ProjectInfo,
  conversationHistory: string
): Promise<{ docType, title, content }[]> {
  // Iterates selectedDocs, calls generateDocument, delay(1000) between calls for rate limits
}
```

The `/api/ai/generate` route fetches project + messages, calls `generateAllDocuments`, then inserts each result into the `documents` table and sets project status to `completed`.

### 11.2 Export Functions

**PDF Export (`lib/documents/exportPDF.ts`)**
- Use `jsPDF` + `html2canvas`
- Render the markdown document to HTML first
- Then capture as PDF
- Install: `npm install jspdf html2canvas`

**Markdown Export (`lib/documents/exportMarkdown.ts`)**
- Simply trigger a download of the raw markdown content as a `.md` file
- No library needed — use Blob + URL.createObjectURL

---

## 12. UI Components

### 12.1 ChatInterface Component

The main gathering page component. Key behaviours:
- Messages scroll automatically to the bottom on new message
- Typing indicator (animated dots) shown while AI is generating
- User input is disabled while AI is responding
- Suggestion chips appear below AI questions
- Clicking a suggestion chip fills the input and submits automatically
- Messages are persisted to Supabase in real-time

### 12.2 QuestionCard Component

AI questions are displayed in a styled card (different from regular chat bubbles):
- Has a category badge (e.g., "Core Features", "User Roles")
- Question text is prominent
- Optional suggestion chips below
- Optional context tooltip with a small info icon

### 12.3 RequirementProgress Component (Sidebar)

- Animated circular progress ring showing completeness score (0-100%)
- Colour changes: Red (0-40%) → Yellow (40-70%) → Green (70-100%)
- Checklist below showing all 10 requirement areas with check/cross icons
- Animates when a new area gets covered

### 12.4 DocumentViewer Component

- Renders markdown using `react-markdown` + `remark-gfm` (for tables, strikethrough)
- Has a clean "Edit" mode toggle that converts to a plain textarea
- Install: `npm install react-markdown remark-gfm`

### 12.5 ProjectSetup Component

Used in the new project creation flow:
- Depth level selector: 3 cards with visual distinction (Quick / Standard / Deep Dive)
- Document selector: 8 toggle switches, each with document name + short description
- "Select All" / "Deselect All" quick actions

---

## 13. Design System

### Visual Direction
**Theme:** Dark professional — deep navy/slate background with electric blue accents.
Feels like a premium SaaS tool. Clean, focused, trustworthy.

### Colour Palette (CSS Variables in `globals.css`)
```css
:root {
  --background: #0A0F1E;       /* Deep navy */
  --surface: #111827;          /* Card surfaces */
  --surface-hover: #1F2937;    /* Hover state */
  --border: #1F2937;           /* Subtle borders */
  --primary: #3B82F6;          /* Electric blue */
  --primary-hover: #2563EB;
  --accent: #06B6D4;           /* Cyan accent */
  --success: #10B981;          /* Green */
  --warning: #F59E0B;          /* Amber */
  --danger: #EF4444;           /* Red */
  --text-primary: #F9FAFB;     /* Near white */
  --text-secondary: #9CA3AF;   /* Muted grey */
  --text-muted: #6B7280;       /* More muted */
}
```

### Typography
```css
/* Import in layout.tsx */
import { Space_Grotesk, JetBrains_Mono } from 'next/font/google'

/* Space Grotesk for headings — modern, geometric */
/* Inter for body — clean, readable */
/* JetBrains Mono for code/document content */
```

### Tailwind Config Additions (`tailwind.config.ts`)
```typescript
theme: {
  extend: {
    colors: {
      navy: '#0A0F1E',
      surface: '#111827',
    },
    animation: {
      'fade-in': 'fadeIn 0.3s ease-in',
      'slide-up': 'slideUp 0.3s ease-out',
      'pulse-dot': 'pulseDot 1.4s infinite',
    }
  }
}
```

---

## 14. Step-by-Step Build Order

Build the project in this exact order for the smoothest development experience:

### Step 1 — Project Setup
```bash
npx create-next-app@latest clarispec --typescript --tailwind --app
cd clarispec
npm install @supabase/supabase-js @supabase/ssr
npm install @google/generative-ai
npm install react-markdown remark-gfm
npm install jspdf html2canvas
npm install lucide-react
npx shadcn-ui@latest init
npx shadcn-ui@latest add button input textarea card badge progress
npx shadcn-ui@latest add dropdown-menu dialog toast separator
```

### Step 2 — Environment & Supabase
1. Create `.env.local` with all keys
2. Run database schema in Supabase SQL Editor
3. Set up `lib/supabase/client.ts`, `lib/supabase/server.ts`, and `lib/supabase/middleware.ts`
4. Set up `types/index.ts` with all table types and shared types (Profile, Project, Message, etc.)

### Step 3 — Authentication
1. Build `/login` page with Supabase Auth email/password
2. Build `/signup` page
3. Add root `middleware.ts` (delegating to `lib/supabase/middleware.ts`) for route protection
4. Test auth flow end-to-end

### Step 4 — Dashboard & Project Creation
1. Build dashboard layout with sidebar (`app/(dashboard)/layout.tsx`)
2. Build `/dashboard` projects list page
3. Build `/projects/new` multi-step form
4. Build project CRUD API routes
5. Test creating and viewing a project

### Step 5 — AI Conversation Core
1. Set up `lib/ai/gemini.ts`
2. Write all prompts in `lib/ai/prompts/`
3. Build the `/api/ai/chat` API route
4. Build the `/api/ai/analyze` route (for brief analysis on project creation)
5. Build `ChatInterface.tsx` component
6. Build `MessageBubble.tsx` and `QuestionCard.tsx`
7. Build `RequirementProgress.tsx` sidebar
8. Build the full gather page (`/projects/[projectId]/gather`)
9. Test the full conversation flow

### Step 6 — Document Generation
1. Write all document prompts in `lib/ai/prompts/documents/`
2. Build `lib/documents/generator.ts`
3. Build `/api/ai/generate` route
4. Build documents list page
5. Build `DocumentViewer.tsx` with markdown rendering
6. Build PDF and Markdown export
7. Test full document generation

### Step 7 — Polish & Settings
1. Build `/settings` page
2. Add edit functionality to documents
3. Add regenerate functionality
4. Add project archiving
5. Error handling and loading states throughout

### Step 8 — Deploy
1. Push to GitHub
2. Connect to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

---

## 15. Deployment

### Vercel Deployment
1. Push project to a GitHub repository
2. Go to https://vercel.com → New Project → Import from GitHub
3. Add all environment variables from `.env.local`:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `GEMINI_API_KEY`
   - `NEXT_PUBLIC_APP_URL` (set to your Vercel URL)
4. Deploy
5. Update Supabase Auth settings: Add your Vercel URL to allowed redirect URLs

### Supabase Auth Settings
In Supabase Dashboard → Authentication → URL Configuration:
- Site URL: `https://your-vercel-app.vercel.app`
- Redirect URLs: `https://your-vercel-app.vercel.app/**`

---

## Appendix A — Package.json Dependencies Summary

```json
{
  "dependencies": {
    "next": "^14.0.0",
    "react": "^18.0.0",
    "react-dom": "^18.0.0",
    "typescript": "^5.0.0",
    "@supabase/supabase-js": "^2.0.0",
    "@supabase/ssr": "^0.9.0",
    "@google/generative-ai": "^0.24.0",
    "react-markdown": "^10.0.0",
    "remark-gfm": "^4.0.0",
    "jspdf": "^4.0.0",
    "html2canvas": "^1.4.0",
    "lucide-react": "^0.400.0",
    "tailwindcss": "^3.0.0",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.0.0",
    "tailwind-merge": "^2.0.0"
  }
}
```

---

## Appendix B — Key Business Rules

1. A project cannot generate documents until the completeness score meets the depth level threshold
2. Each conversation message is saved to the database in real-time
3. Documents can be regenerated at any time (creates a new version)
4. Users can only access their own projects (enforced by Supabase RLS)
5. Suggestion chips from AI are optional — user can always type a custom answer
6. The AI must never ask a question whose answer is already in the conversation history
7. Depth level can be changed before documents are generated, but not during conversation
8. Document selections can be changed at any time before generation

---

## 16. Keeping This Documentation Up to Date

Whenever you change the codebase (new features, refactors, dependency or API changes), check this document and update it so it stays accurate. Use this process each time:

### When to check
- After adding or removing routes, pages, or API endpoints
- After changing auth (Supabase client, middleware, env)
- After changing AI (model, env vars, prompts, or response shape)
- After changing the database schema or types
- After adding/removing UI components or export options
- After changing dependencies (package.json) or environment variables

### How to check and update

1. **Compare structure**  
   Walk through `app/`, `components/`, `lib/`, and `types/`. Ensure **Section 4 (Project Folder Structure)** matches. Add or remove files/folders and fix any path or comment that’s wrong.

2. **Compare behaviour**  
   For the areas you changed, open the matching section in this doc and diff against the code:
   - **Routes/pages** → Section 8 (Application Pages & Routes)
   - **Auth/middleware** → Section 7 (Authentication)
   - **Env vars** → Section 6 (Environment Variables)
   - **Database** → Section 5 (Database Schema)
   - **AI (Gemini, prompts, parsing)** → Section 10 (AI System)
   - **Document generation** → Section 11
   - **UI (components, export)** → Section 12
   - **Design (colors, Tailwind)** → Section 13

3. **Update code samples**  
   If the doc contains code blocks (e.g. middleware, `gemini.ts`, generator pseudocode), update them so they match the current implementation (signatures, env names, file paths).

4. **Update dependencies**  
   If you added/removed/upgraded packages, update **Appendix A** and **Section 14 (Step-by-Step Build Order)** install commands so a fresh setup still works.

5. **Bump version (optional)**  
   If the changes are substantial, update the document version in the footer (e.g. `1.0` → `1.1`).

Doing this after each significant change keeps the documentation reliable for onboarding and for AI-assisted editing.

---

*Document Version: 1.0 | Project: Clarispec*
