"use client";

import { useEffect, useRef, useState } from "react";
import { Bot, Loader2, SendHorizonal, Sparkles, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { PageHeader } from "@/components/page-header";
import { askCoach, loadChatHistory, persistChatMessage, clearChatHistory } from "@/app/actions/coach";
import type { ChatMessage } from "@/lib/types";
import { cn } from "@/lib/utils";

const suggestedQuestions = [
  "What should I work on first?",
  "Why is my traffic dropping?",
  "Which pages are close to page 1?",
  "Which pages should I update this week?",
];

function renderMd(text: string) {
  return text.split("\n").map((line, i, arr) => {
    const parts = line.split(/(\*\*[^*]+\*\*|`[^`]+`|\*[^*]+\*)/g).map((chunk, j) => {
      if (chunk.startsWith("**") && chunk.endsWith("**"))
        return <strong key={j}>{chunk.slice(2, -2)}</strong>;
      if (chunk.startsWith("`") && chunk.endsWith("`"))
        return <code key={j} className="bg-slate-100 dark:bg-slate-700 px-1 rounded text-xs font-mono">{chunk.slice(1, -1)}</code>;
      if (chunk.startsWith("*") && chunk.endsWith("*") && chunk.length > 2)
        return <em key={j}>{chunk.slice(1, -1)}</em>;
      return chunk;
    });
    return <span key={i}>{parts}{i < arr.length - 1 && <br />}</span>;
  });
}

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";
  return (
    <div className={cn("flex gap-3", isUser && "flex-row-reverse")}>
      <span
        className={cn(
          "flex w-8 h-8 shrink-0 items-center justify-center rounded-full",
          isUser ? "bg-slate-200 dark:bg-slate-700" : "bg-indigo-600"
        )}
      >
        {isUser ? (
          <User className="w-4 h-4 text-slate-600 dark:text-slate-300" />
        ) : (
          <Bot className="w-4 h-4 text-white" />
        )}
      </span>
      <div
        className={cn(
          "rounded-2xl px-4 py-3 max-w-[85%] sm:max-w-[75%] text-sm leading-relaxed",
          isUser
            ? "bg-indigo-600 text-white rounded-tr-sm whitespace-pre-wrap"
            : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 shadow-sm ring-1 ring-slate-200 dark:ring-slate-700 rounded-tl-sm"
        )}
      >
        {isUser ? message.content : renderMd(message.content)}
      </div>
    </div>
  );
}

export default function CoachPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadChatHistory()
      .then(setMessages)
      .catch(() => {})
      .finally(() => setLoadingHistory(false));
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, thinking]);

  const send = async (question: string) => {
    const text = question.trim();
    if (!text || thinking) return;

    const next: ChatMessage[] = [...messages, { role: "user", content: text }];
    setMessages(next);
    setInput("");
    setThinking(true);
    try {
      const answer = await askCoach(next);
      const withAnswer: ChatMessage[] = [...next, { role: "assistant", content: answer }];
      setMessages(withAnswer);
      // fire-and-forget persistence
      persistChatMessage("user", text).catch(console.error);
      persistChatMessage("assistant", answer).catch(console.error);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "The coach is unavailable right now");
      setMessages(messages);
      setInput(text);
    } finally {
      setThinking(false);
    }
  };

  const handleClear = async () => {
    await clearChatHistory().catch(console.error);
    setMessages([]);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] lg:h-[calc(100vh-7rem)]">
      <PageHeader
        title="SerpDo Coach"
        description="Ask anything about your site — answers use your live Search Console and crawl data."
        action={
          messages.length > 0 ? (
            <button
              onClick={handleClear}
              className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
            >
              Clear history
            </button>
          ) : undefined
        }
      />

      <div className="flex-1 overflow-y-auto space-y-4 pb-4 -mx-1 px-1">
        {loadingHistory && (
          <div className="flex items-center justify-center py-8 text-slate-400 text-sm">
            <Loader2 className="w-4 h-4 animate-spin mr-2" /> Loading history…
          </div>
        )}
        {!loadingHistory && messages.length === 0 && (
          <div className="text-center py-12">
            <div className="mx-auto w-14 h-14 rounded-2xl bg-indigo-600 flex items-center justify-center mb-4 shadow-lg shadow-indigo-200">
              <Sparkles className="w-7 h-7 text-white" />
            </div>
            <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-1">
              Your SEO expert, on demand
            </h3>
            <p className="text-sm text-slate-500 mb-6 max-w-sm mx-auto">
              The coach knows your performance data, detected opportunities, and site
              structure. Try one of these:
            </p>
            <div className="flex flex-wrap justify-center gap-2 max-w-lg mx-auto">
              {suggestedQuestions.map((q) => (
                <button
                  key={q}
                  onClick={() => send(q)}
                  className="rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2 text-sm text-slate-600 dark:text-slate-300 hover:border-indigo-300 dark:hover:border-indigo-700 hover:text-indigo-700 dark:hover:text-indigo-400 transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((message, i) => (
          <MessageBubble key={i} message={message} />
        ))}

        {thinking && (
          <div className="flex gap-3">
            <span className="relative flex w-8 h-8 shrink-0 items-center justify-center rounded-full bg-indigo-600">
              <span className="absolute inset-0 rounded-full bg-indigo-400 opacity-40 animate-ping" />
              <Bot className="w-4 h-4 text-white animate-pulse relative" />
            </span>
            <div className="rounded-2xl rounded-tl-sm px-4 py-3 bg-white dark:bg-slate-800 shadow-sm ring-1 ring-slate-200 dark:ring-slate-700">
              <span className="flex gap-1.5 items-center h-5">
                {[0, 150, 300].map((delay) => (
                  <span
                    key={delay}
                    className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce"
                    style={{ animationDelay: `${delay}ms` }}
                  />
                ))}
              </span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
        className="relative pt-2"
      >
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask your SEO coach anything..."
          className="pr-14 h-13 rounded-full border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm"
          disabled={thinking}
        />
        <Button
          type="submit"
          size="icon"
          disabled={thinking || !input.trim()}
          className="absolute right-1.5 top-1/2 -translate-y-1/2 mt-1 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white"
        >
          {thinking ? <Loader2 className="animate-spin" /> : <SendHorizonal />}
        </Button>
      </form>
    </div>
  );
}
