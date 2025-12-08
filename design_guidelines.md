# Design Guidelines: Online Exam Platform

## Design Approach
**Selected System**: Material Design 3
**Justification**: Education platforms require clarity, strong information hierarchy, and robust form/data display patterns. Material Design excels at creating trustworthy, accessible interfaces for utility-focused applications with complex data structures.

## Typography System

**Font Family**: 
- Primary: 'Roboto' (Google Fonts CDN)
- Monospace: 'Roboto Mono' for question numbers, scores, IDs

**Type Scale**:
- Page Titles: text-4xl font-medium (Admin Dashboard, Student Dashboard)
- Section Headers: text-2xl font-medium (Subjects, Quizzes, Students)
- Card Titles: text-xl font-medium (Quiz names, Subject names)
- Body Text: text-base font-normal (Questions, descriptions, table content)
- Labels: text-sm font-medium (Form labels, table headers)
- Supporting Text: text-sm (Hints, timestamps, metadata)
- Question Text: text-lg font-normal (During exams, easy readability)

## Layout System

**Spacing Units**: Tailwind units of **4, 6, 8, 12** (e.g., p-4, gap-6, mb-8, py-12)
- Component padding: p-6
- Section spacing: mb-8 or mb-12
- Card spacing: space-y-4
- Form field gaps: gap-6

**Container Strategy**:
- Application shell: max-w-7xl mx-auto px-4
- Form containers: max-w-2xl
- Data tables: w-full within container
- Quiz interface: max-w-3xl mx-auto (focused reading)

**Grid Patterns**:
- Subject/Quiz cards: grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6
- Dashboard stats: grid-cols-2 md:grid-cols-4 gap-4
- Student list: Full-width table layout
- Question options: Single column stack (no grid for readability)

## Component Library

### Navigation
- **Admin Sidebar**: Fixed left sidebar (w-64) with navigation links, logo area at top, logout at bottom
- **Student Top Bar**: Horizontal navigation with branding left, user info/logout right, h-16

### Dashboard Components
- **Stat Cards**: Elevated surface (shadow-md), p-6, rounded-lg with large number display (text-4xl font-bold), label below (text-sm)
- **Entity Cards** (Subjects/Quizzes): shadow-sm, rounded-lg, p-6, hover:shadow-md transition, includes title, description, action buttons at bottom
- **Quick Actions**: Prominent button group at page top (Add Subject, Import Questions, etc.)

### Forms
- **Input Fields**: 
  - Full-width with labels above (font-medium mb-2)
  - Border style: border rounded-md p-3
  - Grouping: space-y-6 for form sections
- **Select Dropdowns**: Matching input style, custom arrow icon
- **File Upload**: Bordered dashed area with upload icon, drag-drop hint text
- **Radio Buttons** (Quiz answers): Large touch targets (p-4), full-width options with border, selected state clearly distinguished
- **Action Buttons**: Primary actions (Submit, Save) prominent, secondary (Cancel) adjacent with less emphasis

### Data Tables
- **Structure**: Full-width, bordered cells (border-b), hover:bg-gray-50 on rows
- **Headers**: Sticky top, font-medium, text-left, py-3 px-4
- **Cells**: py-3 px-4, vertical-align-top for multi-line content
- **Actions Column**: Right-aligned, icon buttons or small text links
- **Pagination**: Bottom-right if needed, simple prev/next with page numbers

### Quiz Interface
- **Question Display**: 
  - Prominent question number badge (top-left)
  - Question text in text-lg with generous line-height
  - Options as full-width cards (mb-3)
  - Progress indicator: "Question 5 of 20" (top-right)
- **Navigation**: Previous/Next buttons at bottom, Submit on final question
- **Timer Display** (if applicable): Fixed top-right corner with countdown

### Results Page
- **Score Header**: Large centered display with percentage (text-6xl), pass/fail indicator
- **Review Table**: 
  - Columns: Question #, Question Text, Your Answer, Correct Answer, Result (✓/✗)
  - Alternating row shading for readability
  - Expand/collapse for long questions

### Modals
- **Structure**: Centered overlay, max-w-md to max-w-2xl depending on content
- **Header**: Title with close icon button (top-right)
- **Actions**: Right-aligned button group at bottom

### Authentication Pages
- **Layout**: Centered card (max-w-md), elevated shadow-lg
- **Logo Area**: Top of card, centered
- **Form**: Single column, generous spacing (space-y-6)
- **Footer Links**: Text-center below form

## Accessibility Standards
- Minimum touch target: 44x44px for all interactive elements
- Form labels properly associated with inputs
- Error states with both visual indicators and text descriptions
- Focus indicators on all interactive elements (ring-2 ring-offset-2)
- ARIA labels for icon-only buttons
- Semantic HTML throughout (nav, main, aside, article)
- Sufficient contrast ratios for all text
- Keyboard navigation support for quiz progression

## Images
**No hero images required** - This is a functional web application, not a marketing site. Focus on UI clarity and data presentation.

## Animation
**Minimal animations only**:
- Smooth transitions on hover states (transition-all duration-200)
- Card shadow elevation changes (hover:shadow-md)
- Modal fade-in (no elaborate animations)
- Page transitions: None (instant navigation for utility)

## Key Principles
1. **Clarity over decoration**: Every element serves a functional purpose
2. **Consistent spacing**: Maintain rhythm with standardized spacing units
3. **Information hierarchy**: Size, weight, and spacing create clear visual priority
4. **Touch-friendly**: All interactive elements easily tappable on mobile
5. **Scannable tables**: Clear headers, alternating rows, aligned content
6. **Focused exam experience**: Minimal distractions during quiz-taking, large readable text