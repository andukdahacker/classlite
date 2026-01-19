import { SignupCenterForm } from "./components/signup-center-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { Link } from "react-router";

export function SignupCenterPage() {
  return (
    <div className="flex h-screen w-screen items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold">
            Register your Center
          </CardTitle>
          <CardDescription>
            Enter your center details and owner information
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <SignupCenterForm />
          <div className="text-center text-sm">
            Already have an account?{" "}
            <Link to="/login" className="underline underline-offset-4">
              Sign in
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
