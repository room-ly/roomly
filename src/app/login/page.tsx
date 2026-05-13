import { Suspense } from "react";
import LoginPage from "@/components/LoginPage";

export default function LoginRoute() {
  return (
    <Suspense fallback={null}>
      <LoginPage />
    </Suspense>
  );
}
