# Claude Code Configuration - SPARC Development Environment

## 🚨 CRITICAL: CONCURRENT EXECUTION

**ABSOLUTE RULE**: ALL operations MUST be concurrent in a single message:
- **TodoWrite**: Batch ALL todos in ONE call (5-10+ minimum)
- **Task tool**: Spawn ALL agents in ONE message
- **File operations**: Batch ALL reads/writes/edits
- **Bash commands**: Batch ALL terminal operations
- **Memory operations**: Batch ALL memory operations

### ⚡ GOLDEN RULE: "1 MESSAGE = ALL RELATED OPERATIONS"

## Project Overview
This project uses SPARC (Specification, Pseudocode, Architecture, Refinement, Completion) methodology with Claude-Flow orchestration and Batchtools optimization.

## Core Commands

### SPARC Commands
- `npx claude-flow sparc modes` - List SPARC modes
- `npx claude-flow sparc run <mode> "<task>"` - Execute specific mode
- `npx claude-flow sparc tdd "<feature>"` - Run complete TDD workflow
- `npx claude-flow sparc batch <modes> "<task>"` - Execute multiple modes in parallel

### Build Commands
- `npm run build` - Build project
- `npm run test` - Run tests
- `npm run lint` - Run linter
- `npm run typecheck` - Run TypeScript checking

## 🎯 Key Principles

### Claude Code is the ONLY Executor
**Claude Code handles ALL:**
- File operations (Read, Write, Edit, MultiEdit, Glob, Grep)
- Code generation and implementation
- Bash commands and system operations
- TodoWrite and task management
- Git operations
- Testing and debugging

**MCP Tools ONLY handle:**
- Coordination and planning
- Memory management
- Performance tracking
- Swarm orchestration

### Batch Everything
```javascript
// ✅ CORRECT: Single message with multiple operations
[Single Message]:
  - TodoWrite { todos: [10+ todos] }
  - Task("Agent 1", "instructions", "type")
  - Task("Agent 2", "instructions", "type") 
  - Read("file1.js")
  - Write("output.js", content)
  - Bash("npm install")
```

## 🐝 Swarm Orchestration

### Quick Setup
```bash
# Add Claude Flow MCP server
claude mcp add claude-flow npx claude-flow@alpha mcp start
```

### Essential MCP Tools
- `mcp__claude-flow__swarm_init` - Setup coordination topology
- `mcp__claude-flow__agent_spawn` - Create cognitive patterns
- `mcp__claude-flow__task_orchestrate` - Coordinate complex tasks
- `mcp__claude-flow__memory_usage` - Persistent memory
- `mcp__claude-flow__github_swarm` - GitHub management

### Agent Coordination Protocol
Every spawned agent MUST:
1. **START**: Run `npx claude-flow@alpha hooks pre-task --description "[task]"`
2. **DURING**: After file operations, run `npx claude-flow@alpha hooks post-edit --file "[file]"`
3. **END**: Run `npx claude-flow@alpha hooks post-task --task-id "[task]"`

## Available Agents (54 Total)

### Core Categories
- **Development**: coder, reviewer, tester, planner, researcher
- **Coordination**: hierarchical-coordinator, mesh-coordinator, adaptive-coordinator
- **Distributed**: byzantine-coordinator, raft-manager, gossip-coordinator
- **Performance**: perf-analyzer, performance-benchmarker, task-orchestrator
- **GitHub**: pr-manager, code-review-swarm, issue-tracker, release-manager
- **SPARC**: sparc-coord, specification, pseudocode, architecture, refinement
- **Specialized**: backend-dev, mobile-dev, ml-developer, api-docs, system-architect

### Agent Selection Strategy
- **Simple tasks**: 3-4 agents
- **Medium tasks**: 5-7 agents  
- **Complex tasks**: 8-12 agents
- Always include 1 coordinator

## 📊 Performance & Best Practices

### Performance Improvements
- File Operations: 300% faster with parallel processing
- Code Analysis: 250% improvement
- Test Generation: 400% faster
- Documentation: 200% improvement

### Development Principles
- Modular design (<500 lines per file)
- Environment safety (no hardcoded secrets)
- Test-first approach
- Clean architecture
- Parallel documentation

### Important Notes
- Run tests before committing (`npm run test --parallel`)
- Use SPARC memory system for context
- Follow Red-Green-Refactor cycle
- Regular security reviews
- Monitor resources during parallel operations

## Support
- Documentation: https://github.com/ruvnet/claude-flow
- SPARC Guide: https://github.com/ruvnet/claude-code-flow/docs/sparc.md
- Batchtools: https://github.com/ruvnet/claude-code-flow/docs/batchtools.md

---

**Remember**: Claude Flow coordinates, Claude Code creates!