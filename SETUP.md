# Barakah.Social - Setup Instructions

## Prerequisites

Make sure you have the following installed:
- Node.js 18.x or later
- npm, yarn, or pnpm

## Installation Steps

### 1. Install Dependencies

```bash
npm install
# or
yarn install
# or
pnpm install
```

### 2. Set Up Environment Variables

Create a `.env.local` file in the root directory with the following content:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_APP_URL=https://barakah.social
```

**To get your Supabase credentials:**
1. Go to [supabase.com](https://supabase.com) and create a new project
2. Navigate to Project Settings > API
3. Copy the Project URL and anon/public key
4. Paste them into your `.env.local` file

### 3. Run the Development Server

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
barakah.social/
├── src/
│   ├── app/              # Next.js App Router pages
│   ├── components/       # React components
│   │   ├── layout/      # Layout components (Header, Footer)
│   │   ├── providers/   # Context providers
│   │   └── ui/          # Reusable UI components
│   ├── hooks/           # Custom React hooks
│   ├── lib/             # Utility functions and configurations
│   │   └── validations/ # Zod validation schemas
│   ├── styles/          # Global CSS styles
│   └── types/           # TypeScript type definitions
├── public/
│   └── assets/          # Static assets (images, icons)
└── [config files]       # Various configuration files
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Tech Stack

- **Framework:** Next.js 14 with App Router
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Database & Auth:** Supabase
- **Form Handling:** React Hook Form + Zod
- **UI Components:** Radix UI
- **Icons:** Lucide React
- **Animations:** Framer Motion
- **Notifications:** React Hot Toast
- **Date Handling:** date-fns

## Next Steps

1. Set up your Supabase database schema
2. Configure authentication flows
3. Create your first components and pages
4. Customize the design system in `tailwind.config.ts`
5. Add your own business logic

## Need Help?

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

Happy coding! 🚀

