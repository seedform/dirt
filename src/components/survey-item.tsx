import { ChevronDownIcon } from "lucide-react";
import { type SurveyWithStats, getSurveyLink } from "@/lib/actions";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import { CopyLinkButton } from "@/components/copy-link-button";

export function SurveyItem({ survey }: { survey: SurveyWithStats }) {
  const link = getSurveyLink(survey.id);

  return (
    <Card className="w-full">
      <Collapsible>
        <CollapsibleTrigger className="group flex w-full items-center gap-2 text-left">
          <CardHeader className="flex-1">
            <CardTitle>{survey.teamName}</CardTitle>
            <CardDescription>
              {survey.totalSubmissions} submission{survey.totalSubmissions === 1 ? "" : "s"}
            </CardDescription>
          </CardHeader>
          <ChevronDownIcon className="mr-(--card-spacing) size-4 shrink-0 text-muted-foreground transition-transform group-data-[panel-open]:rotate-180" />
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="flex flex-col gap-4 pb-(--card-spacing)">
            <div className="flex items-center gap-2">
              <Input readOnly value={link} className="flex-1" />
              <CopyLinkButton link={link} />
            </div>

            {survey.aggregation.length === 0 ? (
              <p className="text-sm text-muted-foreground">No submissions yet.</p>
            ) : (
              <ul className="flex flex-col gap-1.5">
                {survey.aggregation.map((item) => (
                  <li key={item.label} className="flex items-center justify-between text-sm">
                    <span>{item.label}</span>
                    <span className="font-medium">{item.count}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
