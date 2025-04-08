"use client";

import { Form, FormUiSchema } from "@zodform/core";
import { zAssistants } from "@v1/backend/convex/assistants/schema";

export function AssistantForm() {
  return <Form schema={zAssistants} />;
}
