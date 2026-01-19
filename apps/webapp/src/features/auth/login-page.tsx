import { GoogleLoginButton } from "./components/google-login-button";
import { LoginForm } from "./components/login-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { Separator } from "@workspace/ui/components/separator";
import { Link } from "react-router";

export function LoginPage() {
  return (
    <div className="flex h-screen w-screen items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold">Sign in</CardTitle>
          <CardDescription>
            Choose your preferred sign in method
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <GoogleLoginButton />
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <Separator className="w-full" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Or continue with email
              </span>
            </div>
          </div>
          <LoginForm />
          <div className="text-center text-sm">
            Don't have a center yet?{" "}
            <Link to="/sign-up/center" className="underline underline-offset-4">
              Register Center
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
