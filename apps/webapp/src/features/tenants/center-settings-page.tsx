import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { UpdateCenterSchema, type UpdateCenterInput } from "@workspace/types";
import { useTenant } from "./tenant-context";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@workspace/ui/components/form";
import { Input } from "@workspace/ui/components/input";
import { Button } from "@workspace/ui/components/button";
import { toast } from "sonner";
import { Loader2, Upload } from "lucide-react";
import { Label } from "@workspace/ui/components/label";

export const CenterSettingsPage: React.FC = () => {
  const { tenant, updateBranding, uploadLogo, isLoading } = useTenant();

  const form = useForm<UpdateCenterInput>({
    resolver: zodResolver(UpdateCenterSchema),
    defaultValues: {
      name: tenant?.name || "",
      brandColor: tenant?.brandColor || "#2563EB",
      timezone: tenant?.timezone || "UTC",
    },
  });

  // Update form values when tenant data loads
  React.useEffect(() => {
    if (tenant) {
      form.reset({
        name: tenant.name,
        brandColor: tenant.brandColor,
        timezone: tenant.timezone,
      });
    }
  }, [tenant, form]);

  const onSubmit = async (values: UpdateCenterInput) => {
    try {
      await updateBranding(values);
      toast.success("Center settings updated successfully");
    } catch {
      toast.error("Failed to update center settings");
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error("Logo must be less than 2MB");
      return;
    }

    try {
      const promise = uploadLogo(file);
      toast.promise(promise, {
        loading: "Uploading logo...",
        success: "Logo uploaded successfully",
        error: "Failed to upload logo",
      });
      await promise;
    } catch (error) {
      console.error(error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container max-w-2xl py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Center Settings</h1>
        <p className="text-muted-foreground">
          Manage your center&apos;s branding and regional settings.
        </p>
      </div>

      <div className="space-y-8">
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Branding</h2>
          <div className="flex items-center gap-6">
            <div className="relative flex size-24 items-center justify-center overflow-hidden rounded-lg border bg-muted">
              {tenant?.logoUrl ? (
                <img
                  src={tenant.logoUrl}
                  alt="Center Logo"
                  className="size-full object-contain"
                />
              ) : (
                <Upload className="size-8 text-muted-foreground" />
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="logo" className="cursor-pointer">
                <Button variant="outline" asChild>
                  <span>
                    <Upload className="mr-2 size-4" />
                    Change Logo
                  </span>
                </Button>
                <Input
                  id="logo"
                  type="file"
                  className="hidden"
                  accept="image/png,image/jpeg"
                  onChange={handleLogoUpload}
                />
              </Label>
              <p className="text-xs text-muted-foreground">
                Max size 2MB. PNG or JPG recommended.
              </p>
            </div>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Center Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. ClassLite Academy" {...field} />
                  </FormControl>
                  <FormDescription>
                    This name will be displayed in the navigation and emails.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="brandColor"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Brand Color</FormLabel>
                  <div className="flex items-center gap-4">
                    <FormControl>
                      <Input type="color" className="size-10 p-1" {...field} />
                    </FormControl>
                    <Input {...field} className="font-mono" />
                  </div>
                  <FormDescription>
                    Your center&apos;s primary color. Used for buttons and
                    highlights.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="timezone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Timezone</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Asia/Ho_Chi_Minh" {...field} />
                  </FormControl>
                  <FormDescription>
                    The default timezone for schedules and attendance.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting && (
                <Loader2 className="mr-2 size-4 animate-spin" />
              )}
              Save Changes
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
};

