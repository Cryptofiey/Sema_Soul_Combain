import { SemanticNode, SemanticTree, InterceptorLog, ChatMessage } from "./types";

export class SemanticCombine {
  private aiClient: any;
  private defaultModel: string;

  constructor(config: { apiKey: string, defaultModel?: string }) {
    if (!config.apiKey) {
      throw new Error("GEMINI_API_KEY is required to initialize SemanticCombine");
    }
    // Lazy importing to avoid client-side bundling issues if used dynamically, 
    // but assuming this is used in Node environment.
    const { GoogleGenAI } = require("@google/genai");
    this.aiClient = new GoogleGenAI({ apiKey: config.apiKey });
    this.defaultModel = config.defaultModel || "gemini-2.5-flash";
  }

  /**
   * Crystallizes a new phantom identity tree based on a given task.
   */
  async crystallizeTree(task: string): Promise<SemanticTree> {
    const prompt = `
You are a Semantic Crystallization Engine.
The user's task is: "${task}"

Your goal is to construct a hierarchical tree of markdown files (Semantic Nodes) that creates a perfect "Phantom Identity" (a specialized AI agent mindset) suited for this task. 
The tree MUST follow an ascending path from fundamental reality adjustments up to specific instrumental focus.

Define 5 layers:
Layer 1: Base Worldview (Fundamental logic/physics of the domain)
Layer 2: Phantom Soul / Identity (Who is the agent?)
Layer 3: Methodologies & Core Practices
Layer 4: Instrument & Toolchain Matrix
Layer 5: Task Specific Focus

Respond ONLY with a valid JSON matching this schema:
{
  "phantomName": "Name of the Identity",
  "nodes": [
    {
      "id": "node_1",
      "filename": "l1_base_reality.md",
      "layer": 1,
      "layerName": "Base Worldview",
      "concept": "Brief concept description",
      "content": "The actual text instructing the AI's mindset for this node.",
      "isActive": true,
      "branch": "core"
    }
  ]
}

Assign appropriate branches (e.g., "core", "frontend", "backend", "database"). Set isActive to true for all initially. Generate 6-10 nodes total.
    `;

    const response = await this.aiClient.models.generateContent({
      model: this.defaultModel,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      }
    });

    const jsonText = response.text;
    if (!jsonText) throw new Error("Empty response from AI model");

    const tree = JSON.parse(jsonText);
    tree.task = task;
    return tree as SemanticTree;
  }

  /**
   * Intercepts a chat message, shifting semantic focus (Point of Assembly).
   */
  async interceptChat(message: string, currentTree: SemanticTree): Promise<{ updatedNodes: SemanticNode[], interceptorLog: InterceptorLog, agentResponse: string }> {
    const prompt = `
You are the Semantic Interceptor Orchestrator (The Combine). 
The user is having a conversation with the main agent, but YOU intercept the message first to automatically adjust the Agent's "Point of Assembly" dynamically.

Current Agent Tree Nodes:
${JSON.stringify(currentTree.nodes, null, 2)}

User Message: "${message}"

Tasks:
1. FOCUS SHIFTS: Analyze if the message requires a shift in semantic focus. Switch "isActive": false for irrelevant nodes and true for relevant ones. Do NOT delete nodes, only toggle them. 
2. SYNTHESIZE NEW NEURONS: If the user introduces a novel specific environment or constraint, synthesize a NEW node on Layer 3 or 4. Give it a highly adaptive soft-guidance heuristic.
3. Return the fully updated array of nodes, plus an interceptorLog describing the shift.

Respond ONLY with a valid JSON:
{
  "updatedNodes": [ ... array of nodes ],
  "interceptorLog": {
    "action": "Brief summary",
    "changes": ["Change 1", "Change 2"]
  }
}
    `;

    const response = await this.aiClient.models.generateContent({
      model: this.defaultModel,
      contents: prompt,
      config: { responseMimeType: "application/json" }
    });

    const data = JSON.parse(response.text || "{}");
    const agentResponse = `(Смещение точки сборки применено. Я готов реагировать на новые условия: "${message}". Мой контекст адаптирован.)`;

    return { 
      updatedNodes: data.updatedNodes,
      interceptorLog: data.interceptorLog,
      agentResponse
    };
  }
}
