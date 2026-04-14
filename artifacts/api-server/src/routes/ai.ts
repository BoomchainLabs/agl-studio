import { Router } from "express";
import { db } from "@workspace/db";
import {
  aiConversationsTable,
  aiMessagesTable,
  aiInsightsCacheTable,
  cacheMetaTable,
  transfersTable,
} from "@workspace/db/schema";
import { eq, desc, count } from "drizzle-orm";
import { openai } from "@workspace/integrations-openai-ai-server";
import { getTokenStats } from "../lib/blockchain.js";


const router = Router();

const INSIGHTS_TTL_MS = 30 * 60 * 1000;

async function buildSystemPrompt(): Promise<string> {
  try {
    const [stats, transferCount, burnCount] = await Promise.all([
      getTokenStats(),
      db.select({ count: count() }).from(transfersTable),
      db.select({ count: count() }).from(transfersTable).where(eq(transfersTable.isBurn, true)),
    ]);

    return `You are an expert AI analyst for the AGL (Agilitas) token, deployed on Base mainnet.

LIVE TOKEN DATA:
- Contract: 0xEA1221B4d80A89BD8C75248Fae7c176BD1854698 (Base Mainnet, Chain ID 8453)
- Total Supply: ${stats.totalSupplyFormatted}
- Total Burned: ${stats.totalBurnedFormatted} (${stats.burnPercentage.toFixed(4)}% of supply)
- Circulating Supply: ${stats.circulatingSupplyFormatted}
- Indexed Transfer Events: ${transferCount[0]?.count ?? 0}
- Indexed Burn Events: ${burnCount[0]?.count ?? 0}

CONTEXT:
- AGL is a deflationary token with a burn mechanism
- Staking module is in development (no live contract yet)
- DAO governance is in development (no live contract yet)
- Data is indexed from Base blockchain starting at block 22,000,000

You provide authoritative, precise token analysis. You answer questions about tokenomics, burn mechanics, on-chain activity, staking design, and governance architecture. Be direct, data-driven, and concise. Never speculate beyond available data. If asked about price or market data, explain you only have on-chain metrics.`;
  } catch {
    return `You are an expert AI analyst for the AGL (Agilitas) token on Base mainnet. Contract: 0xEA1221B4d80A89BD8C75248Fae7c176BD1854698. Provide authoritative token analysis based on available on-chain data.`;
  }
}

router.get("/insights", async (_req, res) => {
  try {
    const cached = await db
      .select()
      .from(aiInsightsCacheTable)
      .where(eq(aiInsightsCacheTable.key, "insights"))
      .limit(1);

    if (cached[0]) {
      const age = Date.now() - new Date(cached[0].updatedAt).getTime();
      if (age < INSIGHTS_TTL_MS) {
        res.json(JSON.parse(cached[0].value));
        return;
      }
    }

    const systemPrompt = await buildSystemPrompt();

    const completion = await openai.chat.completions.create({
      model: "gpt-5.2",
      max_completion_tokens: 1024,
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content:
            'Generate a concise AGL token analysis. Return a JSON object with these exact keys: {"summary": "2-3 sentence overview", "burnAnalysis": "burn mechanism analysis", "marketSentiment": "neutral/bullish/bearish with brief reason", "keyMetrics": ["metric1", "metric2", "metric3", "metric4"]}. Return only valid JSON, no markdown.',
        },
      ],
    });

    const raw = completion.choices[0]?.message?.content ?? "{}";
    let parsed: Record<string, unknown>;
    try {
      const jsonStart = raw.indexOf("{");
      const jsonEnd = raw.lastIndexOf("}") + 1;
      parsed = JSON.parse(raw.slice(jsonStart, jsonEnd));
    } catch {
      parsed = {
        summary: "AGL token analysis is currently being computed. Please try again shortly.",
        burnAnalysis: "Burn data is available in the analytics section.",
        marketSentiment: "Neutral — on-chain metrics are nominal.",
        keyMetrics: ["1B total supply", "Deflationary mechanism active", "Base mainnet native"],
      };
    }

    const insights = {
      ...parsed,
      generatedAt: new Date().toISOString(),
    };

    await db
      .insert(aiInsightsCacheTable)
      .values({ key: "insights", value: JSON.stringify(insights) })
      .onConflictDoUpdate({
        target: aiInsightsCacheTable.key,
        set: { value: JSON.stringify(insights), updatedAt: new Date() },
      });

    res.json(insights);
  } catch (err) {
    console.error("AI insights error:", err);
    res.status(500).json({ error: "Failed to generate insights" });
  }
});

router.get("/conversations", async (_req, res) => {
  try {
    const rows = await db
      .select()
      .from(aiConversationsTable)
      .orderBy(desc(aiConversationsTable.createdAt))
      .limit(50);

    res.json(
      rows.map((r) => ({
        id: r.id,
        title: r.title,
        createdAt: r.createdAt?.toISOString() ?? new Date().toISOString(),
      }))
    );
  } catch (err) {
    console.error("List conversations error:", err);
    res.status(500).json({ error: "Failed to list conversations" });
  }
});

router.post("/conversations", async (req, res) => {
  try {
    const { title } = req.body;
    if (!title) {
      res.status(400).json({ error: "title is required" });
      return;
    }

    const [row] = await db.insert(aiConversationsTable).values({ title }).returning();

    res.status(201).json({
      id: row.id,
      title: row.title,
      createdAt: row.createdAt?.toISOString() ?? new Date().toISOString(),
    });
  } catch (err) {
    console.error("Create conversation error:", err);
    res.status(500).json({ error: "Failed to create conversation" });
  }
});

router.get("/conversations/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      res.status(400).json({ error: "Invalid conversation ID" });
      return;
    }

    const [conv, messages] = await Promise.all([
      db.select().from(aiConversationsTable).where(eq(aiConversationsTable.id, id)).limit(1),
      db
        .select()
        .from(aiMessagesTable)
        .where(eq(aiMessagesTable.conversationId, id))
        .orderBy(aiMessagesTable.createdAt),
    ]);

    if (!conv[0]) {
      res.status(404).json({ error: "Conversation not found" });
      return;
    }

    res.json({
      id: conv[0].id,
      title: conv[0].title,
      createdAt: conv[0].createdAt?.toISOString() ?? new Date().toISOString(),
      messages: messages.map((m) => ({
        id: m.id,
        conversationId: m.conversationId,
        role: m.role,
        content: m.content,
        createdAt: m.createdAt?.toISOString() ?? new Date().toISOString(),
      })),
    });
  } catch (err) {
    console.error("Get conversation error:", err);
    res.status(500).json({ error: "Failed to get conversation" });
  }
});

router.delete("/conversations/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      res.status(400).json({ error: "Invalid conversation ID" });
      return;
    }

    const rows = await db.delete(aiConversationsTable).where(eq(aiConversationsTable.id, id)).returning();

    if (!rows[0]) {
      res.status(404).json({ error: "Conversation not found" });
      return;
    }

    res.status(204).send();
  } catch (err) {
    console.error("Delete conversation error:", err);
    res.status(500).json({ error: "Failed to delete conversation" });
  }
});

router.post("/conversations/:id/messages", async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      res.status(400).json({ error: "Invalid conversation ID" });
      return;
    }

    const { content } = req.body;
    if (!content) {
      res.status(400).json({ error: "content is required" });
      return;
    }

    const [conv] = await db
      .select()
      .from(aiConversationsTable)
      .where(eq(aiConversationsTable.id, id))
      .limit(1);

    if (!conv) {
      res.status(404).json({ error: "Conversation not found" });
      return;
    }

    await db.insert(aiMessagesTable).values({ conversationId: id, role: "user", content });

    const history = await db
      .select()
      .from(aiMessagesTable)
      .where(eq(aiMessagesTable.conversationId, id))
      .orderBy(aiMessagesTable.createdAt);

    const systemPrompt = await buildSystemPrompt();

    const chatMessages = [
      { role: "system" as const, content: systemPrompt },
      ...history.map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
    ];

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders();

    let fullResponse = "";

    const stream = await openai.chat.completions.create({
      model: "gpt-5.2",
      max_completion_tokens: 8192,
      messages: chatMessages,
      stream: true,
    });

    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta?.content;
      if (delta) {
        fullResponse += delta;
        res.write(`data: ${JSON.stringify({ content: delta })}\n\n`);
      }
    }

    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();

    await db.insert(aiMessagesTable).values({
      conversationId: id,
      role: "assistant",
      content: fullResponse,
    });
  } catch (err) {
    console.error("Send message error:", err);
    if (!res.headersSent) {
      res.status(500).json({ error: "Failed to send message" });
    } else {
      res.write(`data: ${JSON.stringify({ error: "Stream error occurred" })}\n\n`);
      res.end();
    }
  }
});

export default router;
