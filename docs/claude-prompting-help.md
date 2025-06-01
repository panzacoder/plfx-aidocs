# Claude Prompting Guide for Roadmap Implementation

This guide provides best practices for working with Claude to implement the assisted living facility roadmap effectively.

## **Recommended Workflow**

### **1. Start with Specific Phase 1 Tasks**
Pick one concrete feature from Phase 1 and ask Claude to implement it. For example:
- "Implement document classification metadata fields"
- "Add role-based permissions to the file manager"
- "Create a compliance dashboard component"

### **2. Use Task-Oriented Sessions**
Structure work sessions around specific outcomes:
```
"Add document type and category fields to the assistant file upload form"
"Create a search filter for regulatory frameworks" 
"Implement audit logging for document access"
```

### **3. Let Claude Manage Implementation Planning**
Claude will use the TodoWrite tool to break down each task into smaller steps, track progress, and ensure completion including:
- Code changes
- Testing
- Type checking/linting
- Documentation updates

### **4. Leverage Claude's Codebase Knowledge**
Claude can:
- Find the right files to modify based on existing patterns
- Follow current code conventions and architecture
- Identify integration points with existing features
- Suggest the most maintainable implementation approach

## **Suggested Starting Points**

### **Quick Wins (1-2 sessions each)**
1. **Document metadata schema**: Add classification fields to the backend
2. **Basic role-based access**: Extend existing org permissions
3. **Enhanced file manager UI**: Add category filters and metadata display

### **Medium Complexity (3-5 sessions each)**
1. **Compliance dashboard**: New page showing document status overview
2. **Advanced search**: Healthcare-specific indexing and filters  
3. **Document workflow**: Approval and review cycle management

### **Large Features (5+ sessions each)**
1. **OCR integration**: Document scanning and text extraction
2. **Regulatory assistant training**: Specialized AI model fine-tuning
3. **Mobile app**: Staff access during care activities

## **Best Practices for Sessions**

### **Be Specific About Scope**
✅ **Good**: "Add document type dropdown to the assistant file upload form with options for policy, procedure, regulation, form, and license"

❌ **Too Vague**: "Improve the document management system"

### **Reference the Roadmap**
✅ **Good**: "Following the Phase 1 plan in the roadmap, implement the document classification metadata"

### **Let Claude Handle Dependencies**
Claude will identify what needs to be done in order and suggest if prerequisites need to be tackled first.

### **Iterate and Refine**
After implementing features, you can ask Claude to:
- Add refinements or handle edge cases
- Improve the UI/UX based on feedback
- Optimize performance or add error handling

## **Example Session Starters**

### **Phase 1 Implementation**
```
"Let's start implementing Phase 1 - add document classification fields to the backend schema and update the file upload form"

"Add role-based permissions so different staff can only see relevant documents"

"Implement basic audit logging for document access tracking"
```

### **UI/UX Development**
```
"Create a compliance dashboard - show me a mockup first, then we'll implement it"

"Enhance the file manager with category filters and metadata display"

"Add a search interface with healthcare-specific filters"
```

### **Backend Features**
```
"Implement document workflow management with approval processes"

"Add OCR integration for processing scanned documents"

"Create automated policy review reminders and notifications"
```

### **AI/Assistant Features**
```
"Implement the regulatory assistant training - help me fine-tune responses for assisted living compliance"

"Add specialized search tools for healthcare compliance queries"

"Create incident response guidance prompts for emergency situations"
```

## **Session Management Tips**

### **Start Small and Build Up**
- Begin with foundational features before complex integrations
- Test each feature thoroughly before moving to the next
- Get user feedback early and often

### **Maintain Momentum**
- Keep sessions focused on single features or related components
- Document decisions and changes as you go
- Regular commits to track progress

### **Leverage Claude's Strengths**
- Let Claude analyze the codebase to understand existing patterns
- Ask for architectural advice before implementing large features
- Use Claude's knowledge of healthcare compliance requirements

### **Communication Style**
- Be direct about what you want to accomplish
- Provide context when deviating from the roadmap
- Ask questions if you're unsure about implementation approaches

## **Progress Tracking**

### **Use the Roadmap Document**
Reference `.claude/assisted-living-roadmap.md` to:
- Track which features have been implemented
- Update timelines based on actual progress
- Note any architectural decisions or changes

### **Update Documentation**
- Keep this prompting guide updated with lessons learned
- Document any new patterns or conventions established
- Share successful prompting strategies

---

Ready to start implementing? Pick a specific feature from Phase 1 and let's build it together!