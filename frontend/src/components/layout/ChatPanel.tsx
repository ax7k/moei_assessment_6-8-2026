"use client";

import { CopilotChat } from "@copilotkit/react-ui";
import "@copilotkit/react-ui/styles.css";

export function ChatPanel() {
  return (
    <div className="chat-panel">
      {/* Header */}
      <div className="chat-panel-header">
        <div>
          <div className="chat-panel-title">AI Assistant · المساعد الذكي</div>
          <div className="chat-panel-subtitle">Ask anything about your workforce</div>
        </div>
        <div className="chat-panel-badge" title="Connected" />
      </div>

      {/* CopilotKit Chat */}
      <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
        <CopilotChat
          className="copilotKitChat"
          instructions={`You are an intelligent HR management assistant for MOEI (Ministry of Energy & Infrastructure, UAE).

You have access to data about 260 employees across all departments including:
- Performance scores (2023, 2024, 2025)
- Training history (courses, hours, categories)  
- Leave records (annual and sick leave)
- Career movements (promotions, transfers, hires)
- Salary, grade, engagement scores

You can also answer questions about official MOEI HR policies by searching the policy documents.

Guidelines:
- Be concise and data-driven
- If the user writes in Arabic, respond in Arabic
- Highlight actionable insights
- When referring to specific employees, use their full name
- Format AED amounts with commas

You can also navigate the dashboard by calling the navigateTo action.`}
          labels={{
            title: "HR Assistant",
            placeholder: "Ask about employees, performance, policies… | اسأل عن الموظفين والأداء والسياسات",
            stopGenerating: "Stop",
            regenerateResponse: "Regenerate",
          }}
        />
      </div>
    </div>
  );
}
