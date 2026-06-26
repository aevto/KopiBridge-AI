import type { RequirementCategory } from "@/types/analysis";

export interface SkillSignal {
  id: string;
  label: string;
  category: RequirementCategory;
  aliases: string[];
  related: string[];
  action: string;
  weight: number;
}

export const CATEGORY_WEIGHTS: Record<RequirementCategory, number> = {
  skills: 0.35,
  experience: 0.26,
  tools: 0.2,
  education: 0.12,
  communication: 0.07
};

export const SKILL_SIGNALS: SkillSignal[] = [
  {
    id: "python",
    label: "Python programming",
    category: "skills",
    aliases: ["python", "python3", "python programming"],
    related: ["pandas", "numpy", "scikit", "jupyter"],
    action: "Add a concrete Python project with libraries, outcomes, and repository link.",
    weight: 1.2
  },
  {
    id: "javascript-typescript",
    label: "JavaScript / TypeScript",
    category: "skills",
    aliases: ["javascript", "typescript", "ts", "js"],
    related: ["react", "next.js", "node"],
    action: "Show one shipped TypeScript or JavaScript app with clear product impact.",
    weight: 0.9
  },
  {
    id: "react",
    label: "React front-end development",
    category: "skills",
    aliases: ["react", "react.js", "next.js", "nextjs"],
    related: ["frontend", "components", "hooks"],
    action: "Include a React product feature and explain your component or state-management choices.",
    weight: 0.85
  },
  {
    id: "sql",
    label: "SQL and data manipulation",
    category: "skills",
    aliases: ["sql", "postgres", "postgresql", "mysql", "database query"],
    related: ["database", "join", "queries", "relational"],
    action: "Add database examples that mention joins, schema design, or analytical queries.",
    weight: 1
  },
  {
    id: "machine-learning",
    label: "Machine learning fundamentals",
    category: "skills",
    aliases: ["machine learning", "ml", "supervised learning", "classification", "regression"],
    related: ["model", "training", "features", "accuracy", "evaluation"],
    action: "Summarise an ML project with the model type, dataset, metric, and lesson learned.",
    weight: 1.25
  },
  {
    id: "deep-learning",
    label: "Deep learning frameworks",
    category: "tools",
    aliases: ["pytorch", "tensorflow", "keras", "deep learning", "neural network"],
    related: ["cnn", "rnn", "transformer", "gpu"],
    action: "Build or document a small PyTorch/TensorFlow project and state the evaluation metric.",
    weight: 1
  },
  {
    id: "llm",
    label: "LLM application development",
    category: "skills",
    aliases: ["llm", "large language model", "openai", "chatgpt", "gpt", "claude"],
    related: ["prompt", "rag", "embeddings", "agents"],
    action: "Build a small LLM app that shows prompting, guardrails, evaluation, or user workflow.",
    weight: 1.15
  },
  {
    id: "rag",
    label: "RAG / embeddings workflow",
    category: "tools",
    aliases: ["rag", "retrieval augmented", "embedding", "embeddings", "vector database", "semantic search"],
    related: ["pinecone", "weaviate", "chromadb", "retrieval"],
    action: "Prototype a retrieval workflow and explain chunking, retrieval, and answer quality checks.",
    weight: 0.95
  },
  {
    id: "api-backend",
    label: "API and backend development",
    category: "experience",
    aliases: ["api", "rest", "backend", "server", "fastapi", "flask", "express"],
    related: ["endpoint", "request", "response", "integration"],
    action: "Describe one backend API you built, including inputs, outputs, and validation.",
    weight: 0.95
  },
  {
    id: "testing",
    label: "Testing / error handling",
    category: "experience",
    aliases: ["testing", "test", "tests", "unit test", "unit tests", "error handling", "validation"],
    related: ["pytest", "jest", "playwright", "edge case", "failure case", "qa"],
    action: "Add one implemented test or error-handling flow to a relevant project before claiming testing experience.",
    weight: 0.75
  },
  {
    id: "cloud",
    label: "Cloud platforms",
    category: "tools",
    aliases: ["aws", "gcp", "google cloud", "azure", "cloud"],
    related: ["lambda", "s3", "ec2", "cloud run", "deployment"],
    action: "Complete a small cloud deployment and add the platform, service, and URL or screenshot.",
    weight: 1
  },
  {
    id: "docker",
    label: "Docker / containerisation",
    category: "tools",
    aliases: ["docker", "container", "containerization", "containerisation"],
    related: ["dockerfile", "compose", "image"],
    action: "Containerise a project and mention the Dockerfile, local run command, and deployment path.",
    weight: 0.85
  },
  {
    id: "data-pipelines",
    label: "Data pipelines / ETL",
    category: "experience",
    aliases: ["etl", "data pipeline", "data pipelines", "airflow", "ingestion"],
    related: ["extract", "transform", "load", "batch", "cleaning"],
    action: "Build a simple ingest-clean-transform pipeline and show before/after data quality checks.",
    weight: 0.95
  },
  {
    id: "deployment",
    label: "Model or app deployment",
    category: "experience",
    aliases: ["deploy", "deployment", "production", "serve model", "streamlit", "vercel"],
    related: ["hosted", "live demo", "release"],
    action: "Deploy one AI-related app and add the live link, architecture, and operational notes.",
    weight: 1
  },
  {
    id: "monitoring",
    label: "Monitoring and evaluation",
    category: "experience",
    aliases: ["monitoring", "logging", "observability", "evaluation", "metrics", "model performance"],
    related: ["precision", "recall", "latency", "error rate"],
    action: "Add evaluation and monitoring notes: metric, baseline, drift or error cases, and improvement.",
    weight: 0.8
  },
  {
    id: "mlops",
    label: "MLOps / CI-CD for ML",
    category: "tools",
    aliases: ["mlops", "ci/cd", "ci-cd", "github actions", "pipeline automation"],
    related: ["automation", "testing", "versioning"],
    action: "Add a lightweight CI workflow or model-versioning note to one project.",
    weight: 0.75
  },
  {
    id: "git",
    label: "Git and collaborative workflow",
    category: "tools",
    aliases: ["git", "github", "version control", "pull request"],
    related: ["branch", "commit", "repository"],
    action: "Make project repositories visible and mention collaboration, PRs, or issue tracking.",
    weight: 0.65
  },
  {
    id: "degree",
    label: "Computer science education",
    category: "education",
    aliases: ["computer science", "software engineering", "information systems", "bachelor", "degree"],
    related: ["data structures", "algorithms", "operating systems", "databases"],
    action: "Keep education concise, but add relevant AI, ML, data structures, and database coursework.",
    weight: 1
  },
  {
    id: "communication",
    label: "Stakeholder communication",
    category: "communication",
    aliases: ["communication", "stakeholder", "client", "presentation", "collaborate", "cross-functional"],
    related: ["team", "document", "explain", "requirements"],
    action: "Add examples where you explained technical work to users, teammates, or stakeholders.",
    weight: 0.7
  }
];
