"use client";

import { zodResolver } from "@hookform/resolvers/zod";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select";
import { EyeClosedIcon, EyeIcon, Loader2Icon } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import z from "zod/v4";
import { useCreateUser } from "../hooks/use-create-user";

const addUserInputSchema = z.object({
  email: z
    .email({ error: "Invalid email format" })
    .nonempty({ error: "Please input email" }),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters long")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>?]).*$/,
      "Password must contain at least 1 uppercase letter, 1 lowercase letter, 1 number, and 1 symbol",
    ),
  role: z
    .union([z.literal("ADMIN"), z.literal("TEACHER"), z.literal("STUDENT")])
    .nonoptional({ error: "Please select a role" }),
  firstName: z.string(),
  lastName: z.string(),
  phoneNumber: z.string().optional(),
});

export type AddUserInput = z.infer<typeof addUserInputSchema>;

interface AddUserFormProps {
  onCreateUser?: () => void;
}

function AddUserForm({
  className,
  onCreateUser,
  ...props
}: React.ComponentProps<"form"> & AddUserFormProps) {
  const [showPassword, setShowPassword] = useState(false);
  const form = useForm<AddUserInput>({
    resolver: zodResolver(addUserInputSchema),
    defaultValues: {
      email: "",
      password: "",
      role: "ADMIN",
    },
  });

  const { mutate, isPending } = useCreateUser({
    onSuccess: () => {
      if (onCreateUser) {
        onCreateUser();
      }
    },
  });

  return (
    <Form {...form}>
      <form
        {...props}
        className="flex flex-col gap-4"
        onSubmit={form.handleSubmit((values) => {
          mutate({
            ...values,
            username: values.firstName + " " + values.lastName,
          });
        })}
      >
        <div className="flex flex-row gap-4 items-center">
          <FormField
            control={form.control}
            name="firstName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>First name</FormLabel>
                <FormControl>
                  <Input {...field} required />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="lastName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Last name</FormLabel>
                <FormControl>
                  <Input {...field} required />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" {...field} required />
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
                <div className="flex flex-row gap-2">
                  <Input
                    type={showPassword ? "text" : "password"}
                    {...field}
                    required
                  />
                  <Button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeClosedIcon /> : <EyeIcon />}
                  </Button>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex flex-row gap-2">
          <FormField
            control={form.control}
            name="phoneNumber"
            render={({ field }) => (
              <FormItem className="grow">
                <FormLabel>Phone number</FormLabel>
                <FormControl>
                  <Input {...field} type="tel" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="role"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Role</FormLabel>
                <FormControl>
                  <Select value={field.value}>
                    <SelectTrigger>
                      <SelectValue placeholder={"Role"} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ADMIN">ADMIN</SelectItem>

                      <SelectItem value="TEACHER">TEACHER</SelectItem>

                      <SelectItem value="STUDENT">STUDENT</SelectItem>
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <Button type="submit" disabled={isPending}>
          {isPending ? <Loader2Icon className="animate-spin" /> : "Create"}
        </Button>
      </form>
    </Form>
  );
}

export { AddUserForm };
