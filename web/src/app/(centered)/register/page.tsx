import type { Metadata } from "next";
import { copy } from "@/lib/copy";
import { RegisterForm } from "./register-form";

export const metadata: Metadata = { title: copy.account.register.title };

export default function RegisterPage() {
  return (
    <>
      <h1 className="text-page-title font-extrabold tracking-tight">
        {copy.account.register.title}
      </h1>
      <p className="mt-1 mb-6 text-body text-muted-foreground">{copy.account.register.subtitle}</p>
      <RegisterForm />
    </>
  );
}
