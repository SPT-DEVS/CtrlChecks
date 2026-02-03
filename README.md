# CtrlChecks Frontend

React/TypeScript frontend application for the CtrlChecks AI Workflow Platform.

## Features

- ✅ Modern React 18 with TypeScript
- ✅ Vite for fast development and builds
- ✅ Tailwind CSS + Shadcn/ui components
- ✅ Supabase authentication
- ✅ Workflow builder with visual editor
- ✅ AI-powered workflow generation
- ✅ Real-time execution monitoring
- ✅ Template management
- ✅ Form and webhook triggers

## Quick Start

### Prerequisites

- Node.js 20+
- npm or yarn
- Supabase project

### Installation

```bash
# Install dependencies
npm install

# Or with yarn
yarn install
```

### Configuration

Create a `.env` file in the root directory:

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key-here

# Backend API Configuration
VITE_PYTHON_BACKEND_URL=http://localhost:8001
VITE_OLLAMA_BASE_URL=http://localhost:8000

# Feature Flags
VITE_USE_DIRECT_BACKEND=false

# Public Base URL
VITE_PUBLIC_BASE_URL=http://localhost:8080
```

### Development

```bash
# Start development server
npm run dev

# Or with yarn
yarn dev
```

Open [http://localhost:8080](http://localhost:8080) in your browser.

### Build

```bash
# Production build
npm run build

# Development build
npm run build:dev
```

Build output will be in the `dist/` directory.

### Preview

```bash
# Preview production build
npm run preview
```

## Project Structure

```
ctrl_checks/
├── src/
│   ├── components/        # React components
│   │   ├── ui/           # Shadcn/ui components
│   │   ├── workflow/     # Workflow builder components
│   │   ├── chat/         # Chat components
│   ├── pages/            # Page components
│   ├── lib/              # Utility libraries
│   ├── hooks/            # Custom React hooks
│   ├── stores/           # State management (Zustand)
│   ├── config/           # Configuration files
│   ├── integrations/     # Third-party integrations
│   │   └── supabase/     # Supabase client and types
│   └── App.tsx           # Main app component
├── public/               # Static assets
├── dist/                 # Build output
├── package.json
├── vite.config.ts        # Vite configuration
├── tailwind.config.ts    # Tailwind CSS configuration
└── tsconfig.json         # TypeScript configuration
```

## Key Technologies

- **React 18**: UI library
- **TypeScript**: Type safety
- **Vite**: Build tool and dev server
- **Tailwind CSS**: Utility-first CSS
- **Shadcn/ui**: Component library
- **React Router**: Routing
- **TanStack Query**: Data fetching
- **Zustand**: State management
- **Supabase**: Backend services
- **React Flow**: Workflow visual editor

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_SUPABASE_URL` | Supabase project URL | - |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Supabase anon key | - |
| `VITE_PYTHON_BACKEND_URL` | Worker service URL | `http://localhost:8000` |
| `VITE_OLLAMA_BASE_URL` | Ollama service URL | `http://localhost:11434` |
| `VITE_USE_DIRECT_BACKEND` | Use direct backend (dev mode) | `false` |
| `VITE_PUBLIC_BASE_URL` | Public base URL | `http://localhost:8080` |

## Development

### Code Style

The project uses ESLint for code quality. Run:

```bash
npm run lint
```

### TypeScript

TypeScript is configured with strict mode disabled for easier development. To enable stricter checking, update `tsconfig.json`.

### Component Development

Components are organized by feature:
- `components/ui/` - Reusable UI components (Shadcn/ui)
- `components/workflow/` - Workflow-specific components
- `components/chat/` - Chat interface components

### State Management

- **Zustand**: Global state (user, workflows, etc.)
- **TanStack Query**: Server state and caching
- **React Context**: Theme and auth providers

## API Integration

The frontend communicates with:
1. **Worker Service** (`VITE_PYTHON_BACKEND_URL`): Main backend API
2. **Ollama Service** (`VITE_OLLAMA_BASE_URL`): AI model proxy
3. **Supabase**: Authentication and database

API client functions are in `src/lib/api/` and use the endpoint configuration from `src/config/endpoints.ts`.

## Authentication

Authentication is handled by Supabase Auth:
- Email/password
- Google OAuth
- Magic links

See `src/lib/auth.tsx` and `src/components/AuthProvider.tsx` for implementation.

## Deployment

### Vercel

1. Connect your repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy

### Netlify

1. Connect your repository to Netlify
2. Set build command: `npm run build`
3. Set publish directory: `dist`
4. Set environment variables
5. Deploy

### AWS S3 + CloudFront

1. Build the project: `npm run build`
2. Upload `dist/` to S3 bucket
3. Configure CloudFront distribution
4. Set up Route53 DNS

See `infrastructure/terraform/` for infrastructure as code.

### Docker

```bash
# Build
docker build -f Dockerfile.prod -t ctrlchecks-frontend .

# Run
docker run -p 8080:80 ctrlchecks-frontend
```

### Nginx with Custom Domain

To deploy with your own domain and SSL/HTTPS:

1. **Quick Setup** (PowerShell):
   ```powershell
   .\scripts\setup-nginx-domain.ps1 -Domain "yourdomain.com"
   ```

2. **Manual Setup**:
   - Copy `nginx.conf.example` to `nginx.conf`
   - Replace `YOUR_DOMAIN.com` with your domain (3 occurrences)
   - Set up SSL certificate with Let's Encrypt:
     ```bash
     sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
     ```

3. **Deploy with Docker**:
   ```bash
   docker run -d \
     --name ctrlchecks-frontend \
     -p 80:80 -p 443:443 \
     -v $(pwd)/nginx.conf:/etc/nginx/conf.d/default.conf:ro \
     -v /etc/letsencrypt:/etc/letsencrypt:ro \
     ctrlchecks-frontend
   ```

4. **Update Environment Variables**:
   ```env
   VITE_PUBLIC_BASE_URL=https://yourdomain.com
   ```

See `nginx-setup-guide.md` for detailed instructions and troubleshooting.

## Testing

```bash
# Run tests (when configured)
npm test
```

## Troubleshooting

### "Missing Supabase environment variables"

- Ensure `.env` file exists with `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`
- Restart the dev server after changing `.env`

### "Cannot connect to backend"

- Verify `VITE_PYTHON_BACKEND_URL` is correct
- Ensure worker service is running
- Check CORS configuration on backend

### "Build errors"

- Clear `node_modules` and reinstall: `rm -rf node_modules && npm install`
- Clear Vite cache: `rm -rf node_modules/.vite`
- Check TypeScript errors: `npx tsc --noEmit`

### "Port already in use"

- Change port in `vite.config.ts`:
  ```ts
  server: {
    port: 3000  // Change to available port
  }
  ```

## Performance Optimization

- Code splitting is handled by Vite automatically
- Images should be optimized before adding to `public/`
- Use React.memo for expensive components
- Lazy load routes with `React.lazy()`

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## License

Part of the CtrlChecks AI Workflow Platform.
