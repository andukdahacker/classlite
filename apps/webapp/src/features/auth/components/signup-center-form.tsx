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
import { useSignupCenterMutation } from "../auth.hooks";
import { useNavigate } from "react-router";
import { toast } from "sonner";

export function SignupCenterForm() {
  const navigate = useNavigate();
  const { mutateAsync: signup, isPending } = useSignupCenterMutation();

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
        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending ? "Creating Center..." : "Register Center"}
        </Button>
      </form>
    </Form>
  );
}
