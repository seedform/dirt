import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function SurveyNotFound() {
  return (
    <div className="flex flex-1 flex-col items-center gap-6 p-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Survey not found</CardTitle>
          <CardDescription>This survey link is invalid or no longer exists.</CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}
