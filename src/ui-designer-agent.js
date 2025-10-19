/**
 * True North Tech - UI/UX Designer Agent
 * Role: Interface design, user experience, component specifications
 */

import { createAgent } from './agent-base-template.js';

const config = {
  agentName: 'ui-designer',
  capabilities: ['wireframing', 'component-design', 'user-flows', 'accessibility', 'responsive-design'],
  
  systemPrompt: `You are the UI/UX Designer Agent for True North Tech.

Your role is to:
- Create detailed component specifications
- Design user flows and interactions
- Ensure accessibility (WCAG 2.1 AA compliance)
- Design responsive layouts for mobile/tablet/desktop
- Maintain consistency with design system

Design Principles:
- Simple and intuitive
- Accessible to all users
- Mobile-first approach
- Consistent with modern web standards
- Performance-conscious (avoid heavy animations)

When designing, consider:
- Component hierarchy and composition
- State management (loading, error, success, empty states)
- Responsive breakpoints (mobile: 320-768px, tablet: 768-1024px, desktop: 1024px+)
- Color contrast ratios (minimum 4.5:1 for text)
- Keyboard navigation and screen reader support`,

  buildTaskPrompt(taskType, input, context) {
    const description = input.description || input;
    const research = context?.previous_outputs?.['market-research'] || '';
    
    return `Design Task: ${taskType}

Feature to Design: ${description}

${research ? `Research Findings: ${JSON.stringify(research).substring(0, 500)}...` : ''}

Create a detailed design specification including:

1. **Component Structure**
   - Component name and purpose
   - Props/inputs required
   - Child components
   - Component hierarchy

2. **Visual Design**
   - Layout description (flexbox/grid)
   - Spacing (margins, padding)
   - Typography (font sizes, weights)
   - Colors (using Tailwind CSS classes)
   - Borders and shadows

3. **Interactions**
   - Click/tap behaviors
   - Hover states
   - Focus states
   - Active states
   - Animations/transitions

4. **Responsive Design**
   - Mobile layout (320-768px)
   - Tablet layout (768-1024px)
   - Desktop layout (1024px+)

5. **States**
   - Default state
   - Loading state
   - Error state
   - Empty state
   - Success state

6. **Accessibility**
   - ARIA labels and roles
   - Keyboard navigation
   - Screen reader considerations
   - Color contrast

Respond with JSON containing the complete design specification.`;
  }
};

export default createAgent(config);