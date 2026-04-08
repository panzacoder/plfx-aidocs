/**
 * Convex Agent + RAG configuration.
 *
 * Defines the AI agent used for chatbot conversations and the RAG component
 * used for document ingestion and retrieval.
 */
import { Agent, createTool } from "@convex-dev/agent";
import { RAG } from "@convex-dev/rag";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";
import { components } from "./_generated/api";

// ---------------------------------------------------------------------------
// RAG Component — handles document chunking, embedding, and search
// ---------------------------------------------------------------------------
export const rag = new RAG(components.rag, {
  textEmbeddingModel: openai.embedding("text-embedding-3-small"),
  embeddingDimension: 1536,
});

// ---------------------------------------------------------------------------
// RAG search tool — given to the agent so it can search uploaded documents
// ---------------------------------------------------------------------------
const searchDocuments = createTool({
  description:
    "Search through the organization's uploaded documents (policies, regulations, guidelines) to find relevant information for answering the user's question.",
  inputSchema: z.object({
    query: z.string().describe("Describe what information you are looking for"),
  }),
  execute: async (ctx, { query }, { metadata }) => {
    const namespace = metadata?.ragNamespace as string | undefined;
    if (!namespace) return "No documents have been uploaded for this assistant.";

    const results = await rag.search(ctx, {
      namespace,
      query,
      limit: 10,
    });
    return results.text || "No relevant documents found.";
  },
});

// ---------------------------------------------------------------------------
// Chat Agent — the main conversational agent
// ---------------------------------------------------------------------------
export const chatAgent = new Agent(components.agent, {
  name: "chatAgent",
  chat: openai.chat("gpt-4o"),
  textEmbedding: openai.embedding("text-embedding-3-small"),
  instructions:
    "You are a helpful assistant. Answer questions based on the documents and context available to you. When unsure, search the documents first. Be concise and professional.",
  tools: { searchDocuments },
});
