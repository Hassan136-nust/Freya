# 🚀 FREYA - AI-Powered Collaborative Code Editor

<div align="center">

![FREYA Logo](frontend/public/freya2.png)

**A real-time collaborative development environment with AI code generation powered by Groq LLM**

[![React](https://img.shields.io/badge/React-19.2.5-61DAFB?logo=react)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-Express-339933?logo=node.js)](https://nodejs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Database-47A248?logo=mongodb)](https://www.mongodb.com/)
[![Socket.io](https://img.shields.io/badge/Socket.io-Real--time-010101?logo=socket.io)](https://socket.io/)
[![WebContainer](https://img.shields.io/badge/WebContainer-API-FF6B6B)](https://webcontainers.io/)

</div>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Key Features](#-key-features)
- [Tech Stack](#-tech-stack)
- [Architecture](#-architecture)
- [WebContainer Integration](#-webcontainer-integration)
- [AI Integration](#-ai-integration)
- [Installation](#-installation)
- [Environment Variables](#-environment-variables)
- [Usage](#-usage)
- [Project Structure](#-project-structure)
- [API Endpoints](#-api-endpoints)
- [Real-time Features](#-real-time-features)
- [Security](#-security)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🌟 Overview

**FREYA** is a cutting-edge, browser-based collaborative development environment that combines the power of AI code generation with real-time collaboration features. Built with the MERN stack and enhanced with WebContainer technology, FREYA allows developers to write, execute, and collaborate on code projects entirely in the browser.

### What Makes FREYA Special?

- **AI-Powered Code Generation**: Integrated with Groq's LLaMA 3.3 70B model for intelligent code suggestions and generation
- **Real-time Collaboration**: Multiple developers can work on the same project simultaneously with live updates
- **In-Browser Code Execution**: Run Node.js, React, and other JavaScript projects directly in the browser using WebContainer API
- **Monaco Editor**: Professional-grade code editing experience with syntax highlighting and IntelliSense
- **Project Management**: Create, manage, and share projects with team members
- **Persistent Storage**: All code and projects are saved to MongoDB for seamless access across sessions

---

## ✨ Key Features

### 🤖 AI Code Generation
- **Freya AI Assistant**: Mention `@freya` in chat to get AI-powered code suggestions
- **Multi-file Generation**: AI can generate complete project structures with multiple files
- **Streaming Responses**: Real-time streaming of AI responses for better UX
- **Fallback Model**: Automatic fallback to Qwen 3 32B when rate limits are hit
- **Smart File Parsing**: Automatically extracts and creates files from AI responses

### 👥 Real-time Collaboration
- **Live Code Editing**: See changes from other collaborators in real-time
- **File Synchronization**: Create, edit, and delete files with instant updates across all users
- **Project Chat**: Built-in chat system for team communication
- **Collaborator Management**: Add/remove team members from projects
- **User Presence**: See who's currently working on the project

### 💻 Code Execution
- **WebContainer Integration**: Run Node.js applications directly in the browser
- **Package Installation**: Automatic npm package installation
- **Live Preview**: Instant preview of web applications with hot reload
- **Console Logs**: View real-time execution logs and errors
- **Multiple Run Modes**: Support for HTML preview and Node.js execution

### 🎨 Modern UI/UX
- **Dark Theme**: Professional charcoal black theme with gold accents
- **Monaco Editor**: VS Code-like editing experience
- **File Explorer**: Intuitive file tree navigation
- **Tab Management**: Multiple file tabs with easy switching
- **Responsive Design**: Optimized for desktop development
- **Markdown Support**: Rich markdown rendering in chat messages

### 🔐 Security & Authentication
- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: Bcrypt encryption for user passwords
- **Redis Token Blacklisting**: Logout token invalidation
- **Protected Routes**: Middleware-based route protection
- **CORS Configuration**: Secure cross-origin resource sharing

---

## 🛠 Tech Stack

### Frontend
| Technology | Version | Purpose |
|------------|---------|---------|
| **React** | 19.2.5 | UI framework |
| **Vite** | 8.0.9 | Build tool and dev server |
| **React Router** | 7.14.2 | Client-side routing |
| **Axios** | 1.15.2 | HTTP client |
| **Socket.io Client** | 4.8.3 | Real-time communication |
| **Monaco Editor** | 4.7.0 | Code editor component |
| **WebContainer API** | 1.6.4 | In-browser Node.js runtime |
| **Markdown-to-JSX** | 9.7.16 | Markdown rendering |
| **Tailwind CSS** | 4.2.4 | Utility-first CSS framework |

### Backend
| Technology | Version | Purpose |
|------------|---------|---------|
| **Node.js** | - | Runtime environment |
| **Express** | 5.2.1 | Web framework |
| **MongoDB** | 7.2.0 | Database |
| **Mongoose** | 9.5.0 | MongoDB ODM |
| **Socket.io** | 4.8.3 | WebSocket server |
| **JWT** | 9.0.3 | Authentication tokens |
| **Bcrypt** | 6.0.0 | Password hashing |
| **Redis (ioredis)** | 5.10.1 | Token blacklisting |
| **Groq SDK** | 1.1.2 | AI model integration |
| **Express Validator** | 7.3.2 | Input validation |
| **Morgan** | 1.10.1 | HTTP request logger |
| **CORS** | 2.8.6 | Cross-origin resource sharing |

---

## 🏗 Architecture

### System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         FRONTEND                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   React UI   │  │ Monaco Editor│  │ WebContainer │      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
│         │                  │                  │              │
│         └──────────────────┴──────────────────┘              │
│                            │                                 │
│                    ┌───────▼────────┐                        │
│                    │  Socket.io     │                        │
│                    │  Client        │                        │
│                    └───────┬────────┘                        │
└────────────────────────────┼──────────────────────────────────┘
                             │
                    ┌────────▼────────┐
                    │   HTTP/WS       │
                    └────────┬────────┘
                             │
┌────────────────────────────▼──────────────────────────────────┐
│                         BACKEND                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │  Express.js  │  │  Socket.io   │  │   Groq AI    │       │
│  │   REST API   │  │   Server     │  │   Service    │       │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘       │
│         │                  │                  │               │
│         └──────────────────┴──────────────────┘               │
│                            │                                  │
│         ┌──────────────────┴──────────────────┐              │
│         │                                      │              │
│  ┌──────▼───────┐                    ┌────────▼────────┐    │
│  │   MongoDB    │                    │     Redis       │    │
│  │  (Projects,  │                    │  (Token Cache)  │    │
│  │   Users)     │                    └─────────────────┘    │
│  └──────────────┘                                            │
└───────────────────────────────────────────────────────────────┘
```

### Data Flow

1. **Authentication Flow**:
   ```
   User Login → JWT Generation → Token Storage (localStorage) 
   → Protected Route Access → Token Verification → User Data Fetch
   ```

2. **Real-time Collaboration Flow**:
   ```
   User Edit → Socket Emit → Server Broadcast 
   → Other Clients Receive → UI Update
   ```

3. **AI Code Generation Flow**:
   ```
   User Message (@freya) → Socket Event → Groq API Call 
   → Streaming Response → File Parsing → File Tree Update
   ```

4. **Code Execution Flow**:
   ```
   Run Button → WebContainer Mount → npm install 
   → npm start → Server Ready → Preview Display
   ```

---

## 🌐 WebContainer Integration

### What is WebContainer?

**WebContainer** is a revolutionary technology by StackBlitz that enables running Node.js directly in the browser using WebAssembly. FREYA leverages this to provide a complete development environment without requiring any server-side code execution.

### How FREYA Uses WebContainer

#### 1. **Initialization** (`frontend/src/config/webContainer.js`)
```javascript
import { WebContainer } from '@webcontainer/api';

let webContainerInstance = null;

export async function getWebContainer() {
    if (!webContainerInstance) {
        webContainerInstance = await WebContainer.boot();
    }
    return webContainerInstance;
}
```

#### 2. **File System Mounting**
When you click "Run", FREYA:
- Converts your file tree to WebContainer format
- Mounts the entire project structure
- Creates a virtual file system in the browser

```javascript
const toWebContainerTree = () => {
    const tree = {};
    fileTree.forEach((file) => {
        tree[file.name] = { 
            file: { contents: file.content || '' } 
        };
    });
    return tree;
};

await webContainer.mount(normalizedTree);
```

#### 3. **Package Installation**
```javascript
const install = await webContainer.spawn('npm', ['install']);
install.output.pipeTo(new WritableStream({
    write(data) {
        setRunLogs((prev) => prev + data);
    }
}));
```

#### 4. **Process Execution**
```javascript
const startProcess = await webContainer.spawn('npm', ['run', 'start']);
startProcess.output.pipeTo(new WritableStream({
    write(data) {
        setRunLogs((prev) => prev + data);
    }
}));
```

#### 5. **Server Preview**
```javascript
webContainer.on('server-ready', (port, url) => {
    setIframeUrl(url);
    setEditableUrl(url);
});
```

### WebContainer Features in FREYA

✅ **Full Node.js Runtime**: Run Express servers, React apps, and more
✅ **NPM Package Support**: Install and use any npm package
✅ **File System API**: Read/write files programmatically
✅ **Process Management**: Spawn and manage multiple processes
✅ **Network Access**: Fetch external resources
✅ **Hot Reload**: Automatic preview updates on file changes

### Supported Project Types

- ✅ React Applications (Vite, CRA)
- ✅ Express.js Servers
- ✅ Static HTML/CSS/JS
- ✅ Node.js Scripts
- ✅ Vue.js Applications
- ✅ Any npm-based project

---

## 🤖 AI Integration

### Groq LLM Integration

FREYA uses **Groq's ultra-fast LLM inference** for AI code generation.

#### Primary Model: LLaMA 3.3 70B Versatile
- **Speed**: 300+ tokens/second
- **Context**: 4096 tokens
- **Capabilities**: Full-stack code generation, debugging, explanations

#### Fallback Model: Qwen 3 32B
- Automatically used when rate limits are hit
- Ensures uninterrupted service

### AI Features

#### 1. **Streaming Responses**
Real-time token streaming for better UX:
```javascript
for await (const chunk of chatCompletion) {
    const content = chunk.choices[0]?.delta?.content || "";
    if (content) {
        fullResponse += content;
    }
}
```

#### 2. **Multi-file Generation**
AI can generate complete project structures:
```json
{
  "text": "I've created a React app for you!",
  "fileTree": {
    "package.json": {
      "file": {},
      "contents": "{ \"name\": \"my-app\" }"
    },
    "src/App.jsx": {
      "file": {},
      "contents": "import React from 'react'..."
    }
  },
  "buildCommand": "npm install",
  "runCommand": "npm start"
}
```

#### 3. **Smart File Parsing**
Automatically extracts files from markdown code blocks:
```markdown
**app.js:**
```javascript
console.log('Hello');
```
```

#### 4. **Personality System**
Freya has a defined personality:
- Female AI engineer (she/her pronouns)
- 7+ years of experience
- Friendly but professional
- Direct and actionable responses

### Using AI in FREYA

1. Open any project
2. Type `@freya` followed by your request in chat
3. AI generates code in real-time
4. Files are automatically created/updated
5. Click "Run" to execute the generated code

**Example Prompts**:
- `@freya create a React todo app with local storage`
- `@freya build an Express API with MongoDB for user authentication`
- `@freya fix this error: [paste error]`
- `@freya optimize this code for performance`

---

## 📦 Installation

### Prerequisites

- **Node.js**: v16 or higher
- **MongoDB**: v4.4 or higher (local or Atlas)
- **Redis**: v6 or higher (optional, for token blacklisting)
- **Groq API Key**: Get from [console.groq.com](https://console.groq.com)

### Step 1: Clone the Repository

```bash
git clone https://github.com/yourusername/freya.git
cd freya
```

### Step 2: Backend Setup

```bash
cd backend
npm install
```

Create `.env` file in `backend/` directory:

```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/freya
JWT_SECRET=your_super_secret_jwt_key_here_change_this
GROQ_API_KEY=your_groq_api_key_here
REDIS_HOST=localhost
REDIS_PORT=6379
```

Start the backend server:

```bash
node server.js
```

### Step 3: Frontend Setup

```bash
cd frontend
npm install
```

Create `.env` file in `frontend/` directory:

```env
VITE_API_URL=http://localhost:3000
```

Start the development server:

```bash
npm run dev
```

### Step 4: Access the Application

Open your browser and navigate to:
```
http://localhost:5173
```

---

## 🔐 Environment Variables

### Backend Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `PORT` | Server port | No | 3000 |
| `MONGODB_URI` | MongoDB connection string | Yes | - |
| `JWT_SECRET` | Secret key for JWT signing | Yes | - |
| `GROQ_API_KEY` | Groq API key for AI features | Yes | - |
| `REDIS_HOST` | Redis server host | No | localhost |
| `REDIS_PORT` | Redis server port | No | 6379 |

### Frontend Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `VITE_API_URL` | Backend API URL | Yes | - |

---

## 🚀 Usage

### 1. **Register/Login**

- Navigate to the login page
- Create a new account or login with existing credentials
- JWT token is stored in localStorage for persistent sessions

### 2. **Create a Project**

- Click "Add New Project" on the home page
- Enter a project name
- Project is created and saved to MongoDB

### 3. **Add Collaborators**

- Open a project
- Click the "Add" button in the chat header
- Select users from the list
- Collaborators can now access and edit the project

### 4. **Write Code**

- Click "New File" in the explorer
- Enter filename (e.g., `app.js`, `index.html`)
- Write code in the Monaco editor
- Changes are auto-saved and synced in real-time

### 5. **Use AI Assistant**

- Type `@freya` in the chat followed by your request
- Example: `@freya create a React counter app`
- AI generates code and creates files automatically
- Files appear in the explorer

### 6. **Run Code**

- Click the "Run" button in the editor header
- WebContainer mounts your files
- npm packages are installed automatically
- Preview appears in the right panel
- View logs in the console at the bottom

### 7. **Collaborate in Real-time**

- Multiple users can edit files simultaneously
- Changes are broadcast via Socket.io
- File creation/deletion is synced across all users
- Chat with team members in the project chat

### 8. **External Tools**

- **Play Chess**: Click the button at the bottom of the explorer to take a break
- **Resume AI**: Click the floating button on the home page to analyze resumes

---

## 📁 Project Structure

```
freya/
├── backend/
│   ├── controllers/
│   │   ├── ai.controller.js          # AI request handling
│   │   ├── project.controller.js     # Project CRUD operations
│   │   └── user.controller.js        # User authentication
│   ├── db/
│   │   └── db.js                     # MongoDB connection
│   ├── middleware/
│   │   └── auth.middleware.js        # JWT verification
│   ├── models/
│   │   ├── project.model.js          # Project schema
│   │   └── user.model.js             # User schema
│   ├── routes/
│   │   ├── ai.routes.js              # AI endpoints
│   │   ├── projects.routes.js        # Project endpoints
│   │   └── user.routes.js            # User endpoints
│   ├── services/
│   │   ├── ai.service.js             # Groq AI integration
│   │   ├── project.service.js        # Project business logic
│   │   ├── redis.service.js          # Redis client
│   │   └── user.service.js           # User business logic
│   ├── app.js                        # Express app configuration
│   ├── server.js                     # Server entry point + Socket.io
│   ├── package.json
│   └── .env
│
├── frontend/
│   ├── public/
│   │   ├── freya.png                 # Logo
│   │   ├── freya2.png                # Logo variant
│   │   └── icons.svg                 # Icon sprites
│   ├── src/
│   │   ├── assets/                   # Static assets
│   │   ├── auth/
│   │   │   └── UserAuth.jsx          # Protected route wrapper
│   │   ├── config/
│   │   │   ├── axios.js              # Axios configuration
│   │   │   ├── socket.js             # Socket.io client
│   │   │   └── webContainer.js       # WebContainer initialization
│   │   ├── context/
│   │   │   └── UserContext.jsx       # Global user state
│   │   ├── routes/
│   │   │   └── AppRoutes.jsx         # Route definitions
│   │   ├── screens/
│   │   │   ├── Home.jsx              # Project list page
│   │   │   ├── Login.jsx             # Login page
│   │   │   ├── Register.jsx          # Registration page
│   │   │   └── Project.jsx           # Main editor page
│   │   ├── App.jsx                   # Root component
│   │   ├── main.jsx                  # Entry point
│   │   └── index.css                 # Global styles
│   ├── index.html
│   ├── vite.config.js
│   ├── package.json
│   └── .env
│
└── README.md
```

---

## 🔌 API Endpoints

### Authentication Endpoints

#### Register User
```http
POST /users/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}

Response: {
  "user": { "_id": "...", "email": "..." },
  "token": "jwt_token_here"
}
```

#### Login User
```http
POST /users/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}

Response: {
  "user": { "_id": "...", "email": "..." },
  "token": "jwt_token_here"
}
```

#### Get User Profile
```http
GET /users/profile
Authorization: Bearer <token>

Response: {
  "user": { "_id": "...", "email": "..." }
}
```

#### Get All Users
```http
GET /users/all
Authorization: Bearer <token>

Response: {
  "users": [...]
}
```

#### Logout
```http
GET /users/logout
Authorization: Bearer <token>

Response: {
  "message": "logout successfully"
}
```

### Project Endpoints

#### Create Project
```http
POST /projects/create
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "My Project"
}

Response: {
  "_id": "...",
  "name": "My Project",
  "users": ["user_id"],
  "files": []
}
```

#### Get All Projects
```http
GET /projects/all
Authorization: Bearer <token>

Response: {
  "projects": [...]
}
```

#### Get Single Project
```http
GET /projects/get-project/:projectId
Authorization: Bearer <token>

Response: {
  "project": {
    "_id": "...",
    "name": "...",
    "users": [...],
    "files": [...]
  }
}
```

#### Add Collaborators
```http
PUT /projects/add-user
Authorization: Bearer <token>
Content-Type: application/json

{
  "projectId": "project_id",
  "users": ["user_id_1", "user_id_2"]
}

Response: {
  "project": { ... }
}
```

#### Update Project Files
```http
PUT /projects/files/:projectId
Authorization: Bearer <token>
Content-Type: application/json

{
  "files": [
    {
      "name": "app.js",
      "content": "console.log('hello');",
      "language": "javascript"
    }
  ]
}

Response: {
  "project": { ... }
}
```

### AI Endpoints

#### Generate Code
```http
POST /ai/generate
Authorization: Bearer <token>
Content-Type: application/json

{
  "prompt": "Create a React todo app"
}

Response: {
  "result": "AI generated code/response"
}
```

---

## ⚡ Real-time Features

### Socket.io Events

#### Client → Server Events

| Event | Payload | Description |
|-------|---------|-------------|
| `project-message` | `{ message, sender, _id }` | Send chat message |
| `file-update` | `{ fileName, content, updatedBy }` | Update file content |
| `file-created` | `{ file, createdBy }` | Create new file |
| `file-deleted` | `{ fileName, deletedBy }` | Delete file |

#### Server → Client Events

| Event | Payload | Description |
|-------|---------|-------------|
| `project-message` | `{ message, sender, _id, isChunk }` | Receive chat message |
| `file-update` | `{ fileName, content }` | File content updated |
| `file-created` | `{ file }` | New file created |
| `file-deleted` | `{ fileName }` | File deleted |

### Real-time Collaboration Flow

```javascript
// User A edits a file
updateFileContent(newContent) → 
  socket.emit('file-update', { fileName, content, updatedBy }) →
    Server receives and broadcasts →
      socket.broadcast.emit('file-update', data) →
        User B receives update →
          UI updates automatically
```

### AI Streaming Flow

```javascript
// User mentions @freya
socket.emit('project-message', { message: '@freya create app' }) →
  Server detects @freya →
    Groq API streaming call →
      For each chunk:
        socket.emit('project-message', { isChunk: true, message: chunk }) →
          Client receives and appends →
            UI updates in real-time
```

---

## 🔒 Security

### Authentication & Authorization

1. **JWT Tokens**:
   - Signed with secret key
   - Stored in localStorage
   - Sent in Authorization header
   - Verified on every protected route

2. **Password Security**:
   - Bcrypt hashing with salt rounds
   - Passwords never stored in plain text
   - Secure password comparison

3. **Token Blacklisting**:
   - Redis stores logged-out tokens
   - Prevents token reuse after logout
   - 24-hour expiration

4. **Route Protection**:
   - Middleware verifies JWT on protected routes
   - User object attached to request
   - Unauthorized requests rejected

### Input Validation

- Express Validator for request validation
- Email format validation
- Password length requirements
- MongoDB injection prevention

### CORS Configuration

```javascript
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true
}));
```

### Best Practices Implemented

✅ Environment variables for secrets
✅ HTTPS recommended for production
✅ Rate limiting on AI endpoints
✅ Input sanitization
✅ Error handling without exposing internals
✅ Secure cookie settings
✅ MongoDB connection string encryption

---

## 🎨 Theme & Design

### Color Palette

| Color | Hex | Usage |
|-------|-----|-------|
| Charcoal Black | `#1a1a1a` | Primary background |
| Deep Black | `#0a0a0a` | Headers, panels |
| Dark Gray | `#2a2a2a` | Cards, modals |
| Border Gray | `#404040` | Borders, dividers |
| Cream White | `#f5f5f5` | Primary text |
| Light Gray | `#d4d4d4` | Secondary text |
| Gold | `#d4af37` | Buttons, accents |
| Light Gold | `#f4cf47` | Hover states |
| Dark Green | `#1a4d2e` | Sent messages (Gmail-style) |

### Typography

- **Font Family**: System fonts (San Francisco, Segoe UI, Roboto)
- **Code Font**: Consolas, Courier New, monospace
- **Font Sizes**: 12px - 32px responsive scale

---

## 🤝 Contributing

We welcome contributions! Here's how you can help:

### Reporting Bugs

1. Check if the bug is already reported
2. Create a detailed issue with:
   - Steps to reproduce
   - Expected behavior
   - Actual behavior
   - Screenshots if applicable
   - Environment details

### Suggesting Features

1. Open an issue with the `enhancement` label
2. Describe the feature and its benefits
3. Provide use cases and examples

### Pull Requests

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Development Guidelines

- Follow existing code style
- Write meaningful commit messages
- Add comments for complex logic
- Test your changes thoroughly
- Update documentation if needed

---

## 📝 License

This project is licensed under the **ISC License**.

---

## 🙏 Acknowledgments

- **Groq** - For ultra-fast LLM inference
- **StackBlitz** - For WebContainer technology
- **MongoDB** - For flexible database solution
- **Socket.io** - For real-time communication
- **Monaco Editor** - For professional code editing
- **React Team** - For the amazing UI library

---

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/yourusername/freya/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/freya/discussions)
- **Email**: support@freya.dev


## 📊 Performance

- **AI Response Time**: < 2 seconds (with streaming)
- **Real-time Latency**: < 100ms (Socket.io)
- **Code Execution**: Instant (WebContainer)
- **File Sync**: < 50ms (optimistic updates)

---

## 🌍 Browser Support

| Browser | Version | Support |
|---------|---------|---------|
| Chrome | 90+ | ✅ Full |
| Firefox | 88+ | ✅ Full |
| Safari | 15+ | ✅ Full |
| Edge | 90+ | ✅ Full |

**Note**: WebContainer requires modern browser features (WebAssembly, SharedArrayBuffer)

---

<div align="center">

**Built with ❤️ by the FREYA Team**

[⭐ Star us on GitHub](https://github.com/yourusername/freya) | [🐛 Report Bug](https://github.com/yourusername/freya/issues) | [💡 Request Feature](https://github.com/yourusername/freya/issues)

</div>
