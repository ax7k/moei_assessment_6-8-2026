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
> I chose the management door because it presents a richer, multi-dimensional analytical challenge: translating raw workforce records (performance, training, leaves, movements) into strategic decisions. The main thing I wanted the product to do well is to go beyond a static dashboard by providing an active AI interpreter. Through the natural language assistant, a manager can query complex, cross-referenced workforce patterns (like flight risks or promotion queues) in English or Arabic, and receive both the data cohorts and the reasoning behind them, rather than just raw numbers.

**2. The door you didn't build.**
Briefly sketch the employee assistant. What would it do, what data and AI would it need, and why would the employee care?
> The employee assistant (Door A) would act as a personal HR concierge. It would answer policy questions ("What is my annual leave entitlement?"), check individual status ("How many leave days do I have left this year?"), check eligibility ("Am I eligible to enroll in the Leadership course?"), and perform actions on their behalf ("Draft a sick leave request for yesterday").
> It would need read/write access to the database (specifically the logged-in employee's record across `employees`, `leave_data`, and `training`), a PDF policy index for QA grounding, and an agent capable of tool calling to perform database writes safely. Employees would care because it eliminates the tedious process of digging through dense policy PDFs or using outdated portals, saving time and administrative friction.

**3. AI: help vs. override.**
Where did your AI tools help you most, and where did you correct, distrust, or overrule them?
> The AI tools were invaluable for scaffolding the Next.js 15 layout, Recharts integration, and the FastAPI/LangGraph structure. However, I had to overrule the AI on multiple occasions:
> 1. **SQL Generation:** The LLM initially generated queries using reserved SQL keywords (e.g., using `leave` instead of `leave_data`) or functions unsupported by SQLite. I overruled this by writing strict prompt guidelines specifying the SQLite dialect, exact table names, and explicit date-math formats using `julianday()`.
> 2. **Build and Dev Environment:** The AI suggested using the latest Next.js 16 with Turbopack, which caused severe junction-point and symlink permission errors on Windows. I overruled this by downgrading the frontend to Next.js 15 and reverting to Webpack. I also simplified the Docker setup from a multi-stage production build to a simple reload-based development build (`npm run dev`) for faster startup.

**4. Cut for time.**
What did you leave out or simplify, and what would you build next with more time?
> Due to time constraints, I simplified the policy retrieval system by using a lightweight BM25 keyword index instead of a full vector database (e.g., Chroma or FAISS), which is sufficient for exact text matching but lacks semantic nuance. I also left out database write capabilities (such as allowing managers to log new training enrollments or adjust employee details) and kept the database read-only.
> With more time, I would build a multi-agent hierarchy (e.g., separate specialist agents for SQL querying, policy retrieval, and dashboard navigation) and implement a semantic reranker on top of the policy search.

**5. One thing you'd redo.**
What are you unsure about, or would do differently if you started again?
> If starting again, I would implement a hybrid query approach where common questions (e.g., "What is the headcount in Finance?") are matched against predefined parameterized queries before falling back to full text-to-SQL generation. This would guarantee 100% accuracy for standard queries and reduce LLM execution cost. I would also scaffold the project with Next.js 15 from the first minute to bypass Windows-specific Turbopack symlink issues.
