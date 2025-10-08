# Scratch Collaboration Server

A local WebSocket server that enables real-time collaboration on Scratch projects through the Scratch Collaboration Chrome extension.

## Features

- **Real-time collaboration**: Multiple users can work on the same Scratch project simultaneously
- **WebSocket communication**: Fast, bidirectional communication between clients
- **Session management**: Automatic handling of user join/leave events
- **Project synchronization**: Share project updates across all connected users
- **REST API**: Simple HTTP endpoints for monitoring and debugging

## Installation

1. Navigate to the server directory:
   ```bash
   cd server
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the server:
   ```bash
   npm start
   ```

4. For development with auto-restart:
   ```bash
   npm run dev
   ```

## Usage

The server will start on `http://localhost:3000` by default.

### WebSocket Events

#### Client → Server

- `join`: Join a collaboration session
  ```json
  {
    "type": "join",
    "projectId": "123456789",
    "userName": "Your Name"
  }
  ```

- `leave`: Leave a collaboration session
  ```json
  {
    "type": "leave",
    "projectId": "123456789"
  }
  ```

- `projectUpdate`: Send project changes to other users
  ```json
  {
    "type": "projectUpdate",
    "projectId": "123456789",
    "updateData": { /* project data */ }
  }
  ```

#### Server → Client

- `welcome`: Sent when client connects
  ```json
  {
    "type": "welcome",
    "clientId": "unique-client-id",
    "timestamp": 1234567890
  }
  ```

- `userJoined`: Sent when a new user joins
  ```json
  {
    "type": "userJoined",
    "userName": "New User",
    "clientId": "their-client-id",
    "participantCount": 3,
    "timestamp": 1234567890
  }
  ```

- `participantsList`: Sent to new users with current participant list
  ```json
  {
    "type": "participantsList",
    "participants": [
      {
        "clientId": "user1-id",
        "userName": "User 1",
        "joinedAt": 1234567890
      }
    ],
    "timestamp": 1234567890
  }
  ```

### REST API Endpoints

- `GET /health` - Server health check
- `GET /api/sessions` - List all active sessions
- `GET /api/sessions/:projectId` - Get details for a specific session

## Configuration

The server can be configured using environment variables:

- `PORT`: Server port (default: 3000)

## Architecture

- **Express.js**: HTTP server and REST API
- **WebSocket (ws)**: Real-time bidirectional communication
- **UUID**: Unique client identification
- **CORS**: Cross-origin resource sharing for web clients

## Development

The server includes:
- Automatic client session management
- Project-based collaboration rooms
- Participant tracking and notifications
- Graceful error handling and disconnections

## License

MIT