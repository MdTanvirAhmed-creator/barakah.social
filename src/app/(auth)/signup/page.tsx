"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion, AnimatePresence } from "framer-motion";
import {
  Loader2,
  Mail,
  Lock,
  ArrowRight,
  ArrowLeft,
  User,
  Check,
  Sparkles,
} from "lucide-react";
import { signUpWithEmail } from "@/lib/supabase/auth";
import { createClient } from "@/lib/supabase/client";
import {
  signupStep1Schema,
  signupStep2Schema,
  signupStep3Schema,
  signupStep4Schema,
  AVAILABLE_INTERESTS,
  MADHAB_OPTIONS,
  type SignupStep1Input,
  type SignupStep2Input,
  type SignupStep3Input,
  type SignupStep4Input,
} from "@/lib/validations/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GoogleAuthButton } from "@/components/auth/GoogleAuthButton";
import { Mithaq } from "@/components/auth/Mithaq";
import { useToast } from "@/hooks/useToast";

type SignupData = SignupStep1Input &
  SignupStep2Input &
  SignupStep3Input &
  SignupStep4Input;

export default function SignupPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [signupData, setSignupData] = useState<Partial<SignupData>>({
    interests: [],
  });
  const { success, error: showError } = useToast();

  const totalSteps = 4;

  // Form for Step 1
  const step1Form = useForm<SignupStep1Input>({
    resolver: zodResolver(signupStep1Schema),
  });

  // Form for Step 2
  const step2Form = useForm<SignupStep2Input>({
    resolver: zodResolver(signupStep2Schema),
    defaultValues: {
      acceptMithaq: false,
      hasScrolled: false,
    },
  });

  // Form for Step 3
  const step3Form = useForm<SignupStep3Input>({
    resolver: zodResolver(signupStep3Schema),
  });

  // Form for Step 4
  const step4Form = useForm<SignupStep4Input>({
    resolver: zodResolver(signupStep4Schema),
    defaultValues: {
      interests: [],
    },
  });

  // Handle Step 1 submission
  const onStep1Submit = (data: SignupStep1Input) => {
    setSignupData((prev) => ({ ...prev, ...data }));
    setCurrentStep(2);
  };

  // Handle Step 2 submission
  const onStep2Submit = (data: SignupStep2Input) => {
    setSignupData((prev) => ({ ...prev, ...data }));
    setCurrentStep(3);
  };

  // Handle Step 3 submission
  const onStep3Submit = (data: SignupStep3Input) => {
    setSignupData((prev) => ({ ...prev, ...data }));
    setCurrentStep(4);
  };

  // Handle Step 4 submission (Final)
  const onStep4Submit = async (data: SignupStep4Input) => {
    try {
      setIsLoading(true);

      const completeData: SignupData = {
        ...(signupData as SignupStep1Input & SignupStep2Input & SignupStep3Input),
        ...data,
      };

      // Create auth user
      const { data: authData, error: authError } = await signUpWithEmail(
        completeData.email,
        completeData.password,
        {
          full_name: completeData.fullName,
          username: completeData.username,
        }
      );

      if (authError) {
        throw new Error(authError.message);
      }

      // Update profile with additional info
      if (authData?.user) {
        const supabase = createClient();
        const { error: profileError } = await supabase
          .from("profiles")
          .update({
            username: completeData.username,
            full_name: completeData.fullName,
            interests: completeData.interests,
            madhab_preference: completeData.madhab || null,
          })
          .eq("id", authData.user.id);

        if (profileError) {
          console.error("Profile update error:", profileError);
          // Don't fail the signup, profile can be updated later
        }
      }

      success("Account created successfully! Please check your email to verify.");
      
      setTimeout(() => {
        router.push("/login");
      }, 2000);
    } catch (err) {
      showError(
        err instanceof Error
          ? err.message
          : "Failed to create account. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Handle scroll completion for Mithaq
  const handleMithaqScrolled = (scrolled: boolean) => {
    step2Form.setValue("hasScrolled", scrolled);
  };

  // Toggle interest selection
  const toggleInterest = (interest: string) => {
    const currentInterests = step4Form.getValues("interests") || [];
    const newInterests = currentInterests.includes(interest)
      ? currentInterests.filter((i) => i !== interest)
      : [...currentInterests, interest];
    
    step4Form.setValue("interests", newInterests);
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-2xl">
          {/* Header with Progress */}
          <div className="mb-8">
            {/* Progress Bar */}
            <div className="flex items-center justify-between mb-6">
              {[1, 2, 3, 4].map((step) => (
                <div key={step} className="flex items-center flex-1">
                  <div className="flex items-center">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors ${
                        currentStep > step
                          ? "bg-success text-white"
                          : currentStep === step
                          ? "bg-primary-600 text-white"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {currentStep > step ? <Check className="w-4 h-4" /> : step}
                    </div>
                    {step < 4 && (
                      <div
                        className={`flex-1 h-1 mx-2 transition-colors ${
                          currentStep > step ? "bg-success" : "bg-muted"
                        }`}
                      />
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Step Title */}
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center"
            >
              <h1 className="text-3xl font-bold text-foreground mb-2">
                {currentStep === 1 && "Create Your Account"}
                {currentStep === 2 && "Community Covenant"}
                {currentStep === 3 && "Your Profile"}
                {currentStep === 4 && "Your Interests"}
              </h1>
              <p className="text-foreground-secondary">
                {currentStep === 1 && "Join our community of knowledge seekers"}
                {currentStep === 2 && "Read and accept our community guidelines"}
                {currentStep === 3 && "Tell us about yourself"}
                {currentStep === 4 && "Help us personalize your experience"}
              </p>
            </motion.div>
          </div>

          {/* Form Steps */}
          <AnimatePresence mode="wait">
            {/* Step 1: Email & Password */}
            {currentStep === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <form
                  onSubmit={step1Form.handleSubmit(onStep1Submit)}
                  className="space-y-6"
                >
                  {/* Email */}
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="your.email@example.com"
                        className="pl-10"
                        {...step1Form.register("email")}
                      />
                    </div>
                    {step1Form.formState.errors.email && (
                      <p className="text-sm text-error">
                        {step1Form.formState.errors.email.message}
                      </p>
                    )}
                  </div>

                  {/* Password */}
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="password"
                        type="password"
                        placeholder="Create a strong password"
                        className="pl-10"
                        {...step1Form.register("password")}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Must be at least 8 characters with uppercase, lowercase, and
                      numbers
                    </p>
                    {step1Form.formState.errors.password && (
                      <p className="text-sm text-error">
                        {step1Form.formState.errors.password.message}
                      </p>
                    )}
                  </div>

                  {/* Confirm Password */}
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="confirmPassword"
                        type="password"
                        placeholder="Confirm your password"
                        className="pl-10"
                        {...step1Form.register("confirmPassword")}
                      />
                    </div>
                    {step1Form.formState.errors.confirmPassword && (
                      <p className="text-sm text-error">
                        {step1Form.formState.errors.confirmPassword.message}
                      </p>
                    )}
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-primary-600 hover:bg-primary-700"
                    size="lg"
                  >
                    Continue
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>

                  {/* Divider */}
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-border" />
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-2 bg-background text-muted-foreground">
                        Or sign up with
                      </span>
                    </div>
                  </div>

                  {/* Google Auth */}
                  <GoogleAuthButton mode="signup" className="w-full" />

                  {/* Sign In Link */}
                  <p className="text-center text-sm text-foreground-secondary">
                    Already have an account?{" "}
                    <Link
                      href="/login"
                      className="font-medium text-primary-600 hover:text-primary-700"
                    >
                      Sign in
                    </Link>
                  </p>
                </form>
              </motion.div>
            )}

            {/* Step 2: Mithaq (Covenant) */}
            {currentStep === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <form
                  onSubmit={step2Form.handleSubmit(onStep2Submit)}
                  className="space-y-6"
                >
                  <Mithaq
                    onScrollComplete={handleMithaqScrolled}
                    hasScrolledToBottom={step2Form.watch("hasScrolled") || false}
                  />

                  {/* Accept Checkbox */}
                  <div className="flex items-start space-x-3 p-4 bg-muted rounded-lg">
                    <input
                      id="acceptMithaq"
                      type="checkbox"
                      className="mt-1 h-4 w-4 rounded border-border text-primary-600 focus:ring-2 focus:ring-primary-600"
                      {...step2Form.register("acceptMithaq")}
                      disabled={!step2Form.watch("hasScrolled")}
                    />
                    <label
                      htmlFor="acceptMithaq"
                      className="text-sm text-foreground-secondary"
                    >
                      I have read and agree to uphold the Mithaq (Community
                      Covenant). I understand that violating these guidelines may
                      result in account suspension.
                    </label>
                  </div>

                  {step2Form.formState.errors.acceptMithaq && (
                    <p className="text-sm text-error">
                      {step2Form.formState.errors.acceptMithaq.message}
                    </p>
                  )}

                  <div className="flex gap-4">
                    <Button
                      type="button"
                      variant="outline"
                      className="flex-1"
                      onClick={() => setCurrentStep(1)}
                    >
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Back
                    </Button>
                    <Button
                      type="submit"
                      className="flex-1 bg-primary-600 hover:bg-primary-700"
                      disabled={
                        !step2Form.watch("hasScrolled") ||
                        !step2Form.watch("acceptMithaq")
                      }
                    >
                      Accept & Continue
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </form>
              </motion.div>
            )}

            {/* Step 3: Profile Setup */}
            {currentStep === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <form
                  onSubmit={step3Form.handleSubmit(onStep3Submit)}
                  className="space-y-6"
                >
                  {/* Username */}
                  <div className="space-y-2">
                    <Label htmlFor="username">Username</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="username"
                        type="text"
                        placeholder="your_username"
                        className="pl-10"
                        {...step3Form.register("username")}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      3-30 characters. Letters, numbers, and underscores only.
                    </p>
                    {step3Form.formState.errors.username && (
                      <p className="text-sm text-error">
                        {step3Form.formState.errors.username.message}
                      </p>
                    )}
                  </div>

                  {/* Full Name */}
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Full Name</Label>
                    <Input
                      id="fullName"
                      type="text"
                      placeholder="Your full name"
                      {...step3Form.register("fullName")}
                    />
                    {step3Form.formState.errors.fullName && (
                      <p className="text-sm text-error">
                        {step3Form.formState.errors.fullName.message}
                      </p>
                    )}
                  </div>

                  {/* Madhab Preference (Optional) */}
                  <div className="space-y-2">
                    <Label htmlFor="madhab">
                      Madhab Preference{" "}
                      <span className="text-muted-foreground">(Optional)</span>
                    </Label>
                    <select
                      id="madhab"
                      className="w-full px-4 py-2 border border-border rounded-md bg-background focus:ring-2 focus:ring-primary-600 focus:border-transparent"
                      {...step3Form.register("madhab")}
                    >
                      <option value="">Prefer not to say</option>
                      {MADHAB_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-muted-foreground">
                      This helps us show relevant content based on your school of
                      thought
                    </p>
                  </div>

                  <div className="flex gap-4">
                    <Button
                      type="button"
                      variant="outline"
                      className="flex-1"
                      onClick={() => setCurrentStep(2)}
                    >
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Back
                    </Button>
                    <Button
                      type="submit"
                      className="flex-1 bg-primary-600 hover:bg-primary-700"
                    >
                      Continue
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </form>
              </motion.div>
            )}

            {/* Step 4: Interest Selection */}
            {currentStep === 4 && (
              <motion.div
                key="step4"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <form
                  onSubmit={step4Form.handleSubmit(onStep4Submit)}
                  className="space-y-6"
                >
                  <div className="space-y-4">
                    <p className="text-sm text-foreground-secondary">
                      Select topics you&apos;re interested in (choose 1-10):
                    </p>

                    {/* Interest Chips */}
                    <div className="flex flex-wrap gap-2">
                      {AVAILABLE_INTERESTS.map((interest) => {
                        const isSelected = (
                          step4Form.watch("interests") || []
                        ).includes(interest);
                        return (
                          <motion.button
                            key={interest}
                            type="button"
                            onClick={() => toggleInterest(interest)}
                            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                              isSelected
                                ? "bg-primary-600 text-white shadow-primary"
                                : "bg-muted text-foreground-secondary hover:bg-muted/80 border border-border"
                            }`}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            {isSelected && (
                              <Check className="w-3 h-3 inline mr-1" />
                            )}
                            {interest}
                          </motion.button>
                        );
                      })}
                    </div>

                    {/* Selected Count */}
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        Selected: {(step4Form.watch("interests") || []).length}/10
                      </span>
                      {step4Form.formState.errors.interests && (
                        <p className="text-error">
                          {step4Form.formState.errors.interests.message}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <Button
                      type="button"
                      variant="outline"
                      className="flex-1"
                      onClick={() => setCurrentStep(3)}
                      disabled={isLoading}
                    >
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Back
                    </Button>
                    <Button
                      type="submit"
                      className="flex-1 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 shadow-primary"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Creating Account...
                        </>
                      ) : (
                        <>
                          <Sparkles className="mr-2 h-4 w-4" />
                          Create Account
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
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
          className="relative z-10 text-white text-center space-y-8 max-w-lg"
        >
          <div className="space-y-4">
            <motion.div
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              className="w-20 h-20 mx-auto bg-secondary-500/30 rounded-full flex items-center justify-center"
            >
              <div className="text-4xl">✨</div>
            </motion.div>
            <h2 className="text-4xl font-bold">Join Barakah.Social</h2>
            <p className="text-xl text-primary-100">
              A community built on faith, knowledge, and brotherhood
            </p>
          </div>

          {/* Benefits */}
          <div className="space-y-4">
            {[
              {
                icon: "📖",
                title: "Learn from Scholars",
                desc: "Connect with verified Islamic scholars",
              },
              {
                icon: "🤝",
                title: "Join Study Circles",
                desc: "Participate in Halaqas on various topics",
              },
              {
                icon: "💡",
                title: "Share Wisdom",
                desc: "Contribute beneficial knowledge to the Ummah",
              },
              {
                icon: "🌟",
                title: "Grow Spiritually",
                desc: "Support each other's Islamic journey",
              },
            ].map((benefit, index) => (
              <motion.div
                key={benefit.title}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.5 + index * 0.1 }}
                className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-left"
              >
                <div className="flex gap-4">
                  <div className="text-3xl">{benefit.icon}</div>
                  <div>
                    <h3 className="font-semibold mb-1">{benefit.title}</h3>
                    <p className="text-sm text-primary-100">{benefit.desc}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Decorative Elements */}
        <div className="absolute top-10 right-10 w-32 h-32 bg-secondary-500/20 rounded-full blur-3xl" />
        <div className="absolute bottom-10 left-10 w-40 h-40 bg-primary-400/20 rounded-full blur-3xl" />
      </div>
    </div>
  );
}

