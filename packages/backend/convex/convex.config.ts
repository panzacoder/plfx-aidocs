import { defineApp } from "convex/server";
import agent from "@convex-dev/agent/convex.config";
import persistentTextStreaming from "@convex-dev/persistent-text-streaming/convex.config";

const app = defineApp();
app.use(agent);
app.use(persistentTextStreaming);

export default app; 