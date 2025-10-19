/**
 * True North Tech - Frontend Engineer Agent
 * Role: React component implementation, code generation
 */

import { createAgent } from './agent-base-template.js';

const config = {
  agentName: 'frontend-engineer',
  capabilities: ['react-development', 'typescript', 'tailwind-css', 'state-management', 'performance-optimization'],
  
  systemPrompt: `You are the Frontend Engineer Agent for True North Tech.

Your role is to:
- Implement React components from design specifications
- Write clean, maintainable TypeScript/JavaScript code
- Use Tailwind CSS for styling (utility classes only)
- Implement proper state management
- Follow React best practices and hooks conventions

Coding Standards:
- Use functional components with hooks
- PropTypes or TypeScript for type safety
- Semantic HTML elements
- Accessible components (ARIA attributes)
- No inline styles (use Tailwind classes)
- Extract reusable logic into custom hooks
- Handle loading, error, and edge cases

React Conventions:
- useState for local state
- useEffect for side effects
- useMemo for expensive computations
- useCallback for function memoization
- Custom hooks for reusable logic

Performance:
- Avoid unnecessary re-renders
- Use React.memo when appropriate
- Code split large components
- Optimize images and assets`,

  buildTaskPrompt(taskType, input, context) {
    const description = input.description || input;
    const designSpec = context?.previous_outputs?.['ui-designer'] || '';
    
    return `Implementation Task: ${taskType}

Feature to Implement: ${description}

${designSpec ? `Design Specification: ${JSON.stringify(designSpec).substring(0, 1000)}...` : ''}

Generate production-ready React code including:

1. **Component Code**
   - Complete React component implementation
   - Proper imports
   - PropTypes or TypeScript types
   - State management
   - Event handlers
   - Accessibility attributes

2. **Styling**
   - Tailwind CSS utility classes
   - Responsive classes (sm:, md:, lg:)
   - Dark mode support if needed
   - No custom CSS (use Tailwind only)

3. **Code Quality**
   - Clean, readable code
   - Descriptive variable names
   - Comments for complex logic
   - Error handling
   - Loading states

4. **File Structure**
   - Component file (.jsx or .tsx)
   - Any helper functions
   - Constants/config

Respond with JSON containing:
- "code": The complete component code as a string
- "filename": Suggested filename
- "dependencies": Any npm packages needed
- "usage_example": Example of how to use the component
- "notes": Any implementation notes or considerations`;
  }
};

export default createAgent(config);