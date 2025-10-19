import { MetadataRoute } from "next";

/**
 * Generate dynamic sitemap for better SEO
 * https://nextjs.org/docs/app/api-reference/file-conventions/metadata/sitemap
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://barakah.social";
  const currentDate = new Date().toISOString();

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: currentDate,
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${baseUrl}/feed`,
      lastModified: currentDate,
      changeFrequency: "always",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/halaqas`,
      lastModified: currentDate,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/knowledge`,
      lastModified: currentDate,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/tools`,
      lastModified: currentDate,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${baseUrl}/search`,
      lastModified: currentDate,
      changeFrequency: "weekly",
      priority: 0.6,
    },
    {
      url: `${baseUrl}/login`,
      lastModified: currentDate,
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${baseUrl}/signup`,
      lastModified: currentDate,
      changeFrequency: "monthly",
      priority: 0.5,
    },
  ];

  // TODO: Add dynamic pages when connected to Supabase
  // - Individual posts: /post/[id]
  // - User profiles: /profile/[username]
  // - Individual halaqas: /halaqas/[id]
  // - Knowledge content: /knowledge/[slug]

  // Example of how to add dynamic pages:
  // const dynamicPages = await fetchDynamicPages();
  // const dynamicSitemap = dynamicPages.map((page) => ({
  //   url: `${baseUrl}${page.url}`,
  //   lastModified: page.updatedAt,
  //   changeFrequency: 'weekly',
  //   priority: 0.7,
  // }));

  return [...staticPages];
}

