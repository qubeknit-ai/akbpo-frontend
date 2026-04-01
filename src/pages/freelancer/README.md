# Freelancer Integration Pages

This directory contains the React components for integrating with Freelancer.com through the browser extension.

## Pages Overview

### 1. FreelancerProjects.jsx
- **Purpose**: Browse and bid on available projects from Freelancer.com
- **Features**:
  - Search and filter projects
  - View project details (budget, description, skills)
  - Place bids directly from the interface
  - Sort by newest, budget, or bid count

### 2. FreelancerBids.jsx
- **Purpose**: Track submitted bids and their status
- **Features**:
  - View all bids with status (pending, accepted, rejected)
  - Filter bids by status
  - Retract pending bids
  - View project details for each bid

### 3. FreelancerMessages.jsx
- **Purpose**: Manage conversations with clients
- **Features**:
  - List all message threads
  - Real-time chat interface
  - Send and receive messages
  - Mobile-responsive design

### 4. FreelancerSettings.jsx
- **Purpose**: Configure Freelancer connection and automation
- **Features**:
  - Connection management (connect/disconnect)
  - Auto-bidding settings
  - Auto-reply configuration
  - Bid message templates

## Data Flow

1. **Extension → Backend**: Browser extension captures Freelancer.com credentials and sends them to the backend API
2. **Backend → Database**: Credentials are stored securely in the database
3. **Frontend → Backend**: React pages make API calls to fetch data using stored credentials
4. **Backend → Freelancer API**: Backend uses stored credentials to make authenticated requests to Freelancer.com

## API Endpoints

### Status & Connection
- `GET /api/freelancer/status` - Check connection status
- `DELETE /api/freelancer/disconnect` - Disconnect from Freelancer

### Projects
- `GET /api/freelancer/projects` - Get available projects with filters
- `GET /api/freelancer/projects/count` - Get project count
- `POST /api/freelancer/bid` - Place a bid on a project

### Messages
- `GET /api/freelancer/messages/threads` - Get message threads
- `GET /api/freelancer/messages/{thread_id}` - Get messages from thread
- `POST /api/freelancer/messages/send` - Send a message
- `GET /api/freelancer/messages/count` - Get message count

### Bids
- `GET /api/freelancer/bids` - Get user's bids with filters
- `GET /api/freelancer/bids/count` - Get bid count
- `DELETE /api/freelancer/bids/{bid_id}/retract` - Retract a bid

### Settings
- `GET /api/freelancer/settings` - Get automation settings
- `PUT /api/freelancer/settings` - Update automation settings

## Extension Integration

The pages are designed to work with the browser extension that:

1. **Captures Credentials**: Extracts OAuth tokens and session cookies from Freelancer.com
2. **Validates Access**: Confirms credentials work by making test API calls
3. **Syncs Data**: Sends credentials to the backend for storage and use
4. **Real-time Updates**: Can trigger data refreshes when extension detects changes

## Usage Instructions

1. **Install Extension**: Install the AK BPO browser extension
2. **Login to Freelancer**: Log into your Freelancer.com account
3. **Connect Extension**: Use the extension to capture and validate your credentials
4. **Access Frontend**: Navigate to the Freelancer section in the web app
5. **Manage Projects**: Browse projects, place bids, and manage messages

## Security Notes

- All credentials are stored securely in the database
- API calls use proper authentication headers
- Sensitive data is never exposed to the frontend
- Users can disconnect and remove credentials at any time

## Future Enhancements

- Real-time notifications for new messages
- Advanced bid automation with AI
- Project recommendation engine
- Analytics and reporting dashboard
- Multi-account support