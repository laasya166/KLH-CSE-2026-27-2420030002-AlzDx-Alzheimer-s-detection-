import { useEffect, useRef, useState } from "react";
import {
  AlertCircle,
  Bot,
  HelpCircle,
  RefreshCw,
  RotateCcw,
  Send,
  Sparkles,
  User,
  X,
} from "lucide-react";
import { sendChatMessage } from "../services/api";

function formatMessageTime(date = new Date()) {
  return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

function ChatAssistant({
  isOpen,
  onClose,
  assessmentId,
  assessmentData,
  initialPrompt,
  onClearInitialPrompt,
}) {
  const [messages, setMessages] = useState(() => [
    {
      role: "assistant",
      content:
        "Hi! I'm the AlzDx Assistant. I can explain your screening result, confidence score, transcript observations, and speech metrics. Remember, this is a research screening tool and not a medical diagnosis.",
      timestamp: formatMessageTime(),
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorBanner, setErrorBanner] = useState("");
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [messages, isOpen, loading]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const handleSendMessage = async (userText) => {
    const textToSend = (userText || input).trim();
    if (!textToSend || loading) return;

    setInput("");
    setErrorBanner("");

    const timeNow = formatMessageTime();
    const updatedMessages = [
      ...messages,
      { role: "user", content: textToSend, timestamp: timeNow },
    ];
    setMessages(updatedMessages);
    setLoading(true);

    // Build history for multi-turn conversational context
    const historyPayload = messages
      .filter((m) => !m.isError && m.content)
      .map((m) => ({ role: m.role, content: m.content }));

    try {
      const response = await sendChatMessage(
        assessmentId,
        textToSend,
        historyPayload
      );
      setMessages([
        ...updatedMessages,
        {
          role: "assistant",
          content: response.reply,
          timestamp: formatMessageTime(),
        },
      ]);
    } catch (err) {
      console.error("Chat error:", err);
      const errMsg =
        err.message ||
        "Unable to reach AlzDx AI Assistant. Please verify your GEMINI_API_KEY and network connection.";
      setErrorBanner(errMsg);
      setMessages([
        ...updatedMessages,
        {
          role: "assistant",
          content: errMsg,
          isError: true,
          timestamp: formatMessageTime(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Trigger initial prompt from metric sparkle ✨ button
  useEffect(() => {
    if (isOpen && initialPrompt && !loading) {
      handleSendMessage(initialPrompt);
      if (onClearInitialPrompt) {
        onClearInitialPrompt();
      }
    }
  }, [isOpen, initialPrompt]);

  const handleResetChat = () => {
    setMessages([
      {
        role: "assistant",
        content:
          "Hi! I'm the AlzDx Assistant. I can explain your screening result, confidence score, transcript observations, and speech metrics. Remember, this is a research screening tool and not a medical diagnosis.",
        timestamp: formatMessageTime(),
      },
    ]);
    setErrorBanner("");
    setInput("");
  };

  if (!isOpen) return null;

  const handleFormSubmit = (e) => {
    e.preventDefault();
    handleSendMessage();
  };

  const confidenceDisplay =
    assessmentData?.confidence != null
      ? `${Number(assessmentData.confidence).toFixed(1)}%`
      : "89.3%";

  const quickActionChips = [
    "Explain my result",
    "What is pause count?",
    `Why ${confidenceDisplay} confidence?`,
    "What should I do next?",
  ];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="AlzDx AI Assistant"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        backgroundColor: "rgba(15, 23, 42, 0.55)",
        backdropFilter: "blur(6px)",
        display: "flex",
        justifyContent: "flex-end",
        animation: "fadeIn 200ms ease",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "530px",
          height: "100%",
          backgroundColor: "var(--surface)",
          display: "flex",
          flexDirection: "column",
          boxShadow: "-8px 0 32px rgba(15, 23, 42, 0.18)",
          borderLeft: "1px solid var(--border)",
        }}
      >
        {/* Header */}
        <header
          style={{
            padding: "16px 20px",
            borderBottom: "1px solid var(--border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: "rgba(255, 255, 255, 0.98)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "12px",
                background: "linear-gradient(135deg, #0d9488 0%, #0f766e 100%)",
                display: "grid",
                placeItems: "center",
                color: "white",
                boxShadow: "0 4px 12px rgba(13, 148, 136, 0.25)",
              }}
            >
              <Bot size={22} />
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <h3 style={{ margin: 0, fontSize: "16px", color: "var(--text)" }}>
                  AlzDx Assistant
                </h3>
                <span
                  style={{
                    fontSize: "11px",
                    fontWeight: "600",
                    background: "#f0fdfa",
                    color: "#0f766e",
                    border: "1px solid #ccfbf1",
                    padding: "2px 8px",
                    borderRadius: "999px",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "4px",
                  }}
                >
                  <Sparkles size={11} /> Gemini 2.5 Flash
                </span>
              </div>
              <p
                style={{
                  margin: "2px 0 0",
                  fontSize: "12px",
                  color: "var(--text-light)",
                }}
              >
                Cognitive Biomarker Explanations
              </p>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <button
              type="button"
              onClick={handleResetChat}
              title="Reset conversation"
              aria-label="Reset conversation"
              style={{
                background: "transparent",
                border: "none",
                cursor: "pointer",
                padding: "8px",
                borderRadius: "8px",
                color: "var(--text-light)",
                display: "grid",
                placeItems: "center",
              }}
            >
              <RotateCcw size={17} />
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close assistant chat"
              style={{
                background: "transparent",
                border: "none",
                cursor: "pointer",
                padding: "8px",
                borderRadius: "8px",
                color: "var(--text-light)",
                display: "grid",
                placeItems: "center",
              }}
            >
              <X size={20} />
            </button>
          </div>
        </header>

        {/* Assessment Context Pill Strip */}
        {assessmentData && (
          <div
            style={{
              padding: "9px 20px",
              background: "#f8fafc",
              borderBottom: "1px solid var(--border)",
              fontSize: "12px",
              color: "var(--text-light)",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              flexWrap: "wrap",
            }}
          >
            <span>Active Assessment:</span>
            <strong style={{ color: "var(--text)" }}>
              {assessmentData.prediction || "Healthy"}
            </strong>
            <span>•</span>
            <span>
              Confidence:{" "}
              <strong style={{ color: "var(--text)" }}>
                {confidenceDisplay}
              </strong>
            </span>
          </div>
        )}

        {/* Error Banner when Gemini fails */}
        {errorBanner && (
          <div
            style={{
              padding: "12px 18px",
              background: "#fff7ed",
              borderBottom: "1px solid #fed7aa",
              color: "#9a3412",
              fontSize: "13px",
              display: "flex",
              alignItems: "flex-start",
              gap: "10px",
            }}
          >
            <AlertCircle size={18} style={{ flexShrink: 0, marginTop: "2px" }} />
            <div style={{ flex: 1 }}>
              <strong>AI Assistant Notice:</strong> {errorBanner}
            </div>
          </div>
        )}

        {/* Messages Stream */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "18px 20px",
            display: "flex",
            flexDirection: "column",
            gap: "14px",
          }}
        >
          {messages.map((msg, index) => {
            const isUser = msg.role === "user";
            const isAssistant = !isUser;
            const isSubstantiveReply =
              isAssistant &&
              !msg.isError &&
              index > 0 &&
              (msg.content.length > 70 || msg.content.includes(" "));

            return (
              <div key={index} style={{ display: "flex", flexDirection: "column" }}>
                <div
                  style={{
                    display: "flex",
                    gap: "10px",
                    alignSelf: isUser ? "flex-end" : "flex-start",
                    maxWidth: "88%",
                    flexDirection: isUser ? "row-reverse" : "row",
                  }}
                >
                  <div
                    style={{
                      width: "30px",
                      height: "30px",
                      borderRadius: "50%",
                      display: "grid",
                      placeItems: "center",
                      flexShrink: 0,
                      background: isUser
                        ? "var(--primary)"
                        : msg.isError
                        ? "#fee2e2"
                        : "#f0fdfa",
                      color: isUser
                        ? "white"
                        : msg.isError
                        ? "#b91c1c"
                        : "#0f766e",
                      border: isUser ? "none" : "1px solid #ccfbf1",
                    }}
                  >
                    {isUser ? <User size={15} /> : <Bot size={15} />}
                  </div>

                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: isUser ? "flex-end" : "flex-start",
                    }}
                  >
                    <div
                      style={{
                        padding: "11px 15px",
                        borderRadius: "15px",
                        borderTopRightRadius: isUser ? "4px" : "15px",
                        borderTopLeftRadius: !isUser ? "4px" : "15px",
                        background: isUser
                          ? "var(--primary)"
                          : msg.isError
                          ? "#fef2f2"
                          : "#f8fafc",
                        color: isUser
                          ? "white"
                          : msg.isError
                          ? "#991b1b"
                          : "var(--text)",
                        border: isUser
                          ? "none"
                          : msg.isError
                          ? "1px solid #fecaca"
                          : "1px solid var(--border)",
                        fontSize: "13.5px",
                        lineHeight: "1.55",
                        whiteSpace: "pre-wrap",
                        wordBreak: "break-word",
                      }}
                    >
                      {msg.content}
                    </div>

                    {/* Subtle Message Timestamp & Action Row */}
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        marginTop: "4px",
                        paddingLeft: isUser ? "0" : "4px",
                        paddingRight: isUser ? "4px" : "0",
                      }}
                    >
                      <span
                        style={{
                          fontSize: "10.5px",
                          color: "var(--text-light)",
                          opacity: 0.75,
                        }}
                      >
                        {msg.timestamp || formatMessageTime()}
                      </span>

                      {/* "Explain Like I'm 10" button below longer/substantive assistant replies */}
                      {isSubstantiveReply && (
                        <button
                          type="button"
                          onClick={() => handleSendMessage("Explain like I'm 10")}
                          disabled={loading}
                          title="Explain this in simple terms with everyday analogies"
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px",
                            padding: "3px 8px",
                            fontSize: "11px",
                            fontWeight: "600",
                            color: "#0f766e",
                            background: "#f0fdfa",
                            border: "1px solid #ccfbf1",
                            borderRadius: "10px",
                            cursor: loading ? "not-allowed" : "pointer",
                            transition: "all 150ms ease",
                          }}
                          onMouseEnter={(e) => {
                            if (!loading) {
                              e.currentTarget.style.background = "#ccfbf1";
                              e.currentTarget.style.borderColor = "#99f6e4";
                            }
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = "#f0fdfa";
                            e.currentTarget.style.borderColor = "#ccfbf1";
                          }}
                        >
                          <Sparkles size={11} /> Explain Like I'm 10
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Quick Action chips under the welcome message */}
                {index === 0 && (
                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: "7px",
                      marginTop: "10px",
                      marginLeft: "40px",
                    }}
                  >
                    {quickActionChips.map((chipText) => (
                      <button
                        key={chipText}
                        type="button"
                        disabled={loading}
                        onClick={() => handleSendMessage(chipText)}
                        style={{
                          padding: "6px 12px",
                          fontSize: "12px",
                          fontWeight: "500",
                          borderRadius: "999px",
                          background: "white",
                          border: "1px solid #ccfbf1",
                          color: "#0f766e",
                          boxShadow: "0 1px 3px rgba(15, 23, 42, 0.05)",
                          cursor: loading ? "not-allowed" : "pointer",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px",
                          transition: "all 150ms ease",
                        }}
                        onMouseEnter={(e) => {
                          if (!loading) {
                            e.currentTarget.style.background = "#f0fdfa";
                            e.currentTarget.style.borderColor = "var(--primary)";
                            e.currentTarget.style.transform = "translateY(-1px)";
                          }
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = "white";
                          e.currentTarget.style.borderColor = "#ccfbf1";
                          e.currentTarget.style.transform = "none";
                        }}
                      >
                        <Sparkles size={11} />
                        {chipText}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          {/* Typing Indicator ("Analyzing your assessment..." with animated dots) */}
          {loading && (
            <div
              style={{
                display: "flex",
                gap: "10px",
                alignSelf: "flex-start",
                maxWidth: "85%",
              }}
            >
              <div
                style={{
                  width: "30px",
                  height: "30px",
                  borderRadius: "50%",
                  display: "grid",
                  placeItems: "center",
                  background: "#f0fdfa",
                  color: "#0f766e",
                  border: "1px solid #ccfbf1",
                  flexShrink: 0,
                }}
              >
                <Bot size={15} />
              </div>
              <div
                style={{
                  padding: "10px 15px",
                  borderRadius: "15px",
                  borderTopLeftRadius: "4px",
                  background: "#f8fafc",
                  border: "1px solid var(--border)",
                  fontSize: "13px",
                  color: "var(--text-light)",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <span>Analyzing your assessment</span>
                <span
                  style={{
                    display: "inline-flex",
                    gap: "2px",
                    alignItems: "center",
                    marginLeft: "2px",
                  }}
                >
                  <span className="alzdx-dot-pulse dot-1">.</span>
                  <span className="alzdx-dot-pulse dot-2">.</span>
                  <span className="alzdx-dot-pulse dot-3">.</span>
                </span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div
          style={{
            padding: "14px 20px 16px",
            borderTop: "1px solid var(--border)",
            background: "rgba(255, 255, 255, 0.98)",
          }}
        >
          <form
            onSubmit={handleFormSubmit}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
            }}
          >
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about pause count, speech rate, confidence..."
              disabled={loading}
              style={{
                flex: 1,
                padding: "11px 15px",
                fontSize: "13.5px",
                borderRadius: "12px",
                border: "1px solid var(--border)",
                outline: "none",
                background: "var(--background)",
              }}
              onFocus={(e) => (e.target.style.borderColor = "var(--primary)")}
              onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
            />

            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="button button-primary"
              style={{
                padding: "11px 15px",
                borderRadius: "12px",
                display: "grid",
                placeItems: "center",
                minWidth: "46px",
              }}
              aria-label="Send message"
            >
              {loading ? (
                <RefreshCw
                  size={15}
                  style={{ animation: "spin 1s linear infinite" }}
                />
              ) : (
                <Send size={15} />
              )}
            </button>
          </form>

          <p
            style={{
              margin: "8px 0 0",
              fontSize: "11px",
              color: "var(--text-light)",
              textAlign: "center",
              lineHeight: 1.4,
            }}
          >
            AlzDx Assistant provides research screening explanations and is not a medical diagnosis.
          </p>
        </div>
      </div>
    </div>
  );
}

export default ChatAssistant;
