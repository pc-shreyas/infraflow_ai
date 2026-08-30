# Spec Driven Development Specification: InfraFlow_AI

## Executive Summary & System Intent
**InfraFlow_AI** is an Agentic AI DevOps & Cloud Infrastructure Automation Platform designed for Site Reliability Engineers (SREs), DevOps engineers, and operators. Users specify complex cloud infrastructure, container deployments, and CI/CD pipelines in plain English. The platform converts natural language prompts into executable infrastructure-as-code (IaC) visual workflows, renders them on a drag-and-drop canvas, and executes them through a specialized 5-agent execution engine with embedded real-time terminal log streaming and automated self-healing.

---

## Table of Contents
1. Project Overview & Tech Stack
2. Architecture & 5-Agent Execution Model
3. Database Schemas (MongoDB / Mongoose)
4. API Endpoints Specification
5. Complete Folder Structure
6. 6-Phase Development Plan
7. Security, UI/UX, and AntiGravity Directives

---

## 1. Project Overview & Tech Stack

### Project Overview
Build a full-stack, agentic DevOps automation workspace named **InfraFlow_AI**. The system takes natural-language infrastructure intent (e.g., *"Deploy a Node.js app on AWS EC2 with Docker, PostgreSQL database, Nginx reverse proxy, and SSL setup"*), generates an executable node-graph of infrastructure tasks, executes them against real APIs (GitHub, Docker Engine, AWS, Vercel, DigitalOcean), monitors live container metrics, streams build logs to an xterm.js terminal interface, and automatically remediates runtime deployment failures.

### Tech Stack
* **Frontend:** Next.js 15 (Pages Router), React 19, Tailwind CSS v4, Zustand (state management), Axios, React Flow (`@xyflow/react`), `@xterm/xterm` (terminal rendering), `socket.io-client`, `lucide-react`.
* **Backend:** Node.js (v20+ LTS), Express.js, MongoDB with Mongoose (with in-memory `mongodb-memory-server` fallback), JSON Web Tokens (JWT), BullMQ on Redis (`ioredis` with in-memory array queue fallback), Socket.IO, `helmet`, `express-validator`, `bcryptjs`.
* **AI Engine:** OpenRouter API (Primary) and Google Generative AI SDK (`@google/genai` Gemini 2.5) with deterministic fallback rule engine for offline/unauthenticated execution.
* **DevOps Integrations:** GitHub REST/GraphQL API, Docker Remote API (`dockerode`), AWS SDK v3 (EC2, S3, RDS), DigitalOcean API, Vercel API.

---

## 2. Architecture & 5-Agent Execution Model

### The 5 Agent Subsystems
Each infrastructure execution runs sequentially/concurrently through five dedicated agent modules:

1. **Architect Agent (Planner):**
   * Parses graph dependencies, validates topological execution order, resolves variable dependencies (e.g., database connection strings outputted to app node inputs), and calculates execution cost/risk index.
2. **Execution Agent (Executor):**
   * Communicates with external infrastructure providers (AWS SDK, Dockerode, GitHub API, SSH/Bash execution layer) to provision resources, compile Dockerfiles, and execute infrastructure state changes.
3. **Validation Agent (Validator):**
   * Performs post-provisioning security and operational checks (e.g., checking exposed open ports, SSL certificate validity, ping tests, database handshake, secret exposure scans).
4. **Self-Healing Recovery Agent (Remediator):**
   * Intercepts failure events (e.g., `PORT_IN_USE`, `CONTAINER_CRASH_LOOP`, `INVALID_AWS_CREDENTIALS`, `OOM_KILLED`). Evaluates error logs, adjusts execution payload parameters (e.g., remaps host port, increases RAM allocation), and issues auto-retry or escalates to human intervention.
5. **Monitoring Agent (Observer):**
   * Connects to Docker streams and AWS CloudWatch. Emits real-time build logs, CPU/Memory telemetry, and terminal output to the frontend via Socket.IO events.

---

## 3. Database Schemas (MongoDB / Mongoose)

### 1. User Schema (`User.js`)
```javascript
{
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, index: true },
  password: { type: String, required: true, select: false },
  role: { type: String, enum: ['admin', 'sre_operator', 'developer'], default: 'sre_operator' },
  createdAt: { type: Date, default: Date.now }
}
```

### 2. Infrastructure Workflow Schema (`Workflow.js`)
```javascript
{
  name: { type: String, required: true },
  description: { type: String },
  owner: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  status: { type: String, enum: ['draft', 'active', 'paused', 'archived'], default: 'draft' },
  nodes: [{
    id: { type: String, required: true },
    type: { type: String, required: true }, // e.g., 'githubRepo', 'dockerBuild', 'awsEC2', 'postgresDB', 'nginxProxy'
    position: { x: Number, y: Number },
    data: { label: String, config: Schema.Types.Mixed }
  }],
  edges: [{
    id: { type: String, required: true },
    source: { type: String, required: true },
    target: { type: String, required: true }
  }],
  environmentVars: { type: Map, of: String },
  version: { type: Number, default: 1 },
  createdAt: { type: Date, default: Date.now }
}
```

### 3. Execution Schema (`Execution.js`)
```javascript
{
  workflowId: { type: Schema.Types.ObjectId, ref: 'Workflow', required: true },
  triggeredBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  status: { type: String, enum: ['PENDING', 'RUNNING', 'COMPLETED', 'FAILED', 'REMEDIATING', 'CANCELLED'], default: 'PENDING' },
  workflowSnapshot: { type: Schema.Types.Mixed, required: true },
  nodeStates: { type: Map, of: Schema.Types.Mixed }, // tracking status per node
  startTime: { type: Date, default: Date.now },
  endTime: { type: Date },
  durationMs: { type: Number, default: 0 },
  retryCount: { type: Number, default: 0 },
  errorDetails: { type: Schema.Types.Mixed }
}
```

### 4. ExecutionLog Schema (`ExecutionLog.js`)
```javascript
{
  executionId: { type: Schema.Types.ObjectId, ref: 'Execution', required: true, index: true },
  nodeId: { type: String },
  agent: { type: String, enum: ['architect', 'execution', 'validation', 'recovery', 'monitoring'], required: true },
  level: { type: String, enum: ['info', 'warning', 'error', 'success', 'terminal'], default: 'info' },
  message: { type: String, required: true },
  rawStreamOutput: { type: String }, // Raw terminal stream text
  timestamp: { type: Date, default: Date.now }
}
```

### 5. Integration Credential Schema (`Integration.js`)
```javascript
{
  owner: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  provider: { type: String, enum: ['github', 'aws', 'docker', 'digitalocean', 'vercel'], required: true },
  isConnected: { type: Boolean, default: false },
  encryptedCredentials: { type: String, required: true }, // AES-256 encrypted token/key pair
  metadata: { type: Schema.Types.Mixed },
  createdAt: { type: Date, default: Date.now }
}
```

---

## 4. API Endpoints Specification

### Authentication & System
* `GET /api/health` - System heartbeat, database connection mode (MongoDB vs In-Memory), Redis status.
* `POST /api/auth/register` - Create new SRE/Operator account.
* `POST /api/auth/login` - Authenticate & obtain JWT.
* `GET /api/auth/me` - Fetch authenticated user session profile.

### Workflows & Infrastructure Builder
* `GET /api/workflows` - List all infrastructure workflows with pagination.
* `POST /api/workflows` - Create a manual node graph workflow.
* `POST /api/workflows/generate` - **AI Generator Endpoint**: Prompt to complete node graph conversion.
* `GET /api/workflows/:id` - Fetch single workflow detail.
* `PUT /api/workflows/:id` - Save updated node positions/configurations.
* `DELETE /api/workflows/:id` - Delete workflow.
* `POST /api/workflows/:id/execute` - Dispatch execution job to queue.

### Executions & Terminal Live Feed
* `GET /api/executions` - List active and historical runs.
* `GET /api/executions/:id` - Detailed view of single execution run state.
* `GET /api/executions/:id/terminal-logs` - Fetch raw terminal logs for xterm.js hydration.
* `POST /api/executions/:id/cancel` - Force terminate running deployment.

### DevOps Credentials & Integrations
* `GET /api/integrations` - Connection status for AWS, GitHub, Docker, etc.
* `POST /api/integrations` - Encrypt and store API key / Secret Pair.
* `DELETE /api/integrations/:provider` - Disconnect provider credentials.

---

## 5. Complete Folder Structure

```
infraflow_ai/
├── client/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── AppShell/
│   │   │   │   ├── Header.jsx
│   │   │   │   └── Sidebar.jsx
│   │   │   ├── WorkflowCanvas/
│   │   │   │   ├── Canvas.jsx
│   │   │   │   ├── CustomNodes.jsx
│   │   │   │   └── NodePalette.jsx
│   │   │   ├── Terminal/
│   │   │   │   └── TerminalStream.jsx
│   │   │   ├── MetricGrid/
│   │   │   │   └── HealthCard.jsx
│   │   │   └── ProtectedRoute/
│   │   │       └── AuthGuard.jsx
│   │   ├── pages/
│   │   │   ├── _app.js
│   │   │   ├── index.js
│   │   │   ├── login.js
│   │   │   ├── register.js
│   │   │   ├── dashboard.js
│   │   │   ├── integrations.js
│   │   │   ├── executions/
│   │   │   │   ├── index.js
│   │   │   │   └── [id].js
│   │   │   └── workflows/
│   │   │       ├── index.js
│   │   │       ├── builder.js
│   │   │       └── [id].js
│   │   ├── services/
│   │   │   ├── api.js
│   │   │   └── socket.js
│   │   └── store/
│   │       ├── authStore.js
│   │       ├── workflowStore.js
│   │       └── executionStore.js
│   ├── package.json
│   └── tailwind.config.js
└── server/
    ├── src/
    │   ├── agents/
    │   │   ├── architectAgent.js
    │   │   ├── executionAgent.js
    │   │   ├── validationAgent.js
    │   │   ├── recoveryAgent.js
    │   │   ├── monitoringAgent.js
    │   │   └── orchestrator.js
    │   ├── config/
    │   │   ├── db.js
    │   │   ├── env.js
    │   │   └── socket.js
    │   ├── controllers/
    │   │   ├── authController.js
    │   │   ├── executionController.js
    │   │   ├── integrationController.js
    │   │   └── workflowController.js
    │   ├── integrations/
    │   │   ├── awsIntegration.js
    │   │   ├── baseIntegration.js
    │   │   ├── dockerIntegration.js
    │   │   └── githubIntegration.js
    │   ├── models/
    │   │   ├── Execution.js
    │   │   ├── ExecutionLog.js
    │   │   ├── Integration.js
    │   │   ├── User.js
    │   │   └── Workflow.js
    │   ├── queues/
    │   │   └── executionQueue.js
    │   ├── routes/
    │   │   ├── authRoutes.js
    │   │   ├── executionRoutes.js
    │   │   ├── integrationRoutes.js
    │   │   └── workflowRoutes.js
    │   ├── services/
    │   │   ├── aiService.js
    │   │   ├── authService.js
    │   │   ├── executionService.js
    │   │   ├── integrationService.js
    │   │   └── workflowService.js
    │   └── app.js
    ├── package.json
    └── server.js
```

---

## 6. 6-Phase Development Plan

### Phase 1: Core Setup & Authentication
* Setup `server/` with Express, MongoDB connection (`db.js` with `mongodb-memory-server` fallback if real Mongo connection fails), and JWT auth endpoints.
* Setup `client/` with Next.js (Pages Router), Tailwind CSS v4, Zustand authStore, and pages (`/login`, `/register`, `/dashboard`).

### Phase 2: React Flow DevOps Canvas & Workflow Management
* Implement React Flow on `/workflows/builder` with custom nodes (`GitHub Node`, `Docker Node`, `AWS Node`, `Postgres Node`).
* Add `NodePalette` on the left sidebar and `NodeConfigPanel` on the right sidebar.
* Implement CRUD API for workflows (`/api/workflows`).

### Phase 3: Natural Language AI Infrastructure Generator
* Implement `aiService.js` with OpenRouter primary, Gemini fallback, and rule-based deterministic fallback (for natural prompts like *"Deploy Node.js and Postgres on AWS"*).
* Wire `/api/workflows/generate` endpoint to auto-layout nodes and edges on the React Flow canvas.

### Phase 4: 5-Agent Execution & Self-Healing Orchestrator
* Build `architectAgent.js`, `executionAgent.js`, `validationAgent.js`, `recoveryAgent.js`, and `monitoringAgent.js`.
* Create `orchestrator.js` to execute nodes sequentially, capture error codes, trigger self-healing parameter tweaks on failure, and write logs to `ExecutionLog`.

### Phase 5: Real DevOps Integrations & Token Security
* Implement AES-256 encryption in `integrationService.js` for storing GitHub personal access tokens, AWS keys, and Docker credentials.
* Implement integration mock interfaces in `dockerIntegration.js` and `awsIntegration.js` to simulate live container creation and IP provisioning safely during tests.

### Phase 6: Live Terminal Streaming (Socket.IO) & Monitoring Panel
* Implement Socket.IO event broadcasting for live agent execution steps.
* Integrate `@xterm/xterm` component on the `/executions/[id]` page to stream live colored terminal build logs directly to the user.
* Build dashboard metrics grid showcasing deployment success rates and container uptime logs.

---

## 7. Security, UI/UX, and AntiGravity Directives

### Security Guidelines
* **Credential Encryption:** All third-party secrets MUST be encrypted at rest using `CREDENTIAL_ENCRYPTION_KEY` (AES-256-GCM). Never store raw tokens in MongoDB.
* **Headers & Validation:** Backend must enforce `helmet()`, strict CORS policies matching `CLIENT_URL`, and input validation via `express-validator`.

### UI/UX Rules
* Dark-mode console aesthetic (Slate/Zinc palette with neon emerald for active nodes and amber/cyan for agent execution badges).
* Interactive drag-and-drop workspace with animated canvas edge flows during execution.
* Real-time collapsible xterm.js terminal tray at the bottom of the canvas and execution pages.

### Directives for AntiGravity Execution
1. Always build phase by phase. Never attempt to generate all 6 phases in a single turn.
2. Keep Express controllers thin: pass business logic into dedicated service files (`workflowService.js`, `executionService.js`).
3. Ensure in-memory fallback mechanisms are active for both MongoDB and Redis so local execution works out-of-the-box without external server dependencies.
4. Return a structured list of created/updated file paths at the end of every implemented phase.
