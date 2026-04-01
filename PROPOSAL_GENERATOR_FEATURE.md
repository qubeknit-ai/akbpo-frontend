# Proposal Generator Feature

## Overview
This feature allows users to generate custom proposals directly from the Proposals page without needing to select an existing project first.

## How It Works

### 1. Accessing the Generator
- Navigate to the Proposals page without selecting a project
- A modal will automatically appear prompting you to enter a job description
- Alternatively, you can access it when no lead is stored in localStorage

### 2. Generating a Proposal
1. Enter or paste the job description in the text area
2. Click "Generate Proposal"
3. The system sends the job description to the N8N webhook
4. AI generates a custom proposal based on the description
5. The generated proposal appears in the editor

### 3. Using the Generated Proposal
- Once generated, the proposal appears in the main editor
- You can edit the proposal as needed
- Click "Copy Proposal" to copy it to your clipboard
- The Save and Approve/Bid buttons are hidden for generated proposals

## Technical Details

### Backend API Endpoint
- **Endpoint**: `/api/proposal/generate`
- **Method**: POST
- **Authentication**: Required (Bearer token)
- **Request Headers**:
  ```json
  {
    "Content-Type": "application/json",
    "Authorization": "Bearer <token>"
  }
  ```
- **Request Body**:
  ```json
  {
    "job_description": "string"
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "proposal": "string"
  }
  ```

### N8N Webhook Integration
The backend proxies the request to N8N with additional user context:
- **Webhook URL**: Configured in backend `.env` as `PROPOSAL_GENERATOR_WEBHOOK_URL`
- **Default**: `https://n8n.srv1128153.hstgr.cloud/webhook-test/proposal-genrator`
- **Payload sent to N8N**:
  ```json
  {
    "user_id": 123,
    "user_email": "user@example.com",
    "job_description": "string"
  }
  ```
- **Expected Response from N8N**:
  ```json
  {
    "proposal": "string"
  }
  ```
  *Note: Also accepts `generated_proposal` or `message` fields*

### Environment Variables

**Backend** (`backend/.env`):
```env
PROPOSAL_GENERATOR_WEBHOOK_URL=https://n8n.srv1128153.hstgr.cloud/webhook-test/proposal-genrator
N8N_WEBHOOK_API_KEY=your_api_key_here
```

**Frontend** (`frontend/.env`):
```env
VITE_API_URL=http://localhost:8000
```

### Components
- **ProposalGeneratorModal**: Modal component for inputting job description
- **Proposals.jsx**: Updated to handle generated proposals and show appropriate buttons

### State Management
- `isGeneratedProposal`: Boolean flag to track if the current proposal was generated
- `showProposalGenerator`: Controls modal visibility
- When a proposal is generated, the Copy button replaces Save/Approve buttons

## User Flow

```
No Lead Selected
    ↓
Modal Opens Automatically
    ↓
User Enters Job Description
    ↓
Click "Generate Proposal"
    ↓
Loading State (AI Processing)
    ↓
Proposal Generated & Displayed
    ↓
User Can Edit & Copy
```

## Features
- ✅ Automatic modal display when no lead is selected
- ✅ Real-time generation status feedback
- ✅ Error handling with retry option
- ✅ Success confirmation
- ✅ Copy to clipboard functionality
- ✅ Dark mode support
- ✅ Responsive design

## Notes
- Generated proposals are not automatically saved to the database
- Users must manually copy and use the proposal
- The modal can be closed to return to the projects page
- No lead data is required for proposal generation
