'use client';

import { useEffect, useRef, useState } from 'react';
import { Plus, Hash, Send } from 'lucide-react';
import { useWorkspaceStore } from '@/store/workspace.store';
import { useAuthStore } from '@/store/auth.store';
import { useWorkspaceSocket } from '@/lib/useWorkspaceSocket';
import { getChannels, createChannel, getMessages, sendMessage } from '@/lib/chat';
import type { Channel, ChatMessage } from '@/types';
import { formatDistanceToNow } from 'date-fns';

export default function ChatPage() {
  const { currentWorkspace } = useWorkspaceStore();
  const { user } = useAuthStore();
  const socket = useWorkspaceSocket(currentWorkspace?.id);

  const [channels, setChannels] = useState<Channel[]>([]);
  const [activeChannel, setActiveChannel] = useState<Channel | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Load channels
  useEffect(() => {
    if (!currentWorkspace) return;
    getChannels(currentWorkspace.id).then((data) => {
      setChannels(data);
      if (data.length > 0) setActiveChannel(data[0]);
    });
  }, [currentWorkspace]);

  // Load messages when channel changes
  useEffect(() => {
    if (!currentWorkspace || !activeChannel) return;
    getMessages(currentWorkspace.id, activeChannel.id).then(setMessages);
  }, [currentWorkspace, activeChannel]);

  // Listen for real-time events
  useEffect(() => {
    if (!socket) return;

    function handleNewMessage(data: { message: ChatMessage; channelId: string }) {
      if (data.channelId === activeChannel?.id) {
        setMessages((prev) => [...prev, data.message]);
      }
    }

    function handleTyping(data: { userId: string; channelId: string }) {
      if (data.channelId === activeChannel?.id && data.userId !== user?.id) {
        setTypingUsers((prev) => new Set(prev).add(data.userId));
        setTimeout(() => {
          setTypingUsers((prev) => {
            const next = new Set(prev);
            next.delete(data.userId);
            return next;
          });
        }, 3000);
      }
    }

    function handleNewChannel(data: { channel: Channel }) {
      // setChannels((prev) => [...prev, data.channel]);
      setChannels((prev) => {
        if (prev.some((c) => c.id === data.channel.id)) return prev; // skip duplicate
        return [...prev, data.channel];
      });
    }

    socket.on('message:new', handleNewMessage);
    socket.on('channel:typing', handleTyping);
    socket.on('channel:created', handleNewChannel);

    return () => {
      socket.off('message:new', handleNewMessage);
      socket.off('channel:typing', handleTyping);
      socket.off('channel:created', handleNewChannel);
    };
  }, [socket, activeChannel, user]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  function handleTypingIndicator() {
    if (!socket || !currentWorkspace || !activeChannel) return;
    socket.emit('channel:typing', {
      workspaceId: currentWorkspace.id,
      channelId: activeChannel.id,
    });
  }

  async function handleSend() {
    if (!currentWorkspace || !activeChannel || !input.trim()) return;
    const content = input;
    setInput('');
    await sendMessage(currentWorkspace.id, activeChannel.id, content);
  }

  async function handleCreateChannel() {
    if (!currentWorkspace) return;
    const name = prompt('Channel name (lowercase, no spaces):');
    if (!name) return;
    const channel = await createChannel(currentWorkspace.id, { name });
    // setChannels((prev) => [...prev, channel]);
    setChannels((prev) => {
      if (prev.some((c) => c.id === channel.id)) return prev;
      return [...prev, channel];
    });
    setActiveChannel(channel);
  }

  if (!currentWorkspace) return null;

  return (
    <div className="flex h-screen">
      {/* Channel list */}
      <div className="w-56 shrink-0 border-r border-zinc-800 p-3">
        <div className="mb-3 flex items-center justify-between px-1">
          <span className="text-xs font-medium uppercase text-zinc-500">Channels</span>
          <button onClick={handleCreateChannel} className="text-zinc-500 hover:text-zinc-300">
            <Plus className="h-3.5 w-3.5" />
          </button>
        </div>
        <div className="space-y-0.5">
          {channels.map((ch) => (
            <button
              key={ch.id}
              onClick={() => setActiveChannel(ch)}
              className={`flex w-full items-center gap-1.5 rounded-md px-2 py-1.5 text-sm ${
                activeChannel?.id === ch.id
                  ? 'bg-zinc-800 text-zinc-100'
                  : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'
              }`}
            >
              <Hash className="h-3.5 w-3.5" />
              {ch.name}
            </button>
          ))}
        </div>
      </div>

      {/* Messages */}
      <div className="flex flex-1 flex-col">
        {activeChannel ? (
          <>
            <div className="border-b border-zinc-800 px-5 py-3">
              <div className="flex items-center gap-1.5 text-sm font-medium text-zinc-100">
                <Hash className="h-4 w-4 text-zinc-500" />
                {activeChannel.name}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4">
              <div className="space-y-4">
                {messages.map((msg) => (
                  <div key={msg.id} className="flex gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-800 text-xs font-medium text-zinc-300">
                      {msg.author?.username.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-sm font-medium text-zinc-100">
                          {msg.author?.fullName || msg.author?.username}
                        </span>
                        <span className="text-xs text-zinc-600">
                          {formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true })}
                        </span>
                      </div>
                      <p className="text-sm text-zinc-300">{msg.content}</p>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {typingUsers.size > 0 && (
                <p className="mt-2 text-xs italic text-zinc-500">Someone is typing...</p>
              )}
            </div>

            <div className="border-t border-zinc-800 p-4">
              <div className="flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2">
                <input
                  value={input}
                  onChange={(e) => {
                    setInput(e.target.value);
                    handleTypingIndicator();
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  placeholder={`Message #${activeChannel.name}`}
                  className="flex-1 bg-transparent text-sm text-zinc-100 outline-none placeholder:text-zinc-600"
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim()}
                  className="text-zinc-500 hover:text-zinc-200 disabled:opacity-30"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-1 items-center justify-center text-zinc-500">
            <div className="text-center">
              <p className="mb-3 text-sm">No channels yet</p>
              <button
                onClick={handleCreateChannel}
                className="rounded-md bg-zinc-100 px-3 py-1.5 text-sm font-medium text-zinc-900"
              >
                Create #general
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}