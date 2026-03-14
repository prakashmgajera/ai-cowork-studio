import Link from "next/link";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Bot,
  CloudCog,
  FileText,
  Globe,
  MessageSquare,
  Sparkles,
  Terminal,
  Zap,
} from "lucide-react";

export default async function LandingPage() {
  const session = await auth();
  if (session) redirect("/dashboard");

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Nav */}
      <nav className="flex items-center justify-between px-8 py-5">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <Sparkles className="h-4 w-4 text-white" />
          </div>
          <span className="text-lg font-bold text-white">AI Cowork Studio</span>
        </div>
        <Button asChild variant="outline" className="border-white/20 bg-white/10 text-white hover:bg-white/20">
          <Link href="/login">Sign in</Link>
        </Button>
      </nav>

      {/* Hero */}
      <section className="px-8 py-24 text-center">
        <div className="mx-auto max-w-4xl">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-purple-400/30 bg-purple-400/10 px-4 py-1.5 text-sm text-purple-300">
            <Sparkles className="h-3.5 w-3.5" />
            Powered by Claude AI
          </div>
          <h1 className="mb-6 text-5xl font-bold leading-tight text-white md:text-6xl">
            Your Personal{" "}
            <span className="bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
              AI Cowork
            </span>{" "}
            Studio
          </h1>
          <p className="mb-10 text-xl text-slate-300">
            Build intelligent AI agents, connect to external services, upload
            documents for context-aware RAG, and integrate with MCP servers —
            all in one place.
          </p>
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Button
              asChild
              size="lg"
              className="gap-2 bg-primary px-8 text-base hover:bg-primary/90"
            >
              <Link href="/login">
                <Sparkles className="h-4 w-4" />
                Get Started Free
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="px-8 py-16">
        <div className="mx-auto max-w-6xl">
          <h2 className="mb-12 text-center text-3xl font-bold text-white">
            Everything you need to build AI agents
          </h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="rounded-xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm"
              >
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/20">
                  <feature.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="mb-2 font-semibold text-white">
                  {feature.title}
                </h3>
                <p className="text-sm text-slate-400">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-8 py-20 text-center">
        <div className="mx-auto max-w-2xl">
          <h2 className="mb-4 text-3xl font-bold text-white">
            Ready to get started?
          </h2>
          <p className="mb-8 text-slate-300">
            Sign in with your Google account and create your first AI agent in
            minutes.
          </p>
          <Button
            asChild
            size="lg"
            className="gap-2 bg-white text-slate-900 hover:bg-white/90"
          >
            <Link href="/login">
              <svg className="h-4 w-4" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Continue with Google
            </Link>
          </Button>
        </div>
      </section>

      <footer className="border-t border-white/10 px-8 py-6 text-center text-sm text-slate-500">
        © {new Date().getFullYear()} AI Cowork Studio. Inspired by{" "}
        <a
          href="https://github.com/microsoft/Power-CAT-Copilot-Studio-Kit"
          className="underline hover:text-slate-400"
          target="_blank"
          rel="noopener noreferrer"
        >
          Microsoft Power CAT Copilot Studio Kit
        </a>
        .
      </footer>
    </div>
  );
}

const features = [
  {
    icon: Bot,
    title: "AI Agents",
    description:
      "Create custom agents with tailored system prompts, goals, and behaviors powered by Claude.",
  },
  {
    icon: CloudCog,
    title: "External Connectors",
    description:
      "Connect agents to Gmail, OneDrive, Google Drive, Slack, Notion and more.",
  },
  {
    icon: Terminal,
    title: "MCP Servers",
    description:
      "Integrate local and remote Model Context Protocol servers to extend agent capabilities.",
  },
  {
    icon: FileText,
    title: "RAG Documents",
    description:
      "Upload PDFs, Word docs, and text files. Agents use them as context for accurate answers.",
  },
  {
    icon: MessageSquare,
    title: "Chat Interface",
    description:
      "Stream conversations with your agents in a clean, responsive chat UI.",
  },
  {
    icon: Globe,
    title: "Projects",
    description:
      "Organise agents and documents into projects for different teams or use cases.",
  },
  {
    icon: Zap,
    title: "Fast & Secure",
    description:
      "Built with Next.js 15, secured by Google OAuth, with all data stored in your own database.",
  },
  {
    icon: Sparkles,
    title: "Multi-model",
    description:
      "Choose between Claude Opus, Sonnet, and Haiku per agent to balance capability and cost.",
  },
];
