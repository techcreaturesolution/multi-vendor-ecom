import { useEffect, useState, useCallback, useRef } from "react";
import { Send, User, MessageSquare } from "lucide-react";
import toast from "react-hot-toast";
import api from "../services/api";
import type { Conversation, Message } from "../types";

export default function ChatInbox() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [replyText, setReplyText] = useState("");
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchConversations = useCallback(async () => {
    try {
      const res = await api.get("/chat/conversations");
      setConversations(res.data.conversations);
    } catch {
      toast.error("Failed to load conversations");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchConversations(); }, [fetchConversations]);

  const selectConversation = async (id: string) => {
    setSelectedId(id);
    try {
      const res = await api.get(`/chat/conversations/${id}/messages`);
      setMessages(res.data.messages);
      await api.post(`/chat/conversations/${id}/read`);
      fetchConversations();
    } catch {
      toast.error("Failed to load messages");
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendReply = async () => {
    if (!replyText.trim() || !selectedId) return;
    try {
      const res = await api.post(`/chat/conversations/${selectedId}/reply`, { text: replyText });
      setMessages((prev) => [...prev, res.data]);
      setReplyText("");
      fetchConversations();
    } catch {
      toast.error("Failed to send reply");
    }
  };

  const selectedConv = conversations.find((c) => c._id === selectedId);

  return (
    <div className="h-[calc(100vh-48px)] flex">
      <div className="w-80 border-r bg-white overflow-y-auto">
        <div className="p-4 border-b">
          <h2 className="font-bold text-lg">Inbox</h2>
        </div>
        {loading ? (
          <div className="p-4 text-center text-gray-400">Loading...</div>
        ) : conversations.length === 0 ? (
          <div className="p-4 text-center text-gray-400">No conversations</div>
        ) : conversations.map((conv) => (
          <button
            key={conv._id}
            onClick={() => selectConversation(conv._id)}
            className={`w-full text-left px-4 py-3 border-b hover:bg-gray-50 transition-colors ${selectedId === conv._id ? "bg-primary-50" : ""}`}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                <User className="w-5 h-5 text-gray-500" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-sm truncate">{conv.contactId?.name || "Unknown"}</span>
                  {conv.unreadCount > 0 && (
                    <span className="bg-primary-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">{conv.unreadCount}</span>
                  )}
                </div>
                <p className="text-xs text-gray-500 truncate">{conv.lastMessagePreview}</p>
              </div>
            </div>
          </button>
        ))}
      </div>

      <div className="flex-1 flex flex-col bg-gray-50">
        {!selectedId ? (
          <div className="flex-1 flex items-center justify-center text-gray-400">
            <div className="text-center">
              <MessageSquare className="w-12 h-12 mx-auto mb-3" />
              <p>Select a conversation</p>
            </div>
          </div>
        ) : (
          <>
            <div className="bg-white border-b px-4 py-3 flex items-center gap-3">
              <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-gray-500" />
              </div>
              <div>
                <div className="font-medium text-sm">{selectedConv?.contactId?.name || "Unknown"}</div>
                <div className="text-xs text-gray-500">{selectedConv?.contactId?.phone}</div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map((msg) => (
                <div key={msg._id} className={`flex ${msg.direction === "outbound" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-xs px-4 py-2 rounded-2xl text-sm ${
                    msg.direction === "outbound"
                      ? "bg-primary-500 text-white rounded-br-md"
                      : "bg-white border rounded-bl-md"
                  }`}>
                    <p>{msg.content || `[${msg.type}]`}</p>
                    <p className={`text-xs mt-1 ${msg.direction === "outbound" ? "text-green-100" : "text-gray-400"}`}>
                      {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            <div className="bg-white border-t p-3 flex gap-2">
              <input
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendReply()}
                placeholder="Type a message..."
                className="flex-1 px-4 py-2 border rounded-full text-sm focus:ring-2 focus:ring-primary-500 outline-none"
              />
              <button onClick={sendReply} disabled={!replyText.trim()} className="p-2 bg-primary-600 text-white rounded-full hover:bg-primary-700 disabled:opacity-50">
                <Send className="w-5 h-5" />
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
