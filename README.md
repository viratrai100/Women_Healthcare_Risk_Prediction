# AI Women's Healthcare Risk Prediction

A production-ready MERN stack application for AI-powered women's healthcare risk prediction.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 (Vite), Tailwind CSS, React Router v6 |
| HTTP Client | Axios |
| Charts | Recharts |
| PDF Export | jsPDF |
| Backend | Node.js, Express.js |
| Database | MongoDB, Mongoose |
| Auth | JWT, bcrypt |

## Project Structure

```
ai-womens-healthcare/
├── client/               # React + Vite frontend
│   └── src/
│       ├── api/          # Axios instance & endpoint helpers
│       ├── components/   # Reusable UI components
│       │   ├── common/   # Buttons, Inputs, Modals, etc.
│       │   └── layout/   # Navbar, Sidebar, Footer
│       ├── context/      # React Context providers
│       ├── hooks/        # Custom React hooks
│       ├── pages/        # Route-level page components
│       ├── routes/       # Route definitions & guards
│       ├── services/     # Frontend service helpers
│       └── utils/        # Utility functions
└── server/               # Express + MongoDB backend
    ├── config/           # DB connection, env config
    ├── controllers/      # Request handlers (MVC)
    ├── middleware/        # Auth, error handling, validation
    ├── models/           # Mongoose schemas
    ├── routes/           # Express route definitions
    ├── services/
    │   └── ai/           # AI/ML service layer
    └── utils/            # Server-side utilities
```

## Getting Started

### Prerequisites
- Node.js >= 18
- MongoDB (local or Atlas)

### Server Setup
```bash
cd server
cp .env.example .env   # fill in your values
npm install
npm run dev
```

### Client Setup
```bash
cd client
cp .env.example .env
npm install
npm run dev
```

## Environment Variables

See `server/.env.example` and `client/.env.example` for required variables.
