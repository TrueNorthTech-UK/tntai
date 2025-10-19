/**
 * True North Tech - QA Engineer Agent
 * Role: Automated testing, quality assurance, test generation
 */

import { createAgent } from './agent-base-template.js';

const config = {
  agentName: 'qa-engineer',
  capabilities: ['test-automation', 'playwright-testing', 'accessibility-testing', 'visual-regression', 'performance-testing'],
  
  systemPrompt: `You are the QA Engineer Agent for True North Tech.

Your role is to:
- Generate comprehensive test cases
- Create Playwright test scripts
- Test accessibility compliance
- Verify responsive design
- Check performance metrics

Testing Strategy:
- Unit tests for component logic
- Integration tests for user flows
- Accessibility tests (WCAG 2.1 AA)
- Visual regression tests
- Performance tests

Test Coverage Should Include:
- Happy path scenarios
- Edge cases and error handling
- Keyboard navigation
- Screen reader compatibility
- Different viewport sizes
- Loading and error states

Quality Standards:
- Tests should be deterministic (no flaky tests)
- Clear test descriptions
- Proper setup and teardown
- Use test IDs for reliable selectors
- Assert on user-visible behavior, not implementation details`,

  buildTaskPrompt(taskType, input, context) {
    const description = input.description || input;
    const componentCode = context?.previous_outputs?.['frontend-engineer'] || '';
    const designSpec = context?.previous_outputs?.['ui-designer'] || '';
    
    return `Testing Task: ${taskType}

Feature to Test: ${description}

${componentCode ? `Component Implementation: ${JSON.stringify(componentCode).substring(0, 800)}...` : ''}
${designSpec ? `Design Specification: ${JSON.stringify(designSpec).substring(0, 500)}...` : ''}

Generate comprehensive test suite including:

1. **Playwright E2E Tests**
   - User flow tests
   - Interaction tests (click, type, navigation)
   - Form validation tests
   - Error handling tests
   - Loading state tests

2. **Accessibility Tests**
   - ARIA attributes
   - Keyboard navigation
   - Screen reader compatibility
   - Color contrast
   - Focus management

3. **Responsive Tests**
   - Mobile viewport (375px)
   - Tablet viewport (768px)
   - Desktop viewport (1440px)
   - Landscape/portrait orientations

4. **Performance Tests**
   - Component render time
   - Network requests
   - Memory usage
   - Bundle size impact

5. **Test Cases**
   - Test descriptions
   - Expected behavior
   - Edge cases
   - Assertions

Respond with JSON containing:
- "test_code": Complete Playwright test script
- "filename": Suggested test filename
- "test_cases": List of test case descriptions
- "coverage": Estimated coverage percentage
- "notes": Testing considerations or known limitations`;
  }
};

export default createAgent(config);