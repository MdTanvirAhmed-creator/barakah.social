"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { Loader2, Mail, Lock, ArrowRight } from "lucide-react";
import { signInWithEmail } from "@/lib/supabase/auth";
import { loginSchema, type LoginInput } from "@/lib/validations/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GoogleAuthButton } from "@/components/auth/GoogleAuthButton";
import { useToast } from "@/hooks/useToast";

export default function LoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const { success, error: showError } = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      rememberMe: false,
    },
  });

  const onSubmit = async (data: LoginInput) => {
    try {
      setIsLoading(true);

      const { data: authData, error } = await signInWithEmail(
        data.email,
        data.password
      );

      if (error) {
        throw new Error(error.message);
      }

      success("Welcome back! Redirecting...");
      
      // Small delay for the toast to show
      setTimeout(() => {
        router.push("/dashboard");
        router.refresh();
      }, 1000);
    } catch (err) {
      showError(
        err instanceof Error ? err.message : "Failed to sign in. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-background">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Welcome Back
            </h1>
            <p className="text-foreground-secondary">
              Sign in to continue your journey
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="your.email@example.com"
                  className="pl-10"
                  {...register("email")}
                  disabled={isLoading}
                />
              </div>
              {errors.email && (
                <p className="text-sm text-error">{errors.email.message}</p>
              )}
            </div>

            {/* Password */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Link
                  href="/forgot-password"
                  className="text-sm text-primary-600 hover:text-primary-700"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  className="pl-10"
                  {...register("password")}
                  disabled={isLoading}
                />
              </div>
              {errors.password && (
                <p className="text-sm text-error">{errors.password.message}</p>
              )}
            </div>

            {/* Remember Me */}
            <div className="flex items-center">
              <input
                id="rememberMe"
                type="checkbox"
                className="h-4 w-4 rounded border-border text-primary-600 focus:ring-2 focus:ring-primary-600"
                {...register("rememberMe")}
                disabled={isLoading}
              />
              <label
                htmlFor="rememberMe"
                className="ml-2 text-sm text-foreground-secondary"
              >
                Remember me for 30 days
              </label>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full bg-primary-600 hover:bg-primary-700"
              size="lg"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  Sign In
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-background text-muted-foreground">
                  Or continue with
                </span>
              </div>
            </div>

            {/* Google Auth */}
            <GoogleAuthButton mode="signin" className="w-full" />

            {/* Sign Up Link */}
            <p className="text-center text-sm text-foreground-secondary">
              Don&apos;t have an account?{" "}
              <Link
                href="/signup"
                className="font-medium text-primary-600 hover:text-primary-700"
              >
                Sign up
              </Link>
            </p>
          </form>

          {/* Footer Note */}
          <p className="mt-8 text-center text-xs text-muted-foreground">
            By signing in, you agree to our{" "}
            <Link href="/terms" className="text-primary-600 hover:underline">
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link href="/privacy" className="text-primary-600 hover:underline">
              Privacy Policy
            </Link>
          </p>
        </motion.div>
      </div>

      {/* Right Side - Islamic Pattern & Branding */}
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800 items-center justify-center p-12 relative overflow-hidden">
        {/* Islamic Pattern Background */}
        <div className="pattern-islamic absolute inset-0 opacity-10" />

        {/* Content */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="relative z-10 text-white text-center space-y-6 max-w-lg"
        >
          <div className="space-y-4">
            <h2 className="text-5xl font-bold">Barakah.Social</h2>
            <p className="text-xl text-primary-100">
              Connect with Purpose, Learn with Wisdom
            </p>
          </div>

          <div className="space-y-4 pt-8">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 glass">
              <p className="text-lg italic leading-relaxed">
                &ldquo;The example of the believers in their affection, mercy, and
                compassion for each other is that of a body. When any limb aches,
                the whole body reacts with sleeplessness and fever.&rdquo;
              </p>
              <p className="text-sm text-primary-200 mt-3">
                — Prophet Muhammad ﷺ (Sahih Muslim)
              </p>
            </div>
          </div>

          {/* Features */}
          <div className="grid grid-cols-2 gap-4 pt-8">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <div className="text-3xl mb-2">📚</div>
              <p className="text-sm font-medium">Learn Together</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <div className="text-3xl mb-2">🤝</div>
              <p className="text-sm font-medium">Build Community</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <div className="text-3xl mb-2">💬</div>
              <p className="text-sm font-medium">Ask Scholars</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <div className="text-3xl mb-2">✨</div>
              <p className="text-sm font-medium">Grow Spiritually</p>
            </div>
          </div>
        </motion.div>

        {/* Decorative Elements */}
        <div className="absolute top-10 right-10 w-32 h-32 bg-secondary-500/20 rounded-full blur-3xl" />
        <div className="absolute bottom-10 left-10 w-40 h-40 bg-primary-400/20 rounded-full blur-3xl" />
      </div>
    </div>
  );
}

