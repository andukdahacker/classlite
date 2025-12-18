import type { User } from "@workspace/types";
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
import { Loader2Icon } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod/v4";
import { useUpdateUser } from "../hooks/use-update-user";

const updateUserInputSchema = z.object({
  email: z
    .email({ error: "Invalid email format" })
    .nonempty({ error: "Please input email" }),
  role: z
    .union([z.literal("ADMIN"), z.literal("TEACHER"), z.literal("STUDENT")])
    .nonoptional({ error: "Please select a role" }),
  firstName: z.string(),
  lastName: z.string(),
  phoneNumber: z.string().optional(),
});

type UpdateUserInput = z.infer<typeof updateUserInputSchema>;

interface UpdateUserFormProps {
  user: User;
  onUpdateUserSucess?: (user: User) => void;
}

function UpdateUserForm({
  className,
  onUpdateUserSucess,
  user,
  ...props
}: React.ComponentProps<"form"> & UpdateUserFormProps) {
  const form = useForm<UpdateUserInput>({
    defaultValues: {
      email: user.email,
      firstName: user.firstName ?? "",
      lastName: user.lastName ?? "",
      phoneNumber: user.phoneNumber ?? "",
      role: user.role,
    },
  });

  const { mutate, isPending } = useUpdateUser({
    onSuccess: (user) => {
      if (onUpdateUserSucess) {
        onUpdateUserSucess(user);
      }
    },
  });
  return (
    <Form {...form}>
      <form
        {...props}
        className="flex flex-col gap-4"
        onSubmit={form.handleSubmit((values) =>
          mutate({ ...values, userId: user.id }),
        )}
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
          {isPending ? <Loader2Icon className="animate-spin" /> : "Edit"}
        </Button>
      </form>
    </Form>
  );
}

export { UpdateUserForm };
