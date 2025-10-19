# Supabase Integration Guide - Barakah.Social

## 📁 File Structure Overview

Your Supabase integration is now organized in a modular structure:

```
src/
├── lib/
│   └── supabase/
│       ├── client.ts          # Browser client
│       ├── server.ts          # Server-side client
│       ├── middleware.ts      # Session management
│       ├── auth.ts            # Authentication utilities
│       ├── queries.ts         # Database queries
│       ├── storage.ts         # File upload/download
│       ├── route-protection.ts # Server-side auth checks
│       └── index.ts           # Main exports
├── hooks/
│   ├── useAuth.ts             # Deprecated - use useSupabaseAuth
│   └── useSupabaseAuth.ts     # Complete auth hook
├── types/
│   └── supabase.ts            # Database type definitions
└── middleware.ts              # Next.js middleware
```

---

## 🔑 Authentication

### Client-Side Authentication

#### Using the `useSupabaseAuth` Hook

```typescript
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";

function MyComponent() {
  const { user, profile, loading, error, signOut, refreshProfile } = useSupabaseAuth();

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      {user ? (
        <>
          <p>Welcome, {profile?.full_name || user.email}</p>
          <button onClick={signOut}>Sign Out</button>
        </>
      ) : (
        <p>Please log in</p>
      )}
    </div>
  );
}
```

#### Sign Up

```typescript
import { signUpWithEmail } from "@/lib/supabase/auth";

async function handleSignUp(email: string, password: string, fullName: string) {
  const { data, error } = await signUpWithEmail(email, password, {
    full_name: fullName,
  });

  if (error) {
    console.error("Sign up error:", error.message);
    return;
  }

  console.log("User created:", data);
}
```

#### Sign In

```typescript
import { signInWithEmail } from "@/lib/supabase/auth";

async function handleSignIn(email: string, password: string) {
  const { data, error } = await signInWithEmail(email, password);

  if (error) {
    console.error("Sign in error:", error.message);
    return;
  }

  console.log("Signed in:", data);
}
```

#### OAuth Sign In

```typescript
import { signInWithOAuth } from "@/lib/supabase/auth";

async function handleGoogleSignIn() {
  const { data, error } = await signInWithOAuth("google");

  if (error) {
    console.error("OAuth error:", error.message);
  }
  // User will be redirected to Google
}
```

---

## 🗄️ Database Queries

### Posts

```typescript
import { getPosts, createPost, updatePost, deletePost } from "@/lib/supabase/queries";

// Get posts
async function loadPosts() {
  const { data, error, count } = await getPosts(10, 0);
  console.log(`Found ${count} posts:`, data);
}

// Create post
async function makePost(content: string, imageUrl?: string) {
  const { data, error } = await createPost(content, imageUrl);
  if (error) console.error(error);
  else console.log("Post created:", data);
}

// Update post
async function editPost(postId: string, newContent: string) {
  const { data, error } = await updatePost(postId, newContent);
  if (error) console.error(error);
}

// Delete post
async function removePost(postId: string) {
  const { error } = await deletePost(postId);
  if (error) console.error(error);
}
```

### Comments

```typescript
import { getCommentsByPostId, createComment, deleteComment } from "@/lib/supabase/queries";

// Get comments for a post
async function loadComments(postId: string) {
  const { data, error } = await getCommentsByPostId(postId);
  console.log("Comments:", data);
}

// Add comment
async function addComment(postId: string, content: string) {
  const { data, error } = await createComment(postId, content);
  if (error) console.error(error);
}
```

### Likes

```typescript
import { likePost, unlikePost, checkIfLiked } from "@/lib/supabase/queries";

// Like a post
async function handleLike(postId: string) {
  const { data: isLiked } = await checkIfLiked(postId);
  
  if (isLiked) {
    await unlikePost(postId);
  } else {
    await likePost(postId);
  }
}
```

### Followers

```typescript
import { followUser, unfollowUser, checkIfFollowing, getFollowers, getFollowing } from "@/lib/supabase/queries";

// Follow a user
async function handleFollow(userId: string) {
  const { data: isFollowing } = await checkIfFollowing(userId);
  
  if (isFollowing) {
    await unfollowUser(userId);
  } else {
    await followUser(userId);
  }
}

// Get followers
async function loadFollowers(userId: string) {
  const { data, error } = await getFollowers(userId);
  console.log("Followers:", data);
}
```

---

## 📤 File Storage

### Upload Avatar

```typescript
import { uploadAvatar } from "@/lib/supabase/storage";

async function handleAvatarUpload(file: File) {
  const { data, error } = await uploadAvatar(file);
  
  if (error) {
    console.error("Upload error:", error.message);
    return;
  }

  console.log("Avatar URL:", data.publicUrl);
  // Update user profile with the new avatar URL
}
```

### Upload Post Image

```typescript
import { uploadPostImage } from "@/lib/supabase/storage";

async function handleImageUpload(file: File) {
  const { data, error } = await uploadPostImage(file);
  
  if (error) {
    console.error("Upload error:", error.message);
    return;
  }

  return data.publicUrl;
}
```

### Delete File

```typescript
import { deleteFile } from "@/lib/supabase/storage";

async function removeFile(filePath: string) {
  const { error } = await deleteFile(filePath, "posts");
  if (error) console.error(error);
}
```

---

## 🔒 Server-Side Route Protection

### Protecting Server Components

```typescript
// app/dashboard/page.tsx
import { requireAuth } from "@/lib/supabase/route-protection";

export default async function DashboardPage() {
  const user = await requireAuth(); // Redirects to /login if not authenticated
  
  return (
    <div>
      <h1>Welcome, {user.email}</h1>
    </div>
  );
}
```

### Guest-Only Pages (Login/Register)

```typescript
// app/login/page.tsx
import { requireGuest } from "@/lib/supabase/route-protection";

export default async function LoginPage() {
  await requireGuest(); // Redirects to /dashboard if already authenticated
  
  return (
    <div>
      <h1>Login</h1>
    </div>
  );
}
```

### Getting User in Server Components

```typescript
import { getUser } from "@/lib/supabase/route-protection";

export default async function ProfilePage() {
  const user = await getUser();
  
  return (
    <div>
      {user ? (
        <p>Logged in as {user.email}</p>
      ) : (
        <p>Not logged in</p>
      )}
    </div>
  );
}
```

---

## 🔄 Server Actions

### Example: Create Post Server Action

```typescript
// app/actions/posts.ts
"use server";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function createPostAction(formData: FormData) {
  const supabase = await createServerSupabaseClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return { error: "Not authenticated" };
  }

  const content = formData.get("content") as string;

  const { data, error } = await supabase
    .from("posts")
    .insert({
      user_id: user.id,
      content,
    })
    .select()
    .single();

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/feed");
  return { data };
}
```

---

## 🎣 Custom Hooks Examples

### usePost Hook

```typescript
"use client";

import { useState, useEffect } from "react";
import { getPostById } from "@/lib/supabase/queries";
import type { PostWithProfile } from "@/types/supabase";

export function usePost(postId: string) {
  const [post, setPost] = useState<PostWithProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPost() {
      const { data, error } = await getPostById(postId);
      
      if (error) {
        setError(error.message);
      } else {
        setPost(data);
      }
      
      setLoading(false);
    }

    fetchPost();
  }, [postId]);

  return { post, loading, error };
}
```

### usePosts Hook with Pagination

```typescript
"use client";

import { useState, useEffect } from "react";
import { getPosts } from "@/lib/supabase/queries";
import type { PostWithProfile } from "@/types/supabase";

export function usePosts(limit = 10) {
  const [posts, setPosts] = useState<PostWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);

  useEffect(() => {
    async function fetchPosts() {
      setLoading(true);
      const { data, error, count } = await getPosts(limit, page * limit);
      
      if (error) {
        console.error(error);
      } else if (data) {
        setPosts(prev => page === 0 ? data : [...prev, ...data]);
        setHasMore(posts.length + data.length < (count || 0));
      }
      
      setLoading(false);
    }

    fetchPosts();
  }, [page, limit]);

  const loadMore = () => {
    if (!loading && hasMore) {
      setPage(p => p + 1);
    }
  };

  return { posts, loading, hasMore, loadMore };
}
```

---

## 🔔 Real-time Subscriptions

### Subscribe to New Posts

```typescript
"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

export function useRealtimePosts(onNewPost: (post: any) => void) {
  useEffect(() => {
    const supabase = createClient();
    
    const channel = supabase
      .channel("posts")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "posts",
        },
        (payload) => {
          onNewPost(payload.new);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [onNewPost]);
}
```

---

## 🧪 Testing Queries

### Test in Browser Console

```javascript
// After importing createClient
const supabase = createClient();

// Test getting posts
const { data, error } = await supabase
  .from('posts')
  .select('*, profiles(*)')
  .limit(5);

console.log({ data, error });
```

---

## 📚 Best Practices

1. **Use Server Components when possible** - Better performance and SEO
2. **Use Client Components for interactivity** - Forms, real-time updates
3. **Always handle errors** - Check for error in responses
4. **Use TypeScript types** - Import from `@/types/supabase`
5. **Protect routes** - Use `requireAuth()` for protected pages
6. **Validate input** - Use Zod schemas before database operations
7. **Optimize queries** - Only select fields you need
8. **Use RLS policies** - Already configured in the database
9. **Cache when appropriate** - Use Next.js caching strategies
10. **Handle loading states** - Show loaders during async operations

---

## 🆘 Common Issues

### Issue: "Not authenticated" errors
**Solution**: Check if user is logged in before making queries

### Issue: RLS policy violations
**Solution**: Verify your Supabase RLS policies match your queries

### Issue: Type errors
**Solution**: Regenerate types: `npx supabase gen types typescript`

### Issue: CORS errors
**Solution**: Check your Supabase project URL configuration

### Issue: Middleware not working
**Solution**: Ensure `@supabase/ssr` is installed and env vars are set

---

## 📖 Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Next.js App Router Docs](https://nextjs.org/docs/app)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [React Hooks Guide](https://react.dev/reference/react)

---

## 🎯 Next Steps

1. ✅ Install dependencies: `npm install`
2. ✅ Set up environment variables in `.env.local`
3. 📝 Create database schema (see `SUPABASE_SETUP.md`)
4. 🎨 Build your authentication pages
5. 📱 Create your feed and post components
6. 🚀 Deploy to production

Happy coding! 🎉

