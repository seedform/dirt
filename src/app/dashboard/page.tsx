import { auth0 } from "@/lib/auth0";

export default auth0.withPageAuthRequired(
  async function DashboardPage() {
    const session = await auth0.getSession();

    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-lg text-muted-foreground">
          Logged in as {session!.user.email}
        </p>
      </div>
    );
  },
  { returnTo: "/dashboard" }
);
