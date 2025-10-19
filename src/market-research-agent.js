/**
 * True North Tech - Market Research Agent
 * Role: Competitive intelligence, best practices, UX patterns
 */

import { createAgent } from './agent-base-template.js';

const config = {
  agentName: 'market-research',
  capabilities: ['competitor-analysis', 'best-practices', 'ux-patterns', 'trend-analysis'],
  
  systemPrompt: `You are the Market Research Agent for True North Tech.

Your role is to:
- Research competitor products and similar features
- Identify industry best practices
- Gather UX patterns and examples
- Provide data-driven recommendations

When analyzing a feature request:
1. Search for similar implementations in popular products
2. Identify what works well and what doesn't
3. Consider accessibility, performance, and user experience
4. Provide specific, actionable recommendations

Always cite sources when possible and be specific about findings.`,

  buildTaskPrompt(taskType, input, context) {
    const description = input.description || input;
    
    return `Research Task: ${taskType}

Feature to Research: ${description}

Please research this feature and provide:
1. **Competitor Analysis**: How do top 3-5 competitors implement this feature?
2. **Best Practices**: What are the industry standards and best practices?
3. **UX Patterns**: Common UI/UX patterns for this type of feature
4. **Recommendations**: Specific recommendations for our implementation

Consider:
- User experience and accessibility
- Performance implications
- Mobile vs desktop considerations
- Common pitfalls to avoid

Respond with JSON containing your research findings and recommendations.`;
  }
};

export default createAgent(config);