"use client";

import { useEffect, useState, useRef } from "react";
import { apiGet, apiPost } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import Navbar from "../../components/Navbar";

// Types
type Rental = {
  id: string;
  start_date: string;
  end_date: string;
  status: string;
  total_amount: number;
};

type Order = {
  id: string;
  created_at: string;
  status: string;
  total_amount: number;
};

type ChatMessage = {
  id: string;
  sender: "user" | "admin";
  message: string;
  reply?: string | null;
  created_at: string;
};

export default function DashboardPage() {
  const { user, token, loading: authLoading } = useAuth();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<"rentals" | "orders">("rentals");
  const [rentals, setRentals] = useState<Rental[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  // Chat states
  const [chats, setChats] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [chatLoading, setChatLoading] = useState(true);
  const [typing, setTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  // Redirect admin users
  useEffect(() => {
    if (!authLoading && user?.role === "admin") {
      router.push("/admin/dashboard");
    }
  }, [user, authLoading, router]);

  // Fetch dashboard data & chat
  useEffect(() => {
    if (authLoading || !token || user?.role === "admin") return;

    fetchDashboardData();
    fetchUserChats();

    const interval = setInterval(fetchUserChats, 30000);
    return () => clearInterval(interval);
  }, [user, authLoading]);

  // Auto-scroll on new message
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chats]);

  // Fetch rentals & orders
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [rentalsData, ordersData] = await Promise.all([
        apiGet<Rental[]>("/rentals"),
        apiGet<Order[]>("/sales_orders"),
      ]);
      setRentals(rentalsData);
      setOrders(ordersData);
    } catch (err) {
      console.error("Failed to fetch dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch user chat messages
  const fetchUserChats = async () => {
    if (!token) return; // Don't fetch if token missing
    try {
      setChatLoading(true);

      // Pass the token to apiGet
      const data = await apiGet<{ chats: ChatMessage[] }>("/chats", token);

      setChats(data.chats || []);
    } catch (err) {
      console.error("Failed to fetch chats:", err);
    } finally {
      setChatLoading(false);
      console.log("the token is", token);
    }
  };

  // Send chat message
  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    const msg = newMessage;
    setNewMessage("");

    // Optimistic UI
    const tempMessage: ChatMessage = {
      id: "temp-" + Date.now(),
      sender: "user",
      message: msg,
      created_at: new Date().toISOString(),
    };
    setChats((prev) => [...prev, tempMessage]);

    try {
      if (!token) throw new Error("No token available");

      const data = await apiPost<{ chat: ChatMessage }>(
        "/chats",
        { message: msg },
        token
      );

      // Replace temp message with real saved message
      setChats((prev) =>
        prev.map((m) => (m.id === tempMessage.id ? data.chat : m))
      );
    } catch (err) {
      console.error("Failed to send message:", err);
    }
  };

  const formatTime = (date: string) =>
    new Date(date).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 
      dark:from-gray-900 dark:via-gray-800 dark:to-black text-gray-900 dark:text-white 
      transition-colors duration-300"
    >
      <Navbar />

      {/* Glowing background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-3xl"></div>
      </div>

      <div className="relative container mx-auto px-4 py-12 pt-24">
        <h1 className="text-4xl font-black mb-8">
          <span
            className="bg-gradient-to-r from-blue-600 to-purple-600 
            dark:from-blue-400 dark:via-purple-400 dark:to-pink-400 
            bg-clip-text text-transparent"
          >
            My Dashboard
          </span>
        </h1>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* LEFT PANEL */}
          <div className="flex-1">
            {/* Tabs */}
            <div className="flex space-x-4 mb-8 border-b border-gray-200 dark:border-white/10">
              <button
                onClick={() => setActiveTab("rentals")}
                className={`pb-3 px-4 font-medium transition-all ${
                  activeTab === "rentals"
                    ? "border-b-2 border-blue-600 dark:border-blue-500 text-blue-600 dark:text-blue-400"
                    : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                }`}
              >
                My Rentals ({rentals.length})
              </button>
              <button
                onClick={() => setActiveTab("orders")}
                className={`pb-3 px-4 font-medium transition-all ${
                  activeTab === "orders"
                    ? "border-b-2 border-blue-600 dark:border-blue-500 text-blue-600 dark:text-blue-400"
                    : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                }`}
              >
                My Orders ({orders.length})
              </button>
            </div>

            {/* Cards */}
            {loading ? (
              <div className="text-center text-gray-400 py-10">Loading...</div>
            ) : (
              <div className="space-y-6">
                {activeTab === "rentals" &&
                  rentals.map((r) => (
                    <div
                      key={r.id}
                      className="bg-white/20 dark:bg-white/5 backdrop-blur-md 
                      border border-white/20 dark:border-white/10 p-6 rounded-2xl shadow-lg"
                    >
                      <div className="flex justify-between">
                        <p className="font-semibold">
                          Rental #{r.id.slice(0, 8)} – {r.status}
                        </p>
                        <p className="font-bold">${r.total_amount}</p>
                      </div>
                    </div>
                  ))}

                {activeTab === "orders" &&
                  orders.map((o) => (
                    <div
                      key={o.id}
                      className="bg-white/20 dark:bg-white/5 backdrop-blur-md 
                      border border-white/20 dark:border-white/10 p-6 rounded-2xl shadow-lg"
                    >
                      <div className="flex justify-between">
                        <p className="font-semibold">
                          Order #{o.id.slice(0, 8)} – {o.status}
                        </p>
                        <p className="font-bold">${o.total_amount}</p>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>

          {/* CHAT WIDGET */}
          <div
            className="w-full lg:w-96 flex flex-col bg-white/10 dark:bg-black/30 
            backdrop-blur-xl border border-white/20 dark:border-white/10 
            rounded-2xl shadow-2xl h-[600px] p-5"
          >
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              💬 Support Chat
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
            </h2>

            <div className="flex-1 overflow-y-auto pr-2 space-y-3">
              {chatLoading ? (
                <p className="text-gray-400 text-center">Loading chat...</p>
              ) : (
                chats.map((msg) => (
                  <div
                    key={msg.id}
                    className={`max-w-[80%] px-4 py-2 rounded-2xl text-sm shadow transition-all 
                    ${
                      msg.sender === "user"
                        ? "ml-auto bg-blue-600 text-white"
                        : "mr-auto bg-white/20 dark:bg-white/10"
                    }`}
                  >
                    <p>{msg.message}</p>
                    <span className="text-[10px] block mt-1 opacity-70">
                      {formatTime(msg.created_at)}
                    </span>

                    {/* admin reply attached to the same row */}
                    {msg.reply ? (
                      <div
                        style={{
                          marginTop: 8,
                          paddingLeft: 12,
                          borderLeft: "3px solid #ddd",
                        }}
                      >
                        <div style={{ fontWeight: 700, fontSize: 13 }}>
                          Admin reply
                        </div>
                        <div style={{ marginTop: 4 }}>{msg.reply}</div>
                      </div>
                    ) : null}
                  </div>
                ))
              )}

              {typing && (
                <div className="mr-auto bg-white/20 px-3 py-1 rounded-xl text-xs animate-pulse">
                  Admin is typing...
                </div>
              )}

              <div ref={chatEndRef} />
            </div>

            <div className="flex gap-2 mt-4">
              <input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 px-4 py-2 rounded-xl bg-white/20 text-white 
                  focus:outline-none border border-white/20"
              />
              <button
                onClick={sendMessage}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 
                  text-white font-semibold"
              >
                Send
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
