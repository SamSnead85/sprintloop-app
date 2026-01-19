# SprintLoop Web App

Deployable web application for https://app.sprintloop.ai

## Deployment Strategy

**Best Practice: Subdomain Pattern**
```
sprintloop.ai      → Marketing site (existing)
app.sprintloop.ai  → Web IDE (this app)
```

This is the industry standard used by:
- Notion (notion.so / app.notion.so)
- Figma (figma.com / www.figma.com/files)
- Linear (linear.app / linear.app/[workspace])
- Vercel (vercel.com / vercel.com/dashboard)

## Netlify Deployment

### Option 1: Separate Netlify Site (Recommended)
1. Create new Netlify site from `apps/web`
2. Configure custom domain: `app.sprintloop.ai`
3. Add DNS CNAME record pointing to Netlify

### Option 2: Same Repo, Monorepo Plugin
1. Use Netlify monorepo plugin
2. Deploy both marketing and app from same repo

## Setup Steps

```bash
# 1. Build the web app
cd apps/web
npm run build

# 2. Deploy to Netlify
# Either via netlify-cli or connect GitHub repo
npx netlify deploy --dir=dist --prod
```

## Environment Variables (Netlify Dashboard)
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

## DNS Configuration
Add CNAME record:
```
app.sprintloop.ai → your-app-name.netlify.app
```
