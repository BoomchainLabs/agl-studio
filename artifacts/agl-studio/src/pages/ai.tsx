import { useState, useRef, useEffect } from "react";
import { 
  useGetAiInsights, getGetAiInsightsQueryKey, 
  useListAiConversations, getListAiConversationsQueryKey,
  useCreateAiConversation,
  useGetAiConversation, getGetAiConversationQueryKey,
  useDeleteAiConversation
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bot, MessageSquare, Plus, Send, Trash2, Zap, TrendingUp, Search } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

export default function AiAnalyst() {
  const queryClient = useQueryClient();
  const [activeConvId, setActiveConvId] = useState<number | null>(null);
  const [input, setInput] = useState("");
  const [streamingContent, setStreamingContent] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data: insights, isLoading: insightsLoading } = useGetAiInsights({ query: { queryKey: getGetAiInsightsQueryKey() } });
  const { data: convos, isLoading: convosLoading } = useListAiConversations({ query: { queryKey: getListAiConversationsQueryKey() } });
  
  const { data: activeConv, isLoading: activeConvLoading } = useGetAiConversation(activeConvId!, { 
    query: { enabled: !!activeConvId, queryKey: getGetAiConversationQueryKey(activeConvId!) } 
  });

  const createMutation = useCreateAiConversation();
  const deleteMutation = useDeleteAiConversation();

  useEffect(() => {
    if (convos?.length && !activeConvId) {
      setActiveConvId(convos[0].id);
    }
  }, [convos, activeConvId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [activeConv?.messages, streamingContent]);

  const handleCreate = async () => {
    try {
      const res = await createMutation.mutateAsync({ data: { title: "New Analysis" } });
      queryClient.invalidateQueries({ queryKey: getListAiConversationsQueryKey() });
      setActiveConvId(res.id);
    } catch (e) {}
  };

  const handleDelete = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await deleteMutation.mutateAsync({ id });
      queryClient.invalidateQueries({ queryKey: getListAiConversationsQueryKey() });
      if (activeConvId === id) setActiveConvId(null);
    } catch (e) {}
  };

  const handleSend = async () => {
    if (!input.trim() || !activeConvId || isStreaming) return;
    
    const userMsg = input.trim();
    setInput("");
    setIsStreaming(true);
    setStreamingContent("");
    
    // Optimistic UI update could go here if we tracked local state, 
    // but for simplicity we rely on the refetch after stream ends
    queryClient.setQueryData(getGetAiConversationQueryKey(activeConvId), (old: any) => {
      if (!old) return old;
      return {
        ...old,
        messages: [...(old.messages || []), { id: Date.now(), role: "user", content: userMsg }]
      };
    });

    try {
      const resp = await fetch(`/api/ai/conversations/${activeConvId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: userMsg }),
      });
      
      const reader = resp.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let fullContent = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";
        
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const jsonStr = line.slice(6).trim();
            if (!jsonStr) continue;
            try {
              const json = JSON.parse(jsonStr);
              if (json.done) break;
              if (json.content) {
                fullContent += json.content;
                setStreamingContent(fullContent);
              }
            } catch (e) {}
          }
        }
      }
      
      // Stream complete, refresh conversation
      queryClient.invalidateQueries({ queryKey: getGetAiConversationQueryKey(activeConvId) });
    } catch (e) {
      console.error(e);
    } finally {
      setIsStreaming(false);
      setStreamingContent("");
    }
  };

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="flex items-center justify-between border-b border-border/50 pb-4 shrink-0">
        <div>
          <h1 className="text-3xl font-bold tracking-tight uppercase text-primary flex items-center gap-3">
            <Bot className="h-8 w-8" />
            AI Token Analyst
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Terminal interface for AI-driven blockchain insights.</p>
        </div>
      </div>

      {insightsLoading ? <Skeleton className="h-32 w-full bg-primary/5" /> : insights ? (
        <Card className="border-primary/20 bg-card/50 backdrop-blur-sm rounded-none shrink-0 border-l-4 border-l-primary">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-6">
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2 text-primary text-xs font-bold tracking-widest">
                  <Zap className="h-4 w-4" /> AUTO-INSIGHT
                </div>
                <p className="text-sm text-foreground/90">{insights.summary}</p>
                <p className="text-xs text-muted-foreground pt-2">Generated: {new Date(insights.generatedAt).toLocaleString()}</p>
              </div>
              <div className="flex-1 space-y-2 border-l border-primary/10 pl-6 hidden md:block">
                <div className="flex items-center gap-2 text-primary text-xs font-bold tracking-widest">
                  <TrendingUp className="h-4 w-4" /> KEY METRICS
                </div>
                <div className="flex flex-wrap gap-2 pt-1">
                  {insights.keyMetrics?.map((m: string, i: number) => (
                    <Badge key={i} variant="outline" className="rounded-none border-primary/30 text-primary bg-primary/5 text-[10px]">
                      {m}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : null}

      <div className="flex flex-col md:flex-row gap-6 flex-1 min-h-[500px]">
        {/* Sidebar */}
        <Card className="w-full md:w-64 flex flex-col border-primary/20 bg-card/50 rounded-none shrink-0 h-[400px] md:h-auto">
          <div className="p-3 border-b border-primary/10 flex justify-between items-center bg-primary/5">
            <span className="text-xs font-bold text-primary tracking-widest">THREADS</span>
            <Button size="icon" variant="ghost" className="h-6 w-6 rounded-none text-primary hover:bg-primary/20" onClick={handleCreate} disabled={createMutation.isPending}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <ScrollArea className="flex-1">
            <div className="p-2 space-y-1">
              {convosLoading ? (
                Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-10 w-full bg-primary/5" />)
              ) : convos?.map(c => (
                <div 
                  key={c.id} 
                  className={`group flex items-center justify-between p-2 text-sm cursor-pointer transition-colors border-l-2 ${activeConvId === c.id ? 'bg-primary/10 border-primary text-primary' : 'border-transparent text-muted-foreground hover:bg-white/5'}`}
                  onClick={() => setActiveConvId(c.id)}
                >
                  <div className="flex items-center gap-2 truncate">
                    <MessageSquare className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{c.title}</span>
                  </div>
                  <Button 
                    size="icon" 
                    variant="ghost" 
                    className="h-5 w-5 opacity-0 group-hover:opacity-100 hover:text-destructive hover:bg-destructive/10 rounded-none"
                    onClick={(e) => handleDelete(c.id, e)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          </ScrollArea>
        </Card>

        {/* Chat Area */}
        <Card className="flex-1 flex flex-col border-primary/20 bg-card/50 rounded-none h-[500px] md:h-auto relative overflow-hidden">
          {activeConvId ? (
            <>
              <div className="p-3 border-b border-primary/10 bg-primary/5 text-xs text-primary font-mono tracking-widest flex items-center justify-between">
                <span>TERMINAL SESSION: {activeConvId.toString().padStart(4, '0')}</span>
                {activeConvLoading && <span className="animate-pulse">LOADING...</span>}
              </div>
              <div 
                ref={scrollRef}
                className="flex-1 overflow-y-auto p-4 space-y-6 font-mono text-sm"
              >
                {activeConv?.messages?.map((msg: any, i: number) => (
                  <div key={msg.id || i} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                    <div className="flex items-center gap-2 mb-1 text-[10px] text-muted-foreground tracking-widest">
                      {msg.role === 'user' ? 'USER_QUERY' : 'AI_RESPONSE'}
                    </div>
                    <div className={`p-3 max-w-[85%] border ${msg.role === 'user' ? 'bg-primary/10 border-primary/30 text-primary-foreground' : 'bg-muted/30 border-border text-foreground'}`}>
                      <div className="whitespace-pre-wrap">{msg.content}</div>
                    </div>
                  </div>
                ))}
                
                {isStreaming && (
                  <div className="flex flex-col items-start">
                    <div className="flex items-center gap-2 mb-1 text-[10px] text-primary tracking-widest animate-pulse">
                      AI_COMPUTING...
                    </div>
                    <div className="p-3 max-w-[85%] border bg-muted/30 border-primary/30 text-foreground">
                      <div className="whitespace-pre-wrap">{streamingContent}<span className="inline-block w-2 h-4 bg-primary ml-1 animate-pulse" /></div>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="p-3 border-t border-primary/20 bg-background/50 backdrop-blur">
                <form 
                  onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                  className="flex gap-2"
                >
                  <Input 
                    placeholder="Query AGL intelligence..." 
                    className="rounded-none border-primary/30 bg-black/50 focus-visible:ring-primary font-mono text-sm h-10"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    disabled={isStreaming}
                  />
                  <Button 
                    type="submit" 
                    className="rounded-none bg-primary text-primary-foreground hover:bg-primary/80 h-10 w-12 px-0"
                    disabled={!input.trim() || isStreaming}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
              <Search className="h-12 w-12 mb-4 opacity-20" />
              <p className="tracking-widest text-sm">SELECT OR CREATE A THREAD</p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}