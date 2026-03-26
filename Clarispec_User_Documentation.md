# Clarispec — User & Product Documentation
## Non-Technical Guide: Features, Process & User Guide

This document describes Clarispec from a **product and user perspective**. It is intended for project managers, stakeholders, trainers, and anyone who uses or evaluates the application—without technical or implementation details.

---

## Table of Contents

1. [What is Clarispec?](#1-what-is-clarispec)
2. [Features](#2-features)
3. [Process Flow](#3-process-flow)
4. [User Guide](#4-user-guide)
5. [Depth Levels & Document Types](#5-depth-levels--document-types)
6. [Tips & Best Practices](#6-tips--best-practices)
7. [Keeping This Documentation Up to Date](#7-keeping-this-documentation-up-to-date)

---

## 1. What is Clarispec?

Clarispec is a **web application for project managers and freelancers** who need to gather client requirements and produce project documentation quickly. An AI assistant conducts a structured conversation with you (on behalf of the client), identifies gaps, and then generates professional documents such as Business Requirements Documents (BRD), User Stories, and Project Timelines.

### Who uses it?
- **Project managers** at software companies  
- **Freelance developers** doing discovery before development  
- **Tech leads and consultants** who scope projects  

### What problem does it solve?
| Without Clarispec | With Clarispec |
|-------------------|----------------|
| You need deep domain knowledge for each client industry | AI adapts to any industry |
| Easy to miss important questions | AI follows a structured framework and covers key areas |
| Writing documents takes days | AI generates drafts in minutes |
| Manual tracking of what’s been asked and answered | AI tracks requirement coverage and suggests next questions |

---

## 2. Features

### Account & access
- **Sign up** — Create an account with email, password, and optional company name.
- **Sign in / Sign out** — Secure access to your projects.
- **Settings** — Update your name, company name, and password.

### Projects
- **Create projects** — One project per client initiative. You enter project name, client name, industry, and an initial brief.
- **Dashboard** — See all projects with status (Gathering, Completed, Archived), requirement completeness, and number of documents.
- **Project overview** — Open a project to see its details, jump to the conversation (Gather) or to Documents.

### AI requirement gathering (Gather)
- **Brief analysis** — As soon as you create a project, the AI analyzes the brief and identifies industry, type of product, and gaps.
- **Structured conversation** — The AI asks one question at a time across fixed categories (goals, users, features, flows, integrations, platform, scale, privacy, etc.).
- **Suggestion chips** — For many questions, the AI offers clickable answer options (e.g. “Stripe”, “PayPal”, “Not decided yet”). You can click one or type your own.
- **Requirement completeness** — A score (0–100%) and a checklist show which areas are covered. The score must meet your chosen depth level before you can generate documents.
- **“Generate documents”** — When the score is high enough, you can trigger generation of all selected document types.

### Documents
- **Document list** — View all generated documents for a project (by type: BRD, SRS, User Stories, etc.).
- **Read & edit** — Open any document to read it. You can switch to edit mode, change the text, and save.
- **Regenerate** — Regenerate a single document or all documents to get a fresh AI draft.
- **Export** — Download a document as **PDF** or **Markdown** (.md).

### Configuration (per project)
- **Depth level** — Choose how deep the conversation goes: Quick Scan (50% minimum), Standard (70%), or Deep Dive (85%). This affects how many questions the AI asks and when you can generate.
- **Document selection** — When creating a project, choose which document types to generate (BRD, SRS, User Stories, Architecture, Workflow, MVP Scope, Feature List, Timeline). You can change this before generating.

---

## 3. Process Flow

### High-level flow

```
Sign up / Sign in
       ↓
Dashboard (list of projects)
       ↓
New Project → Enter project info + brief + depth + document types
       ↓
Gather → AI analyzes brief → Conversation (questions & answers) → Completeness score rises
       ↓
When score is high enough → “Generate documents”
       ↓
Documents list → Open, edit, regenerate, or export (PDF / Markdown)
```

### Step-by-step process

1. **Create an account** (or sign in).
2. **Create a new project**  
   - Project name (required), client name, industry.  
   - Write the **initial brief**: what the client wants to build (in their words; no need to be technical).  
   - Choose **depth level** (Quick / Standard / Deep Dive).  
   - Choose **which documents** to generate (all eight types are available).
3. **Gather requirements**  
   - You are taken to the conversation (Gather) screen.  
   - The AI welcomes you and asks the first question.  
   - Answer by typing or by clicking a suggestion chip.  
   - The AI acknowledges your answer and asks the next question.  
   - The left panel shows the **completeness score** and which **requirement areas** are covered.  
   - Continue until the score meets the minimum for your depth level (or you are satisfied).
4. **Generate documents**  
   - Click **“I’m satisfied, generate documents”** (or equivalent).  
   - Wait while each selected document is generated.  
   - You are then taken to the **Documents** list.
5. **Use the documents**  
   - Open any document to read it.  
   - Edit if needed and save.  
   - Export as PDF or Markdown.  
   - Use **Regenerate** if you want a new AI draft (e.g. after more conversation or changes).

---

## 4. User Guide

### 4.1 Signing up and signing in
- Go to the **Sign up** page. Enter full name, email, password, and optionally company name.  
- After signup you are taken to the **Dashboard**.  
- Next time, use **Sign in** with the same email and password.  
- Use **Sign out** (e.g. in the sidebar) when you are done.

### 4.2 Dashboard
- The **Dashboard** shows a welcome message and all your projects.  
- You see **stats** such as total projects, in progress, completed, and documents generated.  
- Each **project card** shows: project name, client name, industry, status (Gathering / Completed / Archived), requirement completeness bar, number of documents, and date.  
- Use **“New Project”** to create a project. Use **“Open Project”** to go into a project.

### 4.3 Creating a new project
- **Step 1 — Project info**  
  - Project name (required).  
  - Client name (optional).  
  - Client industry: choose from the list (e.g. E-commerce, Healthcare, Fintech, Education, Other).
- **Step 2 — Initial brief**  
  - Describe what the client wants to build. Write as the client would (plain language).  
  - A minimum length may be required (e.g. 50 characters).
- **Step 3 — Configuration**  
  - **Depth level**: Quick Scan (faster, fewer questions), Standard, or Deep Dive (most thorough).  
  - **Documents**: Turn on or off each document type you want generated (BRD, SRS, User Stories, etc.).  
- Submit. You are taken to the **Gather** (conversation) screen.

### 4.4 Gather (AI conversation)
- **Left panel**  
  - Project name and client.  
  - **Completeness score** (circular progress 0–100%).  
  - **Requirement areas** checklist (which topics are covered).  
  - **Depth level** badge.  
  - **“Generate documents”** button — enabled only when the score meets the minimum for your depth.
- **Right panel**  
  - **Chat**: AI messages and your replies. Messages scroll automatically.  
  - **Suggestion chips**: Click an option to send it as your answer, or type your own.  
  - **Input box**: Type and send your answer.  
- The AI asks **one question at a time**, acknowledges your answer, then asks the next.  
- When the score is high enough and you are satisfied, click **“Generate documents”**.  
- Generation may take a short while; you are then taken to the **Documents** list.

### 4.5 Documents list
- You see **cards** for each generated document type (only the types you selected).  
- Each card shows: **title**, **type** (e.g. BRD, SRS), **generated date**, and **word count** (if shown).  
- Actions: **Open** to view, **Regenerate** to create a new version, **Export** (if available from the list).  
- Use **“Export all”** if the product offers it.

### 4.6 Single document view
- **Read** the document (formatted text, headings, lists, tables).  
- **Edit**: Switch to edit mode, change the text, then **Save**.  
- **Export**: Choose **PDF** or **Markdown** to download.  
- **Regenerate**: Ask the AI to generate this document again (useful after more gathering or changes).  
- Use **breadcrumbs** or **Back** to return to the documents list or project.

### 4.7 Project overview
- From the project overview page you can see **project details**, a short **summary** of what was gathered, and **links** to **Gather** and **Documents**.  
- You may be able to **edit project settings** (name, client, industry, etc.) from here.

### 4.8 Settings
- **Settings** (e.g. from the sidebar) lets you:  
  - Update **full name** and **company name**.  
  - **Change password**.

---

## 5. Depth Levels & Document Types

### Depth levels
| Level | When to use it | Minimum score to generate | What the AI does |
|-------|----------------|---------------------------|------------------|
| **Quick Scan** | Fast, high-level scope | 50% | Fewer questions; core features, users, platform. |
| **Standard** | Most projects | 70% | Covers all main requirement areas. |
| **Deep Dive** | Complex or critical projects | 85% | All areas plus follow-ups and edge cases. |

The **minimum score** is the requirement completeness percentage you must reach before the **“Generate documents”** button becomes available.

### Document types you can generate
| Document | What it contains |
|---------|-------------------|
| **Business Requirements Document (BRD)** | Business goals, stakeholders, scope, success metrics. |
| **Software Requirements Specification (SRS)** | Functional and non-functional requirements in detail. |
| **User Stories** | “As a [user], I want [feature] so that [reason]” with acceptance criteria. |
| **Software Architecture Overview** | High-level system design, main components, suggested tech stack. |
| **Workflow Document** | Step-by-step process flows for key features. |
| **MVP Scope Document** | What is in Phase 1 vs. later; core vs. future features. |
| **Feature List (MoSCoW)** | Must have / Should have / Could have / Won’t have. |
| **Project Timeline Estimate** | Phases, milestones, rough time estimates. |

You choose which of these to generate when you create the project (and you can change the selection before generating).

---

## 6. Tips & Best Practices

- **Write the brief in the client’s words** — Don’t over-technicalize; the AI can work with plain language.  
- **Use suggestion chips when they fit** — They speed up the conversation; you can always type a custom answer.  
- **Answer one question at a time** — The AI is designed for one focused answer per turn.  
- **Check the requirement areas** — Use the left panel to see what’s already covered and what might still be missing.  
- **Choose the right depth** — Use Quick for light scoping, Standard for most projects, Deep Dive when the project is complex or high-stakes.  
- **Review and edit documents** — Treat AI output as a draft; edit and save before sharing with clients or dev teams.  
- **Export when ready** — Use PDF for sharing, Markdown if you need to edit in another tool.

---

## 7. Keeping This Documentation Up to Date

This document should reflect **how users experience Clarispec**: features, flows, and steps. When the product changes, update this guide so that training, support, and evaluation stay accurate.

### When to check
- **New or removed features** (e.g. new document type, new export format, new screen).  
- **Changes to the user flow** (e.g. new step in project creation, different path to documents).  
- **Changes to wording or behaviour** (e.g. button labels, when “Generate documents” is enabled, depth thresholds).  
- **Changes to account or settings** (e.g. new profile fields, new settings options).  
- **Product or policy changes** (e.g. which documents are default, minimum score rules).

### How to check and update

1. **Run through the product**  
   Sign in, create a test project, go through Gather, generate documents, and use export/settings. Note any difference from what this document describes.

2. **Update the matching section**  
   - **Features** → Section 2: add, remove, or reword feature bullets so they match the current product.  
   - **Process flow** → Section 3: adjust the high-level flow and step-by-step process if the journey has changed.  
   - **User guide** → Section 4: update the subsection for the changed screen or action (e.g. 4.4 Gather, 4.5 Documents list, 4.6 Export).  
   - **Depth levels & document types** → Section 5: update tables if thresholds, document types, or descriptions change.  
   - **Tips** → Section 6: add or change tips if new behaviour or best practices emerge.

3. **Keep screens and flows consistent**  
   If you add screenshots or diagrams elsewhere, ensure they still match the updated text (e.g. button names, steps).

4. **Version the document (optional)**  
   For large or formal updates, note the date or version at the bottom (e.g. “Last updated: March 2025” or “v1.1”) so readers know how current the guide is.

Doing this whenever the product or UX changes keeps this documentation reliable for users, trainers, and stakeholders.

---

*Clarispec User Documentation | Non-technical product guide*
