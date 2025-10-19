"use client";

/**
 * Skip to main content link for keyboard navigation
 * Improves accessibility by allowing users to bypass navigation
 */
export function SkipToMain() {
  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const main = document.querySelector("main") || document.querySelector('[role="main"]');
    
    if (main) {
      (main as HTMLElement).tabIndex = -1;
      (main as HTMLElement).focus();
      (main as HTMLElement).scrollIntoView({ behavior: "smooth" });
      
      // Remove tabIndex after focus to prevent it from being focusable by mouse
      setTimeout(() => {
        (main as HTMLElement).removeAttribute("tabindex");
      }, 100);
    }
  };

  return (
    <a
      href="#main-content"
      onClick={handleClick}
      className="skip-to-main"
      aria-label="Skip to main content"
    >
      Skip to main content
    </a>
  );
}
