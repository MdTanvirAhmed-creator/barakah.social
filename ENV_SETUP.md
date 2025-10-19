# Environment Variables Setup

## Important: Create .env.local File

You need to manually create a `.env.local` file in the root directory of this project.

### Step 1: Create the file

In the root directory (`/Users/mdtanvirahmed/Barakah.social/`), create a new file named `.env.local`

### Step 2: Add the following content

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_APP_URL=https://barakah.social
```

### Step 3: Fill in your Supabase credentials

1. Go to [https://supabase.com](https://supabase.com)
2. Create a new project (or use an existing one)
3. Navigate to: **Project Settings** > **API**
4. Copy the following values:
   - **Project URL** → paste into `NEXT_PUBLIC_SUPABASE_URL`
   - **anon/public key** → paste into `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### Example (with filled values):

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
NEXT_PUBLIC_APP_URL=https://barakah.social
```

### Important Notes:

- The `.env.local` file is already listed in `.gitignore` and will NOT be committed to git
- Never share your Supabase keys publicly
- For production deployment, add these variables to your hosting platform's environment settings

### Verify Setup

After creating the file:
1. Restart your development server if it's running
2. The application should now be able to connect to Supabase

