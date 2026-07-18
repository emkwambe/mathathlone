# MathAthlone Real-Time Architecture Recommendation
**Date:** July 18, 2026  
**Author:** Manus AI (Mpingo Systems LLC)

This document evaluates the technology stack for MathAthlone’s real-time competition platform. The evaluation specifically addresses the requirements for public heats running every 10–20 minutes, live lobbies with countdown timers, participant ordering, and scalability from 10–20 concurrent competitors up to national tournaments.

## 1. Current Architecture & Constraints

MathAthlone currently relies entirely on **Supabase Realtime** for its live infrastructure. The implementation uses three distinct channels per heat: `postgres_changes` for status updates, `broadcast` for answer submissions, and `presence` as a keepalive beacon [1].

While Supabase Realtime is built on the robust Elixir/Phoenix framework, its managed tier imposes strict connection limits. The Pro plan ($25/month) caps out at 500 concurrent connections [1]. Because each participant opens at least one WebSocket connection, a national tournament running 200 concurrent heats of 20 participants would require 4,000 connections, immediately exceeding the Pro plan limits and requiring an expensive upgrade to the Team or Enterprise tier [1].

Furthermore, the current architecture lacks a server-authoritative state. The countdown timers are managed client-side in React, which inevitably leads to synchronization drift between participants.

## 2. Evaluation of Real-Time Alternatives

To solve the connection limits and state synchronization issues, we evaluated three leading real-time architectures suited for competitive gaming and live quizzes.

### Option A: Supabase Realtime (Team Tier)
Continuing with the current stack but upgrading the pricing tier.
*   **Pros:** Zero code migration. The current implementation in `heat-realtime.ts` remains intact.
*   **Cons:** Expensive at scale. Does not solve the server-authoritative timer issue; timers remain vulnerable to client-side manipulation and clock drift.
*   **Verdict:** Insufficient for a high-stakes national tournament platform.

### Option B: Redis Sorted Sets + Server-Sent Events (SSE)
Using Upstash Redis or Amazon ElastiCache to manage leaderboards and state, pushing updates via SSE [2].
*   **Pros:** Redis Sorted Sets (`ZSET`) are mathematically perfect for leaderboards [2]. Extremely fast and horizontally scalable.
*   **Cons:** SSE is unidirectional (server to client). Participants still need to submit answers via REST APIs, which introduces latency compared to bi-directional WebSockets.
*   **Verdict:** Excellent for the leaderboard data structure, but suboptimal for the live transport layer of a competition.

### Option C: Cloudflare Durable Objects (PartyKit)
Deploying stateful serverless functions at the edge, where each Heat is a single Durable Object instance that acts as a WebSocket server [3].
*   **Pros:** Solves the server-authoritative timer natively. The Durable Object holds the "true" clock and broadcasts the exact time remaining to all 20 participants in the heat. It supports WebSocket Hibernation, meaning you are not billed for idle time between public heats [3]. Infinite horizontal scaling (one object per heat).
*   **Cons:** Requires migrating the real-time transport logic out of Supabase and into Cloudflare Workers.
*   **Verdict:** The ideal architecture for live, stateful, room-based multiplayer applications like Kahoot or MathAthlone.

## 3. Recommended Architecture

We strongly recommend migrating MathAthlone's real-time layer to **Cloudflare Durable Objects** (or PartyKit, which is now integrated into Cloudflare) [4].

### How It Fulfills the Requirements

**1. Public Heats (10–20 minutes)**
A Durable Object is spun up for each public heat. It manages the 10-minute lifecycle entirely in memory. When the heat ends, the Object writes the final results to Supabase PostgreSQL and hibernates, costing nothing until the next heat begins [3].

**2. Live Lobbies & Server-Authoritative Timers**
The Durable Object holds the master clock. It sends a `tick` event over the WebSocket every second. All 20 clients render the timer based on the server's tick, ensuring no student can manipulate their local clock to gain extra time.

**3. Participant Ordering & Country Flags**
As users join the WebSocket, the Durable Object maintains an ordered array of participants in memory. This array is broadcast to all clients instantly. Country flags can be appended to the user payload during the initial WebSocket handshake.

**4. National Tournament Scalability**
Cloudflare automatically distributes Durable Objects across its global edge network. 1,000 concurrent heats simply means 1,000 isolated Durable Objects running in parallel, bypassing the Supabase 500-connection bottleneck entirely [3].

### Implementation Roadmap

1.  **Database:** Keep Supabase PostgreSQL as the permanent source of truth for users, curriculum, and historical heat results.
2.  **Edge Compute:** Create a Cloudflare Worker with a Durable Object class named `HeatRoom`.
3.  **Client:** Replace `subscribeToHeat` in `src/lib/competition/heat-realtime.ts` with a standard native `WebSocket` connection pointing to the Cloudflare Worker URL.
4.  **State Sync:** The `HeatRoom` handles the 10-20 participant limit, the countdown timer, and the live leaderboard sorting in memory, flushing the final state to Supabase only when the heat concludes.

---

## References

[1] Supabase. "Realtime Limits." Supabase Docs. https://supabase.com/docs/guides/realtime/limits  
[2] Redis. "Real-time leaderboard & ranking solutions." Redis Solutions. https://redis.io/solutions/leaderboards/  
[3] Cloudflare. "Use WebSockets." Cloudflare Durable Objects Docs. https://developers.cloudflare.com/durable-objects/best-practices/websockets/  
[4] Cloudflare. "Cloudflare acquires PartyKit." Cloudflare Blog, April 2024. https://blog.cloudflare.com/cloudflare-acquires-partykit/
