"use client";

import { use, useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Bot,
  ChevronLeft,
  Loader2,
  MessageSquare,
  Plug,
  Plus,
  Send,
  Settings,
  Terminal,
  Trash2,
  User,
} from "lucide-react";
import { CONNECTOR_TYPE_LABELS, SUPPORTED_MODELS } from "@/types";
import { ConnectorType } from "@prisma/client";
import type { AgentConnector } from "@prisma/client";

type Message = { role: "user" | "assistant"; content: string };
type Conversation = { id: string; title: string | null; _count: { messages: number } };

type AgentDetail = {
  id: string;
  name: string;
  description: string | null;
  systemPrompt: string | null;
  model: string;
  project: { id: string; name: string };
  connectors: AgentConnector[];
  conversations: Conversation[];
};

export default function AgentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [agent, setAgent] = useState<AgentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [conversationId, setConversationId] = useState<string | undefined>();
  const bottomRef = useRef<HTMLDivElement>(null);

  // Edit state
  const [editForm, setEditForm] = useState({
    name: "",
    description: "",
    systemPrompt: "",
    model: "",
  });
  const [saving, setSaving] = useState(false);

  // Connector dialog
  const [connectorDialogOpen, setConnectorDialogOpen] = useState(false);
  const [connectorForm, setConnectorForm] = useState({
    type: "MCP_REMOTE" as ConnectorType,
    name: "",
    config: "{}",
  });
  const [addingConnector, setAddingConnector] = useState(false);

  const fetchAgent = useCallback(async () => {
    const res = await fetch(`/api/agents/${id}`);
    if (!res.ok) {
      router.push("/dashboard/projects");
      return;
    }
    const data: AgentDetail = await res.json();
    setAgent(data);
    setEditForm({
      name: data.name,
      description: data.description ?? "",
      systemPrompt: data.systemPrompt ?? "",
      model: data.model,
    });
    setLoading(false);
  }, [id, router]);

  useEffect(() => {
    fetchAgent();
  }, [fetchAgent]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function sendMessage() {
    if (!input.trim() || streaming) return;
    const userMessage = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setStreaming(true);

    let assistantContent = "";
    setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agentId: id,
          conversationId,
          message: userMessage,
        }),
      });

      if (!res.ok || !res.body) {
        throw new Error("Chat request failed");
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6);
          if (data === "[DONE]") continue;

          try {
            const parsed = JSON.parse(data);
            if (parsed.conversationId && !conversationId) {
              setConversationId(parsed.conversationId);
            }
            if (parsed.text) {
              assistantContent += parsed.text;
              setMessages((prev) => {
                const updated = [...prev];
                updated[updated.length - 1] = {
                  role: "assistant",
                  content: assistantContent,
                };
                return updated;
              });
            }
          } catch {
            // ignore parse errors
          }
        }
      }
    } catch (err) {
      console.error(err);
      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          role: "assistant",
          content: "Sorry, an error occurred. Please try again.",
        };
        return updated;
      });
    } finally {
      setStreaming(false);
    }
  }

  async function saveAgent() {
    setSaving(true);
    try {
      const res = await fetch(`/api/agents/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });
      if (res.ok) {
        const updated = await res.json();
        setAgent((a) => (a ? { ...a, ...updated } : a));
      }
    } finally {
      setSaving(false);
    }
  }

  async function addConnector() {
    let config: Record<string, unknown>;
    try {
      config = JSON.parse(connectorForm.config);
    } catch {
      alert("Config must be valid JSON");
      return;
    }
    setAddingConnector(true);
    try {
      const res = await fetch("/api/connectors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agentId: id,
          type: connectorForm.type,
          name: connectorForm.name,
          config,
        }),
      });
      if (res.ok) {
        const connector = await res.json();
        setAgent((a) =>
          a ? { ...a, connectors: [...a.connectors, connector] } : a
        );
        setConnectorDialogOpen(false);
        setConnectorForm({ type: "MCP_REMOTE", name: "", config: "{}" });
      }
    } finally {
      setAddingConnector(false);
    }
  }

  async function deleteConnector(connectorId: string) {
    await fetch(`/api/connectors/${connectorId}`, { method: "DELETE" });
    setAgent((a) =>
      a
        ? { ...a, connectors: a.connectors.filter((c) => c.id !== connectorId) }
        : a
    );
  }

  async function toggleConnector(connector: AgentConnector) {
    const res = await fetch(`/api/connectors/${connector.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enabled: !connector.enabled }),
    });
    if (res.ok) {
      const updated = await res.json();
      setAgent((a) =>
        a
          ? {
              ...a,
              connectors: a.connectors.map((c) =>
                c.id === connector.id ? updated : c
              ),
            }
          : a
      );
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!agent) return null;

  return (
    <div className="flex h-full flex-col space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild className="-ml-2">
          <Link href={`/dashboard/projects/${agent.project.id}`}>
            <ChevronLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold">{agent.name}</h1>
            <Badge variant="secondary" className="text-xs">
              {agent.model.split("-").slice(1, 3).join(" ")}
            </Badge>
            {agent.connectors.filter((c) => c.enabled).length > 0 && (
              <Badge variant="outline" className="text-xs">
                <Plug className="mr-1 h-3 w-3" />
                {agent.connectors.filter((c) => c.enabled).length} connector
                {agent.connectors.filter((c) => c.enabled).length !== 1 ? "s" : ""}
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            Project:{" "}
            <Link
              href={`/dashboard/projects/${agent.project.id}`}
              className="hover:underline"
            >
              {agent.project.name}
            </Link>
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setMessages([]);
            setConversationId(undefined);
          }}
        >
          <MessageSquare className="mr-2 h-4 w-4" />
          New Chat
        </Button>
      </div>

      <Tabs defaultValue="chat" className="flex flex-1 flex-col overflow-hidden">
        <TabsList className="w-fit">
          <TabsTrigger value="chat">
            <MessageSquare className="mr-2 h-4 w-4" />
            Chat
          </TabsTrigger>
          <TabsTrigger value="connectors">
            <Plug className="mr-2 h-4 w-4" />
            Connectors ({agent.connectors.length})
          </TabsTrigger>
          <TabsTrigger value="settings">
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </TabsTrigger>
        </TabsList>

        {/* Chat Tab */}
        <TabsContent
          value="chat"
          className="flex flex-1 flex-col overflow-hidden mt-0 border rounded-lg"
        >
          <ScrollArea className="flex-1 p-4">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <Bot className="mb-4 h-12 w-12 text-muted-foreground/50" />
                <h3 className="font-semibold">Start a conversation</h3>
                <p className="text-sm text-muted-foreground">
                  Ask {agent.name} anything. It uses your project documents as
                  context.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((msg, i) => (
                  <div
                    key={i}
                    className={`flex gap-3 ${
                      msg.role === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    {msg.role === "assistant" && (
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                        <Bot className="h-3.5 w-3.5" />
                      </div>
                    )}
                    <div
                      className={`max-w-[75%] rounded-lg px-4 py-2 text-sm ${
                        msg.role === "user"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted"
                      }`}
                    >
                      {msg.role === "assistant" ? (
                        <ReactMarkdown className="prose prose-sm dark:prose-invert max-w-none">
                          {msg.content || "▋"}
                        </ReactMarkdown>
                      ) : (
                        <p className="whitespace-pre-wrap">{msg.content}</p>
                      )}
                    </div>
                    {msg.role === "user" && (
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-secondary">
                        <User className="h-3.5 w-3.5" />
                      </div>
                    )}
                  </div>
                ))}
                <div ref={bottomRef} />
              </div>
            )}
          </ScrollArea>

          <div className="border-t p-4">
            <div className="flex gap-2">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={`Message ${agent.name}...`}
                rows={2}
                className="resize-none"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
              />
              <Button
                onClick={sendMessage}
                disabled={!input.trim() || streaming}
                size="icon"
                className="h-auto"
              >
                {streaming ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
            <p className="mt-1.5 text-xs text-muted-foreground">
              Press Enter to send, Shift+Enter for new line.
            </p>
          </div>
        </TabsContent>

        {/* Connectors Tab */}
        <TabsContent value="connectors" className="mt-4 space-y-4">
          <div className="flex justify-end">
            <Dialog
              open={connectorDialogOpen}
              onOpenChange={setConnectorDialogOpen}
            >
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Connector
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>Add Connector</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-2">
                  <div className="space-y-2">
                    <Label>Type</Label>
                    <Select
                      value={connectorForm.type}
                      onValueChange={(v) =>
                        setConnectorForm((f) => ({
                          ...f,
                          type: v as ConnectorType,
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(CONNECTOR_TYPE_LABELS).map(
                          ([value, label]) => (
                            <SelectItem key={value} value={value}>
                              {label}
                            </SelectItem>
                          )
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Name</Label>
                    <Input
                      placeholder="My Gmail Connector"
                      value={connectorForm.name}
                      onChange={(e) =>
                        setConnectorForm((f) => ({ ...f, name: e.target.value }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>
                      Configuration (JSON){" "}
                      {(connectorForm.type === "MCP_LOCAL" ||
                        connectorForm.type === "MCP_REMOTE") && (
                        <span className="text-muted-foreground">
                          — e.g.{" "}
                          {connectorForm.type === "MCP_LOCAL"
                            ? `{"command":"npx","args":["my-mcp-server"]}`
                            : `{"url":"https://my-mcp.example.com/sse"}`}
                        </span>
                      )}
                    </Label>
                    <Textarea
                      value={connectorForm.config}
                      onChange={(e) =>
                        setConnectorForm((f) => ({
                          ...f,
                          config: e.target.value,
                        }))
                      }
                      rows={4}
                      className="font-mono text-xs"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setConnectorDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={addConnector}
                    disabled={addingConnector || !connectorForm.name.trim()}
                  >
                    {addingConnector && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Add
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {agent.connectors.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-lg border p-10 text-center">
              <Terminal className="mb-3 h-10 w-10 text-muted-foreground/50" />
              <h3 className="mb-1 font-semibold">No connectors</h3>
              <p className="text-sm text-muted-foreground">
                Connect this agent to Gmail, OneDrive, MCP servers, and more.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {agent.connectors.map((connector) => (
                <div
                  key={connector.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded-md ${
                        connector.enabled
                          ? "bg-primary/10 text-primary"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      <Plug className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{connector.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {CONNECTOR_TYPE_LABELS[connector.type]}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={connector.enabled ? "success" : "secondary"}
                      className="cursor-pointer text-xs"
                      onClick={() => toggleConnector(connector)}
                    >
                      {connector.enabled ? "Enabled" : "Disabled"}
                    </Badge>
                    <button
                      onClick={() => deleteConnector(connector.id)}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="mt-4 space-y-4 max-w-xl">
          <div className="space-y-2">
            <Label>Agent Name</Label>
            <Input
              value={editForm.name}
              onChange={(e) =>
                setEditForm((f) => ({ ...f, name: e.target.value }))
              }
            />
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Input
              value={editForm.description}
              onChange={(e) =>
                setEditForm((f) => ({ ...f, description: e.target.value }))
              }
              placeholder="What does this agent do?"
            />
          </div>
          <div className="space-y-2">
            <Label>Model</Label>
            <Select
              value={editForm.model}
              onValueChange={(v) => setEditForm((f) => ({ ...f, model: v }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SUPPORTED_MODELS.map((m) => (
                  <SelectItem key={m.value} value={m.value}>
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>System Prompt</Label>
            <Textarea
              value={editForm.systemPrompt}
              onChange={(e) =>
                setEditForm((f) => ({ ...f, systemPrompt: e.target.value }))
              }
              placeholder="You are a helpful assistant that specializes in..."
              rows={6}
            />
          </div>
          <Button onClick={saveAgent} disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </TabsContent>
      </Tabs>
    </div>
  );
}
