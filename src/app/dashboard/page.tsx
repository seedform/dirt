import { auth0 } from "@/lib/auth0";
import { createSurveyAction, getDashboardData } from "@/lib/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { SurveyItem } from "@/components/survey-item";

export default auth0.withPageAuthRequired(
  async function DashboardPage() {
    const session = await auth0.getSession();
    const user = session!.user;
    const data = await getDashboardData(user.sub);

    return (
      <div className="flex flex-1 flex-col items-center gap-6 p-6">
        <p className="text-lg text-muted-foreground">Logged in as {user.email}</p>

        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>New survey</CardTitle>
            <CardDescription>
              Generate a unique link to start collecting dietary restriction submissions for a
              team.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form action={createSurveyAction} className="flex items-center gap-2">
              <Input
                name="teamName"
                placeholder="Team name"
                required
                className="flex-1"
              />
              <Button type="submit">Generate Link</Button>
            </form>
          </CardContent>
        </Card>

        {data.surveys.length === 0 ? (
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>No surveys yet</CardTitle>
              <CardDescription>
                Create your first survey above to get started.
              </CardDescription>
            </CardHeader>
          </Card>
        ) : (
          <div className="flex w-full max-w-md flex-col gap-3">
            {data.surveys.map((survey) => (
              <SurveyItem key={survey.id} survey={survey} />
            ))}
          </div>
        )}
      </div>
    );
  },
  { returnTo: "/dashboard" }
);
