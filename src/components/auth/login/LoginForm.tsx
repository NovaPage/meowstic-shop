// src/components/auth/login/LoginForm.tsx
"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { getBrowserClient } from "@/lib/supabase/client";
import type { SupabaseClient, AuthError } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

/**
 * Email/password sign-in using Supabase.
 * UI strings in Spanish; code/comments in English.
 */
export default function LoginForm(): React.JSX.Element {
  const router = useRouter();
  const [email, setEmail] = React.useState<string>("");
  const [password, setPassword] = React.useState<string>("");
  const [loading, setLoading] = React.useState<boolean>(false);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    try {
      const supabase: SupabaseClient<Database> = getBrowserClient();
      const { error }: { error: AuthError | null } =
        await supabase.auth.signInWithPassword({ email, password });

      if (error) {
        setErrorMsg(error.message ?? "No se pudo iniciar sesión.");
        return;
      }

      router.replace("/dashboard");
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorMsg(err.message);
      } else {
        setErrorMsg("Error inesperado al iniciar sesión.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-sm border border-border shadow-sm">
      <CardHeader className="space-y-2">
        <CardTitle className="text-2xl">Iniciar sesión</CardTitle>
        <CardDescription>Accede con tu correo y contraseña.</CardDescription>
      </CardHeader>

      <CardContent>
        {errorMsg && (
          <Alert variant="destructive" className="mb-4">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{errorMsg}</AlertDescription>
          </Alert>
        )}

        <form className="space-y-4" onSubmit={onSubmit} noValidate>
          <div className="grid gap-2">
            <Label htmlFor="email">Correo</Label>
            <Input
              id="email"
              name="email"
              type="email"
              inputMode="email"
              placeholder="tu@correo.com"
              autoComplete="email"
              required
              value={email}
              onChange={(ev: React.ChangeEvent<HTMLInputElement>): void =>
                setEmail(ev.currentTarget.value)
              }
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="password">Contraseña</Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(ev: React.ChangeEvent<HTMLInputElement>): void =>
                setPassword(ev.currentTarget.value)
              }
            />
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Ingresando..." : "Entrar"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
