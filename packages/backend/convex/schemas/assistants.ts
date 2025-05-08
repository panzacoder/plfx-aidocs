// This file is being consolidated with the validators in convex/assistants/validators.ts
// Export the validators from the proper location for backward compatibility
import {
  createAssistantSchema,
  listAssistantsSchema,
  getAssistantSchema,
  updateAssistantSchema,
  deleteAssistantSchema,
  syncAssistantSchema,
  addFileToAssistantSchema,
  removeFileFromAssistantSchema
} from "../assistants/validators";

export {
  createAssistantSchema,
  listAssistantsSchema,
  getAssistantSchema,
  updateAssistantSchema,
  deleteAssistantSchema,
  syncAssistantSchema,
  addFileToAssistantSchema,
  removeFileFromAssistantSchema
};
