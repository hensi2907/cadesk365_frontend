"use client";

import * as React from "react";
import { Send, User, ShieldCheck, MoreVertical, Paperclip, Search, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export default function ClientChat() {
  const [message, setMessage] = React.useState("");

  const chatMessages = [
    { id: 1, text: "Hello! How can I help you today?", sender: "admin", time: "10:00 AM" },
    { id: 2, text: "I had a question about the GST filing for April.", sender: "user", time: "10:05 AM" },
    { id: 3, text: "Sure, go ahead. I can help with that.", sender: "admin", time: "10:06 AM" },
    { id: 4, text: "I uploaded the documents but they show as pending.", sender: "user", time: "10:10 AM" },
    { id: 5, text: "Our team is reviewing them. It usually takes 24-48 hours. I'll prioritize yours though!", sender: "admin", time: "10:12 AM" },
  ];

  return (
    <div className="h-[calc(100vh-64px)] flex overflow-hidden">
      {/* Sidebar - Chat List */}
      <div className="w-80 border-r bg-card/50 backdrop-blur-xl hidden md:flex flex-col">
        <div className="p-6 border-b">
          <h2 className="text-xl font-black tracking-tight mb-4">Messages</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search chats..." className="pl-9 h-10 bg-muted/50 border-none rounded-xl" />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          <div className="p-4 rounded-2xl bg-primary/10 border border-primary/20 flex items-center gap-4 cursor-pointer">
            <div className="h-12 w-12 rounded-full bg-primary/50 flex items-center justify-center text-white">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-baseline">
                <span className="font-bold text-sm truncate">Compliance Support</span>
                <span className="text-[10px] text-primary font-bold uppercase">Online</span>
              </div>
              <p className="text-xs text-muted-foreground truncate">I'll prioritize yours though!</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-muted/20">
        {/* Chat Header */}
        <header className="h-20 border-b bg-card px-8 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-primary/50 flex items-center justify-center text-white shadow-lg shadow-primary/20">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-bold">Compliance Support Team</h3>
              <p className="text-xs text-emerald-500 font-bold uppercase tracking-widest">Active Support</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="rounded-xl"><Phone className="h-5 w-5 text-muted-foreground" /></Button>
            <Button variant="ghost" size="icon" className="rounded-xl"><MoreVertical className="h-5 w-5 text-muted-foreground" /></Button>
          </div>
        </header>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-8 space-y-6">
          {chatMessages.map((msg) => (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              key={msg.id}
              className={cn(
                "flex gap-4 max-w-2xl",
                msg.sender === "user" ? "ml-auto flex-row-reverse" : ""
              )}
            >
              <div className={cn(
                "h-10 w-10 rounded-full flex items-center justify-center shrink-0",
                msg.sender === "user" ? "bg-primary text-white" : "bg-white dark:bg-card border"
              )}>
                {msg.sender === "user" ? <User className="h-5 w-5" /> : <ShieldCheck className="h-5 w-5 text-primary" />}
              </div>
              <div className="space-y-1">
                <div className={cn(
                  "p-4 rounded-[1.5rem] shadow-sm",
                  msg.sender === "user" 
                    ? "bg-primary text-white rounded-tr-none" 
                    : "bg-white dark:bg-card rounded-tl-none"
                )}>
                  <p className="text-sm leading-relaxed">{msg.text}</p>
                </div>
                <p className={cn(
                  "text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-2",
                  msg.sender === "user" ? "text-right" : ""
                )}>{msg.time}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Input Area */}
        <footer className="p-6 bg-card border-t shrink-0">
          <div className="max-w-4xl mx-auto relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-primary to-blue-500 rounded-[2rem] blur opacity-10 group-focus-within:opacity-30 transition duration-500"></div>
            <div className="relative flex items-center gap-3 bg-muted/50 p-2 pr-3 rounded-[2rem]">
              <Button variant="ghost" size="icon" className="h-12 w-12 rounded-full shrink-0">
                <Paperclip className="h-5 w-5 text-muted-foreground" />
              </Button>
              <input 
                type="text" 
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type your message here..." 
                className="flex-1 bg-transparent border-none outline-none text-sm px-2"
                onKeyPress={(e) => e.key === 'Enter' && setMessage("")}
              />
              <Button 
                className="h-12 w-12 rounded-full bg-primary hover:bg-primary/50 text-white shadow-lg shadow-primary/20 shrink-0"
                onClick={() => setMessage("")}
              >
                <Send className="h-5 w-5" />
              </Button>
            </div>
          </div>
          <p className="text-center text-[10px] text-muted-foreground font-bold uppercase tracking-widest mt-4 opacity-50">
            Messages are end-to-end encrypted
          </p>
        </footer>
      </div>
    </div>
  );
}
