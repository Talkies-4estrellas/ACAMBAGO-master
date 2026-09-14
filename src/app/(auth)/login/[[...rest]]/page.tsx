import { SignIn } from "@clerk/nextjs";
import { clerkAppearance } from "@/lib/clerk-appearance";

export default function LoginPage() {
  return <SignIn appearance={clerkAppearance} signUpUrl="/register" />;
}
