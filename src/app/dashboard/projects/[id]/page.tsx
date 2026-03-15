"use client";

import { use, useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Bot,
  ChevronLeft,
  FileText,
  Loader2,
  MessageSquare,
  Plus,
  Trash2,
  Upload,
} from "lucide-react";
import { SUPPORTED_MODELS } from "@/types";
import { formatBytes } from "@/lib/utils";
import type { Agent, Document } from "@prisma/client";

type ProjectDetail = {
  id: string;
  name: string;
  description: string | null;
  agents: (Agent & { _count: { conversations: number } })[];
  documents: (Document & { _count: { chunks: number } })[];
};

export default function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [project, setProject] = useState<ProjectDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [agentDialogOpen, setAgentDialogOpen] = useState(false);
  const [agentForm, setAgentForm] = useState({
    name: "",
    description: "",
    systemPrompt: "",
    model: "claude-sonnet-4-6",
  });
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);

  const fetchProject = useCallback(async () => {
    const res = await fetch(`/api/projects/${id}`);
    if (!res.ok) {
      router.push("/dashboard/projects");
      return;
    }
    setProject(await res.json());
    setLoading(false);
  }, [id, router]);

  useEffect(() => {
    fetchProject();
  }, [fetchProject]);

  async function createAgent() {
    if (!agentForm.name.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/agents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...agentForm, projectId: id }),
      });
      if (res.ok) {
        await fetchProject();
        setAgentDialogOpen(false);
        setAgentForm({
          name: "",
          description: "",
          systemPrompt: "",
          model: "claude-sonnet-4-6",
        });
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function deleteAgent(agentId: string) {
    if (!confirm("Delete this agent and all its conversations?")) return;
    await fetch(`/api/agents/${agentId}`, { method: "DELETE" });
    setProject((p) =>
      p ? { ...p, agents: p.agents.filter((a) => a.id !== agentId) } : p
    );
  }

  async function uploadDocument(file: File) {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("projectId", id);
      const res = await fetch("/api/documents", { method: "POST", body: formData });
      if (res.ok) {
        await fetchProject();
      } else {
        const err = await res.json();
        alert(err.error ?? "Upload failed");
      }
    } finally {
      setUploading(false);
    }
  }

  async function deleteDocument(docId: string) {
    if (!confirm("Delete this document?")) return;
    await fetch(`/api/documents/${docId}`, { method: "DELETE" });
    setProject((p) =>
      p ? { ...p, documents: p.documents.filter((d) => d.id !== docId) } : p
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!project) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Button variant="ghost" size="icon" asChild className="-ml-2 mt-0.5">
          <Link href="/dashboard/projects">
            <ChevronLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">{project.name}</h1>
          {project.description && (
            <p className="text-muted-foreground">{project.description}</p>
          )}
        </div>
      </div>

      <Tabs defaultValue="agents">
        <TabsList>
          <TabsTrigger value="agents">
            <Bot className="mr-2 h-4 w-4" />
            Agents ({project.agents.length})
          </TabsTrigger>
          <TabsTrigger value="documents">
            <FileText className="mr-2 h-4 w-4" />
            Documents ({project.documents.length})
          </TabsTrigger>
        </TabsList>

        {/* Agents Tab */}
        <TabsContent value="agents" className="mt-4 space-y-4">
          <div className="flex justify-end">
            <Dialog open={agentDialogOpen} onOpenChange={setAgentDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="mr-2 h-4 w-4" />
                  New Agent
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>Create AI Agent</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-2">
                  <div className="space-y-2">
                    <Label>Name</Label>
                    <Input
                      placeholder="Customer Support Agent"
                      value={agentForm.name}
                      onChange={(e) =>
                        setAgentForm((f) => ({ ...f, name: e.target.value }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Description (optional)</Label>
                    <Input
                      placeholder="What does this agent do?"
                      value={agentForm.description}
                      onChange={(e) =>
                        setAgentForm((f) => ({ ...f, description: e.target.value }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Model</Label>
                    <Select
                      value={agentForm.model}
                      onValueChange={(v) => setAgentForm((f) => ({ ...f, model: v }))}
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
                    <Label>System Prompt (optional)</Label>
                    <Textarea
                      placeholder="You are a helpful assistant that specializes in..."
                      value={agentForm.systemPrompt}
                      onChange={(e) =>
                        setAgentForm((f) => ({
                          ...f,
                          systemPrompt: e.target.value,
                        }))
                      }
                      rows={4}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setAgentDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={createAgent}
                    disabled={submitting || !agentForm.name.trim()}
                  >
                    {submitting && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Create Agent
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {project.agents.length === 0 ? (
            <Card className="flex flex-col items-center justify-center p-10 text-center">
              <Bot className="mb-3 h-10 w-10 text-muted-foreground/50" />
              <h3 className="mb-1 font-semibold">No agents yet</h3>
              <p className="text-sm text-muted-foreground">
                Create an agent to start chatting with AI.
              </p>
            </Card>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {project.agents.map((agent) => (
                <Card key={agent.id} className="group relative">
                  <Link href={`/dashboard/agents/${agent.id}`}>
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <CardTitle className="text-sm">{agent.name}</CardTitle>
                        <Badge variant="secondary" className="text-xs">
                          {agent.model.split("-").slice(1, 3).join(" ")}
                        </Badge>
                      </div>
                      {agent.description && (
                        <CardDescription className="line-clamp-1 text-xs">
                          {agent.description}
                        </CardDescription>
                      )}
                    </CardHeader>
                    <CardContent className="pb-3">
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <MessageSquare className="h-3 w-3" />
                        {agent._count.conversations} conversation
                        {agent._count.conversations !== 1 ? "s" : ""}
                      </span>
                    </CardContent>
                  </Link>
                  <button
                    onClick={() => deleteAgent(agent.id)}
                    className="absolute right-2 top-2 hidden rounded p-1 text-muted-foreground hover:text-destructive group-hover:block"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Documents Tab */}
        <TabsContent value="documents" className="mt-4 space-y-4">
          <div className="flex justify-end">
            <label className="cursor-pointer">
              <input
                type="file"
                className="hidden"
                accept=".pdf,.docx,.doc,.txt,.md,.csv"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) uploadDocument(file);
                  e.target.value = "";
                }}
              />
              <Button size="sm" asChild>
                <span>
                  {uploading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Upload className="mr-2 h-4 w-4" />
                  )}
                  Upload Document
                </span>
              </Button>
            </label>
          </div>

          {project.documents.length === 0 ? (
            <Card className="flex flex-col items-center justify-center p-10 text-center">
              <FileText className="mb-3 h-10 w-10 text-muted-foreground/50" />
              <h3 className="mb-1 font-semibold">No documents yet</h3>
              <p className="text-sm text-muted-foreground">
                Upload PDFs, Word docs, or text files for RAG context.
              </p>
            </Card>
          ) : (
            <div className="space-y-2">
              {project.documents.map((doc) => (
                <div
                  key={doc.id}
                  className="group flex items-center justify-between rounded-lg border p-3"
                >
                  <div className="flex items-center gap-3">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">{doc.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatBytes(doc.size)} · {doc._count.chunks} chunks
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => deleteDocument(doc.id)}
                    className="hidden text-muted-foreground hover:text-destructive group-hover:block"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
          <p className="text-xs text-muted-foreground">
            Supported formats: PDF, Word (.docx), plain text, Markdown, CSV (max{" "}
            {process.env.MAX_FILE_SIZE_MB ?? 10}MB)
          </p>
        </TabsContent>
      </Tabs>
    </div>
  );
}
