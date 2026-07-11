import toast from "react-hot-toast";
import { createElement } from "react";
import { GoldDiamond } from "@/components/ui/girih";

/**
 * A meaningful moment (design §7): a completed act worth marking —
 * companionship accepted, submission sent, review approved. Renders a
 * gold-leaf chip that catches light once. Use sparingly; ordinary
 * confirmations stay success(). Standalone so non-hook call sites
 * (sonner-based pages) can use it too.
 */
export function moment(message: string) {
  toast.custom(
    () =>
      createElement(
        "div",
        {
          className:
            "leaf-moment flex items-center gap-2 rounded-full border px-4 py-2 text-sm bg-card shadow-md",
          style: {
            borderColor: "color-mix(in srgb, var(--leaf) 40%, transparent)",
            color: "var(--leaf)",
          },
        },
        createElement(GoldDiamond, { size: 7 }),
        message
      ),
    { duration: 3200 }
  );
}

export function useToast() {
  const success = (message: string) => {
    toast.success(message);
  };

  const error = (message: string) => {
    toast.error(message);
  };

  const loading = (message: string) => {
    return toast.loading(message);
  };

  const dismiss = (toastId: string) => {
    toast.dismiss(toastId);
  };

  return {
    success,
    error,
    loading,
    dismiss,
    moment,
  };
}
