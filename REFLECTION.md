# REFLECTION — MOEI HR Companion

> Five short questions. A few sentences each is plenty — we want your thinking, not an essay.
> (Which model you used, your structured/agentic pattern, and how you grounded answers go in the
> README, not here.) Replace each _italic prompt_ with your own words. This file is graded.

**Name:** Abdul
**Door I built:** management side
**In one line, what it does:** An executive HR dashboard and natural-language assistant that lets MOEI managers explore workforce KPIs, drill down into department breakdowns, inspect employee profiles, search policies, and get actionable recommendations.

---

**1. Why this product?**
Why did you pick this door and this idea? What's the one thing you wanted it to do well?
> I chose the management door because I wanted to tackle the real analytical pain points that senior executives face when navigating organization-wide data. My main goal was to build a dashboard that avoided cognitive overload—keeping the visual design clean and focused by tucking detailed information away in interactive drawers and modals, while displaying the exact KPIs and alert banners they need to make prompt, strategic decisions.

**2. The door you didn't build.**
Sketch the other side. What would it do, what data or AI would it need, and why would that
audience (employee or manager) actually care about it?
> I skipped the employee assistant because it felt standard and didn't offer as much creative freedom to build something interesting. If I were to build it, I would check what backend employee services exist and integrate routing components directly into the chatbot. Instead of making employees waste time navigating menu links, the assistant would dynamically render the correct UI actions or direct page routes right inside the chat bubble so they can get their tasks done instantly.

**3. AI: help vs. override.**
Where did your AI tools help you most, and where did you correct, distrust, or overrule them?
> I used the AI tools primarily to take my initial architectural ideas and layout designs and turn them into a real, functional codebase. The workflow was highly collaborative: I constantly reviewed the AI's proposed implementation plans, inspected the generated code changes, and overruled it whenever it suggested over-engineered setups or got stuck on environment/protocol details.

**4. Cut for time.**
What did you leave out or simplify, and what would you build next with more time?
> If I had more time, I would build a robust caching system for the database queries to speed up recurring analytical lookups. I would also optimize the AI orchestration; right now, a heavy LLM is called to do everything. I would split this into an intelligent routed system where smaller, faster models handle classification and intent routing, leaving the heavy lifting of SQL generation to the larger model.

**5. One thing you'd redo.**
What are you unsure about, or would do differently if you started again?
> Honestly, I got everything working exactly as I wanted to! But if I started again, I would definitely NOT use SSE and CopilotKit. It made my life incredibly tough with complex handshake protocols, and streaming SQL execution logs to the frontend ended up being pretty useless anyway. I would write a clean custom websocket or REST-based chat stream instead.
