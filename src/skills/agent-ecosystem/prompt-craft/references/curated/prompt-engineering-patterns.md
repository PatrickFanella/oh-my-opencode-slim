# Prompt Engineering Patterns

Curated from a previously merged skill. This file keeps the useful task guidance without preserving the old skill as an active nested skill.

## Extracted Resources

- `assets/prompt-engineering-patterns/`
- `scripts/prompt-engineering-patterns/`

## Guidance

### From `prompt-engineering-patterns-skill.md`

_Source topic: prompt-engineering-patterns_

**Purpose:** Master advanced prompt engineering techniques to maximize LLM performance, reliability, and controllability in production. Use when optimizing prompts, improving LLM outputs, or designing production prompt templates.

# Prompt Engineering Patterns

Master advanced prompt engineering techniques to maximize LLM performance, reliability, and controllability.

## When to Use This Skill

- Designing complex prompts for production LLM applications
- Optimizing prompt performance and consistency
- Implementing structured reasoning patterns (chain-of-thought, tree-of-thought)
- Building few-shot learning systems with dynamic example selection
- Creating reusable prompt templates with variable interpolation
- Debugging and refining prompts that produce inconsistent outputs
- Implementing system prompts for specialized AI assistants
- Using structured outputs (JSON mode) for reliable parsing

## Core Capabilities

### 1. Few-Shot Learning

- Example selection strategies (semantic similarity, diversity sampling)
- Balancing example count with context window constraints
- Constructing effective demonstrations with input-output pairs
- Dynamic example retrieval from knowledge bases
- Handling edge cases through strategic example selection

### 2. Chain-of-Thought Prompting

- Step-by-step reasoning elicitation
- Zero-shot CoT with "Let's think step by step"
- Few-shot CoT with reasoning traces
- Self-consistency techniques (sampling multiple reasoning paths)
- Verification and validation steps

### 3. Structured Outputs

- JSON mode for reliable parsing
...

# Define structured output schema
class SQLQuery(BaseModel):
    query: str = Field(description="The SQL query")
    explanation: str = Field(description="Brief explanation of what the query does")
    tables_used: list[str] = Field(description="List of tables referenced")

# Initialize model with structured output
llm = ChatAnthropic(model="claude-sonnet-4-6")
structured_llm = llm.with_structured_output(SQLQuery)

# Create prompt template
prompt = ChatPromptTemplate.from_messages([
    ("system", """You are an expert SQL developer. Generate efficient, secure SQL queries.
    Always use parameterized queries to prevent SQL injection.
    Explain your reasoning briefly."""),
    ("user", "Convert this to SQL: {query}")
])

# Use
result = await chain.ainvoke({
    "query": "Find all users who registered in the last 30 days"
})
print(result.query)
print(result.explanation)
```

## Key Patterns

### Pattern 1: Structured Output with Pydantic

```python

    """Analyze sentiment with structured output."""

```

### Pattern 2: Chain-of-Thought with Self-Verification

```python

1. Break down the problem into clear steps
2. Work through each step showing your reasoning
3. State your final answer
4. Verify your answer by checking it against the original problem

## Steps

## Answer

## Verification

### From `prompt-template-library.md`

_Source topic: prompt-template-library_

# Prompt Template Library

## Classification Templates

### Sentiment Analysis

```
Classify the sentiment of the following text as Positive, Negative, or Neutral.

Text: {text}

Sentiment:
```

### Intent Detection

```
Determine the user's intent from the following message.

Possible intents: {intent_list}

Message: {message}

Intent:
```

### Topic Classification

```
Classify the following article into one of these categories: {categories}

Article:
{article}

Category:
```

## Extraction Templates
...


### From `chain-of-thought.md`

_Source topic: chain-of-thought_

# Example
query = "If a train travels 60 mph for 2.5 hours, how far does it go?"
prompt = zero_shot_cot(query)

# Model output:

# Chain-of-Thought Prompting
## Overview
Chain-of-Thought (CoT) prompting elicits step-by-step reasoning from LLMs, dramatically improving performance on complex reasoning, math, and logic tasks.
## Core Techniques
### Zero-Shot CoT
Add a simple trigger phrase to elicit reasoning:
```python
def zero_shot_cot(query):
    return f"""{query}
Let's think step by step:"""
# Example
query = "If a train travels 60 mph for 2.5 hours, how far does it go?"
prompt = zero_shot_cot(query)
# Model output:
# "Let's think step by step:
# 1. Speed = 60 miles per hour
# 2. Time = 2.5 hours
# 3. Distance = Speed × Time
# 4. Distance = 60 × 2.5 = 150 miles
# Answer: 150 miles"
```
### Few-Shot CoT
Provide examples with explicit reasoning chains:
```python
few_shot_examples = """
Q: Roger has 5 tennis balls. He buys 2 more cans of tennis balls. Each can has 3 balls. How many tennis balls does he have now?
A: Let's think step by step:
1. Roger starts with 5 balls
2. He buys 2 cans, each with 3 balls
3. Balls from cans: 2 × 3 = 6 balls
4. Total: 5 + 6 = 11 balls
Answer: 11
Q: The cafeteria had 23 apples. If they used 20 to make lunch and bought 6 more, how many do they have?
A: Let's think step by step:
1. Started with 23 apples
2. Used 20 for lunch: 23 - 20 = 3 apples left
3. Bought 6 more: 3 + 6 = 9 apples
Answer: 9
Q: {user_query}
A: Let's think step by step:"""
```
### Self-Consistency
Generate multiple reasoning paths and take the majority vote:
```python
import openai
from collections import Counter
def self_consistency_cot(query, n=5, temperature=0.7):
    prompt = f"{query}\n\nLet's think step by step:"
    responses = []
    for _ in range(n):
        response = openai.ChatCompletion.create(
            model="gpt-5.4",
            messages=[{"role": "user", "content": prompt}],
            temperature=temperature
        )

### From `few-shot-learning.md`

_Source topic: few-shot-learning_

# Few-Shot Learning Guide

## Overview

Few-shot learning enables LLMs to perform tasks by providing a small number of examples (typically 1-10) within the prompt. This technique is highly effective for tasks requiring specific formats, styles, or domain knowledge.

## Example Selection Strategies

### 1. Semantic Similarity

```python
from sentence_transformers import SentenceTransformer
import numpy as np

class SemanticExampleSelector:
    def __init__(self, examples, model_name='all-MiniLM-L6-v2'):
        self.model = SentenceTransformer(model_name)
        self.examples = examples
        self.example_embeddings = self.model.encode([ex['input'] for ex in examples])

    def select(self, query, k=3):
        query_embedding = self.model.encode([query])
        similarities = np.dot(self.example_embeddings, query_embedding.T).flatten()
        top_indices = np.argsort(similarities)[-k:][::-1]
        return [self.examples[i] for i in top_indices]
```

### 2. Diversity Sampling

```python
from sklearn.cluster import KMeans

class DiversityExampleSelector:
    def __init__(self, examples, model_name='all-MiniLM-L6-v2'):
        self.model = SentenceTransformer(model_name)
        self.examples = examples
        self.embeddings = self.model.encode([ex['input'] for ex in examples])

    def select(self, k=5):
        # Use k-means to find diverse cluster centers
        kmeans = KMeans(n_clusters=k, random_state=42)
        kmeans.fit(self.embeddings)

        # Select example closest to each cluster center
        diverse_examples = []
        for center in kmeans.cluster_centers_:
            distances = np.linalg.norm(self.embeddings - center, axis=1)
            closest_idx = np.argmin(distances)
...
```

...

# Good: Consistent format
examples = [
    {
        "input": "What is the capital of France?",
        "output": "Paris"
    },
    {
        "input": "What is the capital of Germany?",
        "output": "Berlin"

# Bad: Inconsistent format
examples = [
    "Q: What is the capital of France? A: Paris",
    {"question": "What is the capital of Germany?", "answer": "Berlin"}
]
```

### Input-Output Alignment

Ensure examples demonstrate the exact task you want the model to perform:

```python

# Good: Clear input-output relationship
example = {
    "input": "Sentiment: The movie was terrible and boring.",
    "output": "Negative"
}

# Bad: Ambiguous relationship
example = {
    "input": "The movie was terrible and boring.",
    "output": "This review expresses negative sentiment toward the film."
}
```

### Complexity Balance

### From `prompt-optimization.md`

_Source topic: prompt-optimization_

# Prompt Optimization Guide

## Systematic Refinement Process

### 1. Baseline Establishment

```python
def establish_baseline(prompt, test_cases):
    results = {
        'accuracy': 0,
        'avg_tokens': 0,
        'avg_latency': 0,
        'success_rate': 0
    }

    for test_case in test_cases:
        response = llm.complete(prompt.format(**test_case['input']))

        results['accuracy'] += evaluate_accuracy(response, test_case['expected'])
        results['avg_tokens'] += count_tokens(response)
        results['avg_latency'] += measure_latency(response)
        results['success_rate'] += is_valid_response(response)

    # Average across test cases
    n = len(test_cases)
...
```

### 2. Iterative Refinement Workflow

```
Initial Prompt → Test → Analyze Failures → Refine → Test → Repeat
```

```python
class PromptOptimizer:
    def __init__(self, initial_prompt, test_suite):
        self.prompt = initial_prompt
        self.test_suite = test_suite
        self.history = []

    def optimize(self, max_iterations=10):
        for i in range(max_iterations):
            # Test current prompt
            results = self.evaluate_prompt(self.prompt)
            self.history.append({
                'iteration': i,
                'prompt': self.prompt,
                'results': results
            })

            # Stop if good enough
            if results['accuracy'] > 0.95:
...
```

### 3. A/B Testing Framework
...


### From `prompt-templates.md`

_Source topic: prompt-templates_

# Prompt Template Systems

## Template Architecture

### Basic Template Structure

```python
class PromptTemplate:
    def __init__(self, template_string, variables=None):
        self.template = template_string
        self.variables = variables or []

    def render(self, **kwargs):
        missing = set(self.variables) - set(kwargs.keys())
        if missing:
            raise ValueError(f"Missing required variables: {missing}")

        return self.template.format(**kwargs)

# Usage
template = PromptTemplate(
    template_string="Translate {text} from {source_lang} to {target_lang}",
    variables=['text', 'source_lang', 'target_lang']
)

prompt = template.render(
    text="Hello world",
```

### Conditional Templates

```python
        # Process conditional blocks
        result = self.template

        # Handle if-blocks: {{#if variable}}content{{/if}}

        # Handle for-loops: {{#each items}}{{this}}{{/each}}

        # Finally, render remaining variables

# Usage
template = ConditionalTemplate("""
Analyze the following text:
{text}

{{#if include_sentiment}}
Provide sentiment analysis.
{{/if}}

- {{this}}
```

### Modular Template Composition

```python

    def register_component(self, name, template):
        self.components[name] = template

# Usage
builder = ModularTemplate()

builder.register_component('system', "You are a {role}.")
builder.register_component('context', "Context: {context}")
builder.register_component('instruction', "Task: {task}")
builder.register_component('examples', "Examples:\\n{examples}")
builder.register_component('input', "Input: {input}")
builder.register_component('format', "Output format: {format}")

# Compose different templates for different scenarios
basic_prompt = builder.render(
    ['system', 'instruction', 'input'],
    role='helpful assistant',
    instruction='Summarize the text',
    input='...'
)

```

## Common Template Patterns

### Classification Template

```python

```

### Extraction Template

```python

### From `system-prompts.md`

_Source topic: system-prompts_

# System Prompt Design

## Core Principles

System prompts set the foundation for LLM behavior. They define role, expertise, constraints, and output expectations.

## Effective System Prompt Structure

```
[Role Definition] + [Expertise Areas] + [Behavioral Guidelines] + [Output Format] + [Constraints]
```

### Example: Code Assistant

```
You are an expert software engineer with deep knowledge of Python, JavaScript, and system design.

Your expertise includes:
- Writing clean, maintainable, production-ready code
- Debugging complex issues systematically
- Explaining technical concepts clearly
- Following best practices and design patterns

Guidelines:
- Always explain your reasoning
- Prioritize code readability and maintainability
- Consider edge cases and error handling
- Suggest tests for new code
- Ask clarifying questions when requirements are ambiguous

Output format:
- Provide code in markdown code blocks
- Include inline comments for complex logic
...
```

## Pattern Library
...
