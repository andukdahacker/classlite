import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  CenterSignupRequestSchema,
  type CenterSignupRequest,
} from "@workspace/types";
import { Button } from "@workspace/ui/components/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@workspace/ui/components/form";
import { Input } from "@workspace/ui/components/input";
import { GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import { firebaseAuth } from "@/core/firebase";
import {
  useSignupCenterMutation,
  useSignupCenterWithGoogleMutation,
} from "../auth.hooks";
import { useAuth } from "../auth-context";
import { useNavigate } from "react-router";
import { toast } from "sonner";

export function SignupCenterForm() {
  const navigate = useNavigate();
  const { setSignupInProgress } = useAuth();
  const { mutateAsync: signup, isPending } = useSignupCenterMutation();
  const { mutateAsync: signupWithGoogle, isPending: isGooglePending } =
    useSignupCenterWithGoogleMutation();

  const form = useForm<CenterSignupRequest>({
    resolver: zodResolver(CenterSignupRequestSchema),
    defaultValues: {
      centerName: "",
      centerSlug: "",
      ownerEmail: "",
      ownerName: "",
      password: "",
    },
  });

  const onSubmit = async (data: CenterSignupRequest) => {
    try {
      await signup(data);
      toast.success("Center registered successfully!");
      navigate("/dashboard/owner");
    } catch (error: any) {
      toast.error(error.message || "Signup failed");
    }
  };

  const onGoogleSignup = async () => {
    // Validate only center fields
    const isCenterValid = await form.trigger(["centerName", "centerSlug"]);
    if (!isCenterValid) {
      toast.error("Please provide valid center details first");
      return;
    }

    // Prevent auth context from calling login before signup completes
    console.log("Setting signup in progress to true");
    setSignupInProgress(true);

    try {
      const provider = new GoogleAuthProvider();
      console.log("Calling signInWithPopup");
      const result = await signInWithPopup(firebaseAuth, provider);
      console.log("signInWithPopup completed");
      console.log("Getting idToken...");
      const idToken = await result.user.getIdToken();
      console.log("Got idToken, calling signupWithGoogle...");

      await signupWithGoogle({
        idToken,
        centerName: form.getValues("centerName"),
        centerSlug: form.getValues("centerSlug"),
      });

      console.log("signupWithGoogle completed successfully");
      setSignupInProgress(false);
      toast.success("Center registered successfully with Google!");
      navigate("/dashboard");
    } catch (error: any) {
      console.log("Signup error caught:", error);
      setSignupInProgress(false);
      // Force sign out if registration fails so user state doesn't get stuck
      await signOut(firebaseAuth);
      toast.error(error.message || "Google signup failed");
    }
  };

  const centerName = form.watch("centerName");
  React.useEffect(() => {
    const slug = centerName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "");
    form.setValue("centerSlug", slug, { shouldValidate: true });
  }, [centerName, form]);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="centerName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Center Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g. British Council" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="centerSlug"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Center Slug</FormLabel>
              <FormControl>
                <Input placeholder="e.g. british-council" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={onGoogleSignup}
          disabled={isPending || isGooglePending}
        >
          {isGooglePending ? "Connecting..." : "Continue with Google"}
        </Button>

        <div className="relative py-4">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">
              Or sign up with email
            </span>
          </div>
        </div>

        <FormField
          control={form.control}
          name="ownerName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Owner Name</FormLabel>
              <FormControl>
                <Input placeholder="Your full name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="ownerEmail"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input
                  type="email"
                  placeholder="owner@example.com"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <Input
                  type="password"
                  placeholder="Min 8 characters"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button
          type="submit"
          className="w-full"
          disabled={isPending || isGooglePending}
        >
          {isPending ? "Creating Center..." : "Register with Email"}
        </Button>
      </form>
    </Form>
  );
}
