"use client";

import Link from "next/link";
import { useUser } from "@auth0/nextjs-auth0/client";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function Nav() {
  const { user, isLoading } = useUser();

  return (
    <header className="flex items-center justify-between border-b border-border px-6 py-4">
      <Link href="/" className="text-sm font-semibold text-foreground">
        dirt
      </Link>
      {!isLoading && (
        <div className="flex items-center gap-3">
          {user ? (
            <>
              <span className="text-sm text-muted-foreground">
                {user.email}
              </span>
              <a
                href="/auth/logout"
                className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
              >
                Logout
              </a>
            </>
          ) : (
            <a
              href="/auth/login"
              className={cn(buttonVariants({ variant: "default", size: "sm" }))}
            >
              Login
            </a>
          )}
        </div>
      )}
    </header>
  );
}
