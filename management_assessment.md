# Technical Assessment: MOEI HR Companion (Batch 2) - Management Focus

This document summarizes the requirements, constraints, and grading criteria specifically for the **Management View (Door B)** of the MOEI HR Companion, along with all general criteria relevant to the project.

---

## 1. The Brief
*   **Target User:** The manager, who says **"help me understand and decide."**
*   **Key Questions to Answer:**
    *   Who on my team is doing well?
    *   Who might be about to leave?
    *   Who is ready to grow?
*   **Core Objective:** Pick **Door B (The management view)**, build it well as a working product, and in your README describe how you would design/build the other (Door A - The employee assistant).
*   **Evaluation Focus:** Developer judgment as an AI developer rather than the volume of code. Grounding messy human requests, creating trustworthy reasoning, and providing a clean, finished one-door build with a clear design of the other.

---

## 2. Door B — The Management View (Working Product)
A tool that turns employee data into actionable insight for a manager.

### Key Inspiration Ideas:
*   **Learning & Development:** Who is investing most in learning, and who has gone cold.
*   **Promotion Readiness:** Who looks ready for promotion (derived from strong performance, recent learning, and tenure/time since last move).
*   **Retention & Gaps:** Who might be a flight risk (attrition risk), or where a team has a skills gap.
*   **Interactive Querying ("Ask your workforce"):** A manager asks a question in plain language, and the tool reasons over the dataset to answer with the actual people involved and the logical reasons why.

### The Quality Bar:
*   **Interpretation is Required:** A static dashboard of charts is the absolute floor.
*   **Actionable Analytics:** Real analytics must explain *why* something changed and suggest *what* to do. The AI must interpret the data, not just plot it.
*   **AI Capability:** The solution must show real AI capability that interprets and recommends. If it lacks interpretation, the score for this section is capped at **15 out of 40 marks**.

---

## 3. Design the Other: Door A — The Employee Assistant (Readme Only)
You must design the employee assistant in your `README.md`.
*   **Focus:** An assistant that says **"help me, quickly."** (Answers questions, checks balances, performs tasks with less digging).
*   **Requirements for the Design:**
    *   Explain what it would do.
    *   Identify what data and AI it would need.
    *   Explain why the employee user would care.

---

## 4. Grounding Data
You are provided with two primary grounding sources that the management tool must reason over:

1.  **The Synthetic Employee Dataset (People):**
    *   A spreadsheet of `~260` fictional employees across five CSV sheets:
        *   `Employees.csv`
        *   `Performance.csv`
        *   `Training.csv`
        *   `Leave.csv`
        *   `Movement.csv`
    *   **Management Integration:** The management door reasons across everyone's records.
    *   **Derived Metrics:** Nothing is pre-computed. Metrics such as tenure, promotion-readiness, and attrition risks must be derived by your application logic and AI.
2.  **The HR Knowledge Base (Policy) [Secondary Focus]:**
    *   Official MOEI / UAE Federal HR documents in English and Arabic.
    *   *Note:* While primarily tailored for the employee path (leave entitlements, code of ethics), it will be integrated as a secondary lookup/grounding layer for manager queries (e.g., checking promotion criteria, training rules, or leave entitlements). Do not invent rules.


---

## 5. Key HR Terminology
*   **Performance Cycle:** The yearly review where a manager scores how an employee did against their goals.
*   **High-Potential / Promotion-Ready:** Someone ready to take on a bigger role soon—usually strong performance plus recent learning.
*   **Attrition / Flight Risk:** "Attrition" is people leaving. "Flight risk" is someone likely to leave soon.
*   **Headcount:** How many people work somewhere (e.g., headcount per department).
*   **Skills Gap:** A skill a team needs but doesn't have enough of yet.

---

## 6. How You'll Be Graded (Total: 100 Marks)

| Grading Area | Good Looks Like | Marks |
| :--- | :--- | :---: |
| **The Door You Built (Door B)** | Works and is a real product, not a generic dashboard. Solves the core challenge (interprets and recommends). | **40** |
| **AI Engineering** | Uses a current model with clear reasoning; deliberate agentic or structured pattern; graceful failure handling. | **20** |
| **The Door You Didn't Build** | A clear, credible design of the other side (what it does, data/AI needed, user value) in the README. | **15** |
| **Bilingual (EN / AR)** | Works in both English and Arabic, replying in the language the user writes in. Arabic is handled properly, not bolted on. | **10** |
| **Correctness & Judgment** | Policy answers grounded in the KB / people-insights honest with the data; runs from a clean clone; thoughtful `REFLECTION.md`. | **15** |

> [!IMPORTANT]
> **Quality Gate:** A static dashboard with no interpretation caps the 40-point block at about **15 marks**, however polished the UI looks.

---

## 7. Rules & Requirements
*   **Duration:** 2 hours for code, plus extra time for a ~2-minute walkthrough video.
*   **Work Mode:** Individual work.
*   **Bilingual Capability:** Must automatically reply in the user's input language (English or Arabic).
*   **Failure Handling:** Fail gracefully when the API errors or when an answer isn't in the dataset or knowledge base.
*   **API Keys:** Read keys (e.g., OpenRouter, OpenAI, etc.) from environment variables. **Never commit API keys.**

---

## 8. Submission Package Checklist
- [ ] **Working Code:** For Door B (Management view) grounded in the dataset and policy KB.
- [ ] **Bilingual Support:** Fully functional English and Arabic interaction.
- [ ] **README.md:** Must cover:
    - How to run the app.
    - Model choice and why.
    - One-line explanation of the deliberate AI pattern (structured output, tool call, or multi-step agent).
    - Design of the employee assistant (Door A).
    - List of completed features.
- [ ] **REFLECTION.md:** Completed reflection using the template provided.
- [ ] **GitHub URL:** Accessible repository containing the clean, runnable code.
