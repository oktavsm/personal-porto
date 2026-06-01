import { Bot, Loader2, MessageCircle, Send, Sparkles, X } from "lucide-react";
import { FormEvent, useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { chatSuggestions, getLocalPortfolioAnswer, type SuggestedLink } from "../../data/portfolioKnowledge";

type ChatMessage = {
  id: string;
  role: "assistant" | "user";
  content: string;
  links?: SuggestedLink[];
};

type WebhookResponse = {
  answer?: string;
  suggestedLinks?: SuggestedLink[];
};

const webhookUrl = import.meta.env.VITE_PORTFOLIO_CHAT_WEBHOOK_URL as string | undefined;

function createSessionId() {
  const existing = window.localStorage.getItem("portfolio-chat-session");
  if (existing) {
    return existing;
  }

  const next = crypto.randomUUID();
  window.localStorage.setItem("portfolio-chat-session", next);
  return next;
}

export function AskPortfolioChat() {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "Hi, I can help you explore Okta's portfolio. Ask about projects, Android work, TELADAN, core server, resume, or where to go next.",
      links: [
        { label: "Projects", href: "/projects" },
        { label: "Lead Self", href: "/lead-self" },
      ],
    },
  ]);
  const sessionIdRef = useRef<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isSending]);

  useEffect(() => {
    document.body.classList.toggle("chat-open", isOpen);

    return () => {
      document.body.classList.remove("chat-open");
    };
  }, [isOpen]);

  async function askPortfolio(message: string): Promise<WebhookResponse> {
    if (!webhookUrl) {
      return getLocalPortfolioAnswer(message);
    }

    sessionIdRef.current ??= createSessionId();

    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId: sessionIdRef.current,
        message,
        pageContext: `${location.pathname}${location.hash}`,
        visitorType: "unknown",
      }),
    });

    if (!response.ok) {
      throw new Error("Portfolio chat webhook failed");
    }

    return response.json() as Promise<WebhookResponse>;
  }

  async function handleSubmit(event?: FormEvent<HTMLFormElement>, quickPrompt?: string) {
    event?.preventDefault();

    const message = (quickPrompt ?? input).trim();
    if (!message || isSending) {
      return;
    }

    inputRef.current?.blur();
    setInput("");
    setIsSending(true);
    setMessages((current) => [...current, { id: crypto.randomUUID(), role: "user", content: message }]);

    try {
      const response = await askPortfolio(message);
      setMessages((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content:
            response.answer ??
            "I could not find a grounded answer yet. Try asking about Okta's projects, mission, resume, or Lead Self journey.",
          links: response.suggestedLinks,
        },
      ]);
    } catch {
      const fallback = getLocalPortfolioAnswer(message);
      setMessages((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: `The live AI workflow is temporarily unavailable, so I answered from the local portfolio context. ${fallback.answer}`,
          links: fallback.suggestedLinks,
        },
      ]);
    } finally {
      setIsSending(false);
    }
  }

  return (
    <div className="portfolio-chat">
      {isOpen ? (
        <div className="chat-panel" role="dialog" aria-label="Ask my portfolio chatbot">
          <div className="chat-head">
            <div>
              <span>
                <Sparkles size={14} /> Ask my portfolio
              </span>
              <strong>{webhookUrl ? "Portfolio guide" : "Preview guide"}</strong>
            </div>
            <button type="button" aria-label="Close portfolio chat" onClick={() => setIsOpen(false)}>
              <X size={18} />
            </button>
          </div>

          <div className="chat-messages">
            {messages.map((message) => (
              <div className={`chat-message chat-message-${message.role}`} key={message.id}>
                <div className="chat-avatar">{message.role === "assistant" ? <Bot size={15} /> : "You"}</div>
                <div className="chat-bubble">
                  <p>{message.content}</p>
                  {message.links?.length ? (
                    <div className="chat-links">
                      {message.links.map((link) =>
                        link.href.startsWith("http") ? (
                          <a href={link.href} target="_blank" rel="noreferrer" key={link.href}>
                            {link.label}
                          </a>
                        ) : (
                          <Link to={link.href} key={link.href} onClick={() => setIsOpen(false)}>
                            {link.label}
                          </Link>
                        ),
                      )}
                    </div>
                  ) : null}
                </div>
              </div>
            ))}
            {isSending ? (
              <div className="chat-message chat-message-assistant">
                <div className="chat-avatar">
                  <Bot size={15} />
                </div>
                <div className="chat-bubble chat-loading">
                  <Loader2 size={16} /> Thinking with portfolio context...
                </div>
              </div>
            ) : null}
            <div ref={messagesEndRef} />
          </div>

          <div className="chat-suggestions">
            {chatSuggestions.slice(0, 3).map((suggestion) => (
              <button type="button" key={suggestion} onClick={() => void handleSubmit(undefined, suggestion)}>
                {suggestion}
              </button>
            ))}
          </div>

          <form className="chat-form" onSubmit={(event) => void handleSubmit(event)}>
            <input
              ref={inputRef}
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  void handleSubmit(undefined);
                }
              }}
              maxLength={260}
              placeholder="Ask about Okta..."
              aria-label="Ask about Okta"
            />
            <button type="submit" aria-label="Send question" disabled={isSending || !input.trim()}>
              <Send size={17} />
            </button>
          </form>
        </div>
      ) : null}

      <button className="chat-fab" type="button" onClick={() => setIsOpen((value) => !value)} aria-label="Open portfolio chat">
        <MessageCircle size={20} />
        <span>Ask</span>
      </button>
    </div>
  );
}
