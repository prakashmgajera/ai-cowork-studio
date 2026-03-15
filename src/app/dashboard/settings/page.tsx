import { auth } from "@/lib/auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Bot, Globe, Shield, Terminal } from "lucide-react";

export default async function SettingsPage() {
  const session = await auth();
  const user = session!.user!;
  const initials = user.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) ?? "U";

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Manage your account and workspace.</p>
      </div>

      {/* Profile */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Profile</CardTitle>
          <CardDescription>Your Google account information.</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center gap-4">
          <Avatar className="h-14 w-14">
            <AvatarImage src={user.image ?? ""} alt={user.name ?? "User"} />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <div>
            <p className="font-semibold">{user.name}</p>
            <p className="text-sm text-muted-foreground">{user.email}</p>
            <Badge variant="secondary" className="mt-1 text-xs">
              <Shield className="mr-1 h-3 w-3" />
              Google OAuth
            </Badge>
          </div>
        </CardContent>
      </Card>

      <Separator />

      {/* Available Models */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Bot className="h-4 w-4" />
            Available Claude Models
          </CardTitle>
          <CardDescription>
            Models you can assign to individual agents.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {[
            {
              id: "claude-opus-4-6",
              name: "Claude Opus 4.6",
              desc: "Most capable — best for complex reasoning, long documents, and nuanced tasks.",
            },
            {
              id: "claude-sonnet-4-6",
              name: "Claude Sonnet 4.6",
              desc: "Recommended — excellent balance of capability and speed.",
              recommended: true,
            },
            {
              id: "claude-haiku-4-5-20251001",
              name: "Claude Haiku 4.5",
              desc: "Fastest and most cost-efficient — great for high-volume, simple tasks.",
            },
          ].map((model) => (
            <div key={model.id} className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium">{model.name}</p>
                  {model.recommended && (
                    <Badge variant="default" className="text-xs">
                      Recommended
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">{model.desc}</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* MCP Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Terminal className="h-4 w-4" />
            MCP Server Integration
          </CardTitle>
          <CardDescription>
            Connect agents to Model Context Protocol servers.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="rounded-lg bg-muted p-4 space-y-2">
            <p className="font-medium">Local MCP Server (stdio)</p>
            <code className="text-xs block text-muted-foreground">
              config: {"{"}&quot;command&quot;: &quot;npx&quot;, &quot;args&quot;: [&quot;@my/mcp-server&quot;]{"}"}
            </code>
          </div>
          <div className="rounded-lg bg-muted p-4 space-y-2">
            <p className="font-medium">Remote MCP Server (SSE)</p>
            <code className="text-xs block text-muted-foreground">
              config: {"{"}&quot;url&quot;: &quot;https://my-mcp-server.example.com/sse&quot;{"}"}
            </code>
          </div>
          <p className="text-xs text-muted-foreground">
            Add connectors on any agent&apos;s Connectors tab. Both MCP_LOCAL and
            MCP_REMOTE types are supported.
          </p>
        </CardContent>
      </Card>

      {/* External Connectors */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Globe className="h-4 w-4" />
            External Connectors
          </CardTitle>
          <CardDescription>
            Supported external service integrations.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {["Gmail", "OneDrive", "Google Drive", "Slack", "Notion"].map(
              (service) => (
                <div
                  key={service}
                  className="flex items-center gap-2 rounded-lg border p-2 text-sm"
                >
                  <div className="h-2 w-2 rounded-full bg-green-500" />
                  {service}
                </div>
              )
            )}
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Configure OAuth tokens and API keys per connector on the agent&apos;s
            Connectors tab.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
