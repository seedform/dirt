import { auth0 } from "@/lib/auth0";
import { createSurveyAction, getDashboardData, getSurveyLink } from "@/lib/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { CopyLinkButton } from "@/components/copy-link-button";

export default auth0.withPageAuthRequired(
  async function DashboardPage() {
    const session = await auth0.getSession();
    const user = session!.user;
    const data = await getDashboardData(user.sub);

    return (
      <div className="flex flex-1 flex-col items-center gap-6 p-6">
        <p className="text-lg text-muted-foreground">Logged in as {user.email}</p>

        {data.survey === null ? (
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>No survey yet</CardTitle>
              <CardDescription>
                Generate a unique link to start collecting dietary restriction submissions.
              </CardDescription>
            </CardHeader>
            <CardFooter className="justify-end">
              <form action={createSurveyAction}>
                <Button type="submit">Generate Survey Link</Button>
              </form>
            </CardFooter>
          </Card>
        ) : (
          <>
            <Card className="w-full max-w-md">
              <CardHeader>
                <CardTitle>Your survey link</CardTitle>
                <CardDescription>Share this link to collect submissions.</CardDescription>
              </CardHeader>
              <CardContent className="flex items-center gap-2">
                <Input readOnly value={getSurveyLink(data.survey.id)} className="flex-1" />
                <CopyLinkButton link={getSurveyLink(data.survey.id)} />
              </CardContent>
            </Card>

            <Card className="w-full max-w-md">
              <CardHeader>
                <CardTitle>Dietary restriction summary</CardTitle>
                <CardDescription>
                  {data.totalSubmissions} submission{data.totalSubmissions === 1 ? "" : "s"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {data.aggregation.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No submissions yet.</p>
                ) : (
                  <ul className="flex flex-col gap-1.5">
                    {data.aggregation.map((item) => (
                      <li key={item.label} className="flex items-center justify-between text-sm">
                        <span>{item.label}</span>
                        <span className="font-medium">{item.count}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    );
  },
  { returnTo: "/dashboard" }
);
