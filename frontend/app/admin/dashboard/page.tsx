"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../contexts/AuthContext";
import Navbar from "../../../components/Navbar";
import { apiGet, apiPost } from "../../../lib/api";

interface DashboardStats {
  totalUsers: number;
  totalProducts: number;
  totalRentals: number;
  totalOrders: number;
  rentalRevenue: number;
  salesRevenue: number;
  totalRevenue: number;
  inventoryStatus: Record<string, number>;
}

interface ChatMessage {
  id: string;
  userName: string;
  message: string;
  reply?: string;
  created_at: string;
}

export default function AdminDashboard() {
  const { user, token, loading: authLoading } = useAuth();
  const router = useRouter();

  const [stats, setStats] = useState<DashboardStats | null>(null);

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [selectedMessage, setSelectedMessage] = useState<ChatMessage | null>(
    null
  );
  const [replyMessage, setReplyMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [chatLoading, setChatLoading] = useState(true);

  const chatEndRef = useRef<HTMLDivElement | null>(null);

  // Redirect non-admin users
  useEffect(() => {
    if (!authLoading && (!user || user.role !== "admin")) {
      router.push("/login");
      return;
    }
    if (user && token) {
      fetchDashboardData();
      fetchChats();
    }
  }, [user, token, authLoading]);

  // Poll chats every 3 seconds
  useEffect(() => {
    const interval = setInterval(fetchChats, 3000);
    return () => clearInterval(interval);
  }, [user, token]);

  // Scroll to bottom on new messages
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  const fetchDashboardData = async () => {
    try {
      const data = await apiGet<{ stats: DashboardStats }>("/admin/dashboard");
      setStats(data.stats);
    } catch (err) {
      console.error("Failed to fetch dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchChats = async () => {
    try {
      setChatLoading(true);
      const data = await apiGet<{ chats: ChatMessage[] }>("/admin/chats");
      setChatMessages(data.chats || []);
    } catch (err) {
      console.error(err);
    } finally {
      setChatLoading(false);
    }
  };

  const sendReply = async () => {
    if (!replyMessage.trim() || !selectedMessage) return;

    const msg = replyMessage;
    setReplyMessage("");

    // Optimistic UI
    const tempReply: ChatMessage = {
      ...selectedMessage,
      reply: msg,
      id: "temp-" + Date.now(),
      created_at: new Date().toISOString(),
    };
    setChatMessages((prev) =>
      prev.map((m) => (m.id === selectedMessage.id ? tempReply : m))
    );

    try {
      const data = await apiPost<{ chat: ChatMessage }>(
        `/admin/chats/${selectedMessage.id}/reply`,
        { reply: msg }
      );
      setChatMessages((prev) =>
        prev.map((m) => (m.id === data.chat.id ? data.chat : m))
      );
      setSelectedMessage(null);
    } catch (err) {
      console.error(err);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
          <div
            className="absolute inset-0 w-16 h-16 border-4 border-purple-500/20 border-t-purple-500 rounded-full animate-spin"
            style={{ animationDirection: "reverse", animationDuration: "1.5s" }}
          ></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white">
      <Navbar />

      {/* Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-3xl animate-pulse"></div>
      </div>

      <div className="relative container mx-auto px-4 py-8 pt-24">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-end mb-12 pb-6 border-b border-white/10">
          <div>
            <h1 className="text-4xl font-black mb-2">
              <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                Admin Dashboard
              </span>
            </h1>
            <p className="text-gray-400">
              Welcome back,{" "}
              <span className="text-white font-semibold">
                {user?.name || "Admin"}
              </span>
            </p>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <div className="p-6 bg-gradient-to-br from-green-500/20 to-emerald-500/10 rounded-2xl border border-white/10">
            <p className="text-gray-400 text-sm mb-1">Total Revenue</p>
            <h3 className="text-3xl font-bold text-white">
              ${stats?.totalRevenue.toLocaleString() || "0.00"}
            </h3>
          </div>
          <div className="p-6 bg-gradient-to-br from-blue-500/20 to-cyan-500/10 rounded-2xl border border-white/10">
            <p className="text-gray-400 text-sm mb-1">Total Products</p>
            <h3 className="text-3xl font-bold text-white">
              {stats?.totalProducts}
            </h3>
          </div>
          <div className="p-6 bg-gradient-to-br from-purple-500/20 to-pink-500/10 rounded-2xl border border-white/10">
            <p className="text-gray-400 text-sm mb-1">Total Rentals</p>
            <h3 className="text-3xl font-bold text-white">
              {stats?.totalRentals}
            </h3>
          </div>
          <div className="p-6 bg-gradient-to-br from-orange-500/20 to-red-500/10 rounded-2xl border border-white/10">
            <p className="text-gray-400 text-sm mb-1">Total Users</p>
            <h3 className="text-3xl font-bold text-white">
              {stats?.totalUsers}
            </h3>
          </div>
        </div>

        {/* Quick Actions & Chat */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          {/* Quick Actions */}
          <div className="lg:col-span-2">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              <span className="w-1 h-6 bg-blue-500 rounded-full"></span>
              Quick Actions
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { title: "Products", href: "/admin/products" },
                { title: "Orders", href: "/admin/orders" },
                { title: "Inventory", href: "/admin/inventory" },
                { title: "Settings", href: "/admin/settings" },
              ].map((action, idx) => (
                <Link
                  key={idx}
                  href={action.href}
                  className="group relative p-6 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl transition-all duration-300 hover:-translate-y-1 text-center"
                >
                  <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-blue-500/20 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                    📌
                  </div>
                  <h3 className="font-semibold text-gray-200 group-hover:text-white transition-colors">
                    {action.title}
                  </h3>
                </Link>
              ))}
            </div>
          </div>

          {/* Chat Panel */}
          <div className="lg:col-span-1 flex flex-col bg-white/10 p-4 rounded-2xl border border-white/20 backdrop-blur-lg">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              Client Messages
            </h2>
            <div className="flex-1 overflow-y-auto space-y-3 max-h-96">
              {chatLoading ? (
                <p className="text-gray-400 text-center">Loading chats...</p>
              ) : chatMessages.length === 0 ? (
                <p className="text-gray-400 text-center">No messages yet.</p>
              ) : (
                chatMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`p-2 rounded-2xl cursor-pointer transition-colors ${
                      selectedMessage?.id === msg.id
                        ? "bg-white/20"
                        : "hover:bg-white/10"
                    }`}
                    onClick={() => setSelectedMessage(msg)}
                  >
                    <p className="text-sm font-semibold">{msg.userName}</p>
                    <p className="text-gray-200 text-sm">{msg.message}</p>
                    {msg.reply && (
                      <p className="text-green-400 text-sm mt-1">
                        Reply: {msg.reply}
                      </p>
                    )}
                    <span className="text-xs text-gray-400">
                      {new Date(msg.created_at).toLocaleString()}
                    </span>
                  </div>
                ))
              )}
              <div ref={chatEndRef} />
            </div>

            {selectedMessage && (
              <div className="flex gap-2 mt-2">
                <input
                  type="text"
                  value={replyMessage}
                  onChange={(e) => setReplyMessage(e.target.value)}
                  className="flex-1 bg-white/10 text-white rounded-xl px-4 py-2 focus:outline-none"
                  placeholder="Type your reply..."
                />
                <button
                  onClick={sendReply}
                  className="bg-green-500 hover:bg-green-600 px-4 py-2 rounded-xl text-white font-semibold transition-colors"
                >
                  Send
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
