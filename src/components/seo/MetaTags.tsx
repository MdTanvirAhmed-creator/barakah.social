import { Metadata } from "next";

export interface MetaTagsProps {
  title: string;
  description: string;
  image?: string;
  url?: string;
  type?: "website" | "article" | "profile";
  article?: {
    publishedTime?: string;
    modifiedTime?: string;
    author?: string;
    section?: string;
    tags?: string[];
  };
  profile?: {
    firstName?: string;
    lastName?: string;
    username?: string;
  };
  noIndex?: boolean;
  canonicalUrl?: string;
}

/**
 * Generate comprehensive metadata for Next.js App Router pages
 * Includes Open Graph, Twitter Cards, and more
 */
export function generateMetadata({
  title,
  description,
  image = "/og-image.png",
  url,
  type = "website",
  article,
  profile,
  noIndex = false,
  canonicalUrl,
}: MetaTagsProps): Metadata {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://barakah.social";
  const fullUrl = url ? `${baseUrl}${url}` : baseUrl;
  const fullImage = image.startsWith("http") ? image : `${baseUrl}${image}`;

  // Full title with site name
  const fullTitle = title.includes("Barakah.Social")
    ? title
    : `${title} | Barakah.Social`;

  const metadata: Metadata = {
    title: fullTitle,
    description,
    applicationName: "Barakah.Social",
    authors: [{ name: "Barakah.Social Team" }],
    generator: "Next.js",
    keywords: [
      "Islam",
      "Muslim",
      "Social Network",
      "Islamic Knowledge",
      "Halaqas",
      "Community",
      "Quran",
      "Hadith",
      "Fiqh",
      "Seerah",
    ],
    referrer: "origin-when-cross-origin",
    creator: "Barakah.Social",
    publisher: "Barakah.Social",
    formatDetection: {
      telephone: false,
    },
    metadataBase: new URL(baseUrl),
    alternates: {
      canonical: canonicalUrl || fullUrl,
    },
    robots: noIndex
      ? {
          index: false,
          follow: false,
          nocache: true,
        }
      : {
          index: true,
          follow: true,
          googleBot: {
            index: true,
            follow: true,
            "max-video-preview": -1,
            "max-image-preview": "large",
            "max-snippet": -1,
          },
        },
    icons: {
      icon: [
        { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
        { url: "/icons/icon-512x512.png", sizes: "512x512", type: "image/png" },
      ],
      apple: [
        { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
      ],
    },
    manifest: "/manifest.json",
    openGraph: {
      title: fullTitle,
      description,
      url: fullUrl,
      siteName: "Barakah.Social",
      images: [
        {
          url: fullImage,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
      locale: "en_US",
      type: type as any,
      ...(type === "article" && article
        ? {
            publishedTime: article.publishedTime,
            modifiedTime: article.modifiedTime,
            authors: article.author ? [article.author] : undefined,
            section: article.section,
            tags: article.tags,
          }
        : {}),
      ...(type === "profile" && profile
        ? {
            firstName: profile.firstName,
            lastName: profile.lastName,
            username: profile.username,
          }
        : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
      site: "@barakahsocial",
      creator: "@barakahsocial",
      images: [fullImage],
    },
    appleWebApp: {
      capable: true,
      statusBarStyle: "default",
      title: "Barakah.Social",
    },
    verification: {
      // Add your verification codes when ready
      // google: "your-google-verification-code",
      // yandex: "your-yandex-verification-code",
      // yahoo: "your-yahoo-verification-code",
    },
    category: "Social Networking",
  };

  return metadata;
}

/**
 * Generate structured data (JSON-LD) for rich snippets
 */
export function generateStructuredData(props: MetaTagsProps & { structuredDataType?: string }) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://barakah.social";
  const fullUrl = props.url ? `${baseUrl}${props.url}` : baseUrl;

  const baseStructuredData = {
    "@context": "https://schema.org",
    "@type": props.structuredDataType || "WebSite",
    name: "Barakah.Social",
    url: baseUrl,
    description: props.description,
    potentialAction: {
      "@type": "SearchAction",
      target: `${baseUrl}/search?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };

  if (props.type === "article" && props.article) {
    return {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: props.title,
      description: props.description,
      image: props.image,
      datePublished: props.article.publishedTime,
      dateModified: props.article.modifiedTime,
      author: {
        "@type": "Person",
        name: props.article.author,
      },
      publisher: {
        "@type": "Organization",
        name: "Barakah.Social",
        logo: {
          "@type": "ImageObject",
          url: `${baseUrl}/icons/icon-512x512.png`,
        },
      },
    };
  }

  if (props.type === "profile" && props.profile) {
    return {
      "@context": "https://schema.org",
      "@type": "ProfilePage",
      mainEntity: {
        "@type": "Person",
        name: `${props.profile.firstName || ""} ${props.profile.lastName || ""}`.trim(),
        alternateName: props.profile.username,
        url: fullUrl,
        description: props.description,
      },
    };
  }

  return baseStructuredData;
}

/**
 * Component to inject structured data script
 */
export function StructuredDataScript(props: MetaTagsProps & { structuredDataType?: string }) {
  const structuredData = generateStructuredData(props);

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
}
