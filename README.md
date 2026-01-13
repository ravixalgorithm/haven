<div align="center">
  <br />
  <img src="./apps/web/public/hero.png" alt="OPENHAVEN" width="100%"/>
  <br />
  <br />
  <h1>OPENHAVEN</h1>
  <p><strong>The open-source code snippet platform built for modern developers.</strong></p>
  <br />

  <a href="https://openhaven.vercel.app">Website</a>
  <span>&nbsp;&nbsp;•&nbsp;&nbsp;</span>
  <a href="#getting-started">Getting Started</a>
  <span>&nbsp;&nbsp;•&nbsp;&nbsp;</span>
  <a href="https://github.com/Open-Dev-Society/openhaven/discussions">Discussions</a>
  <span>&nbsp;&nbsp;•&nbsp;&nbsp;</span>
  <a href="https://discord.gg/opendevsociety">Discord</a>
  <span>&nbsp;&nbsp;•&nbsp;&nbsp;</span>
  <a href="#contributing">Contributing</a>

  <br />
  <br />

  <a href="https://github.com/Open-Dev-Society/openhaven/blob/main/LICENSE">
    <img src="https://img.shields.io/badge/License-AGPL--3.0-14b8a6?style=flat-square" alt="License" />
  </a>
  <a href="https://github.com/Open-Dev-Society/openhaven/stargazers">
    <img src="https://img.shields.io/github/stars/Open-Dev-Society/openhaven?style=flat-square&color=14b8a6" alt="Stars" />
  </a>

  <a href="https://github.com/Open-Dev-Society/openhaven/pulse">
    <img src="https://img.shields.io/github/commit-activity/m/Open-Dev-Society/openhaven?style=flat-square&color=14b8a6" alt="Commits" />
  </a>
  
  <br />
  <br />
  <hr />
</div>

## What is OPENHAVEN?

OPENHAVEN is a **free, open-source platform** for developers to share, discover, and collaborate on code snippets. Think of it as GitHub Gist meets a social network — built with modern technologies and designed for the way developers work today.

- **Share code instantly** with syntax highlighting for 50+ languages
- **Discover trending snippets** from developers around the world
- **Build your reputation** through upvotes, followers, and contributions
- **Real-time collaboration** with live notifications and comments

> **OPENHAVEN is an initiative of [Open Dev Society](https://github.com/Open-Dev-Society)** — a community dedicated to building open-source tools for developers.

<br />

## Key Features

| | Feature | Description |
|:---:|---|---|
| 🎨 | **Beautiful UI** | Glassmorphic design with dark/light themes, smooth animations, and responsive layouts |
| ⚡ | **Lightning Fast** | Built on Next.js 15 with React 19 and optimized for performance |
| 🔐 | **Secure Auth** | GitHub OAuth integration with JWT tokens and role-based access control |
| 🔍 | **Smart Search** | Full-text search with filters for language, tags, author, and date |
| 💬 | **Discussions** | Threaded comments with nested replies and voting |
| 📊 | **Profiles** | User profiles with followers, following, reputation, and activity history |
| � | **Real-time** | Socket.io powered notifications and live feed updates |
| �️ | **Moderation** | Admin dashboard with content reports and user management |

<br />

## Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL database
- GitHub OAuth app (for authentication)

### Installation

```bash
# Clone the repository
git clone https://github.com/Open-Dev-Society/openhaven.git
cd openhaven

# Install dependencies
npm install

# Set up environment variables
cp apps/web/.env.example apps/web/.env
cp packages/api/.env.example packages/api/.env

# Initialize the database
cd packages/api && npx prisma db push && cd ..

# Start development servers
npm run dev
```

The frontend will be available at `http://localhost:3000` and the API at `http://localhost:3002`.

### Environment Variables

<details>
<summary><strong>Frontend (apps/web/.env)</strong></summary>

```env
NEXT_PUBLIC_API_URL=http://localhost:3002/api/v1
NEXT_PUBLIC_SOCKET_URL=http://localhost:3002
SERVER_API_URL=http://localhost:3002/api/v1
NEXT_PUBLIC_GITHUB_CLIENT_ID=your_github_client_id
```

</details>

<details>
<summary><strong>Backend (packages/api/.env)</strong></summary>

```env
DATABASE_URL=postgresql://user:password@localhost:5432/openhaven
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-secret-key
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
FRONTEND_URL=http://localhost:3000
```

</details>

<br />

## Architecture

OPENHAVEN is structured as a **Turborepo monorepo** for optimal developer experience and build performance.

```
openhaven/
├── apps/
│   └── web/                 # Next.js 15 frontend
│       ├── app/             # App Router pages
│       ├── components/      # React components
│       └── lib/             # Utilities
│
├── packages/
│   └── api/                 # Hono.js backend
│       ├── src/
│       │   ├── routes/      # API endpoints
│       │   ├── services/    # Business logic
│       │   └── middleware/  # Auth, rate limiting
│       └── prisma/          # Database schema
│
└── turbo.json               # Turborepo config
```

### Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | Next.js 15, React 19, TypeScript, TailwindCSS 4 |
| **Backend** | Hono.js, Socket.io, Prisma ORM |
| **Database** | PostgreSQL, Redis (caching) |
| **Auth** | GitHub OAuth, JWT |
| **Deployment** | Vercel (frontend), Railway (backend) |
| **Build** | Turborepo, Bun |

<br />

## Deployment

### Vercel (Frontend)

1. Import the repository to Vercel
2. Set the root directory to `apps/web`
3. Configure environment variables
4. Deploy

### Railway (Backend)

1. Create a new project on Railway
2. Add PostgreSQL and Redis services
3. Deploy from the `packages/api` directory
4. Configure environment variables

<br />

## API Reference

<details>
<summary><strong>Authentication</strong></summary>

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/auth/signup` | Create account |
| `POST` | `/auth/login` | Sign in |
| `GET` | `/auth/github` | GitHub OAuth |
| `GET` | `/auth/me` | Current user |

</details>

<details>
<summary><strong>Snippets</strong></summary>

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/snippets` | List snippets |
| `POST` | `/snippets` | Create snippet |
| `GET` | `/snippets/:id` | Get snippet |
| `PUT` | `/snippets/:id` | Update snippet |
| `DELETE` | `/snippets/:id` | Delete snippet |
| `POST` | `/snippets/:id/upvote` | Upvote |
| `POST` | `/snippets/:id/downvote` | Downvote |

</details>

<details>
<summary><strong>Users</strong></summary>

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/users/:username` | Get profile |
| `PUT` | `/users/:username` | Update profile |
| `POST` | `/users/:username/follow` | Follow user |
| `DELETE` | `/users/:username/follow` | Unfollow |

</details>

<br />

## Contributing

We welcome contributions of all kinds! Whether you're fixing bugs, adding features, or improving documentation — your help is appreciated.

1. **Fork** the repository
2. **Create** a branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'Add amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

Please read our [Contributing Guidelines](CONTRIBUTING.md) before submitting a PR.

### Development

```bash
# Run tests
npm run test

# Lint code
npm run lint

# Type check
npm run type-check

# Build all packages
npm run build
```

<br />

## Community

- **Discord**: [Join our community](https://discord.gg/opendevsociety)
- **Twitter/X**: [@opendevsociety](https://twitter.com/opendevsociety)
- **GitHub Discussions**: [Ask questions & share ideas](https://github.com/Open-Dev-Society/openhaven/discussions)

<br />

## License

OPENHAVEN is open-source software licensed under the [GNU Affero General Public License v3.0 (AGPL-3.0)](LICENSE).

<br />

---

<div align="center">
  <br />
  <p>
    <sub>Built with ❤️ by <a href="https://github.com/Open-Dev-Society">Open Dev Society</a></sub>
  </p>
  <p>
    <a href="https://github.com/Open-Dev-Society/openhaven/graphs/contributors">
      <img src="https://contrib.rocks/image?repo=Open-Dev-Society/openhaven&max=100" />
    </a>
  </p>
</div>
