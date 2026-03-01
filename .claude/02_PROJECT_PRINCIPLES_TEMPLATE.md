# Project-Specific Principles

**Purpose:** This document extends Universal Principles with project-specific guidelines. Copy this template and customize for each project. These principles define HOW you build this specific system.

---

## Project Identity

**Project Name:** [Name]  
**Type:** [Tool / Infrastructure / Hybrid]  
**Primary Domain:** [Web App / API / Data Pipeline / Agent System / etc.]  

---

## 1. ARCHITECTURAL DECISIONS

### 1.1 System Boundaries

Define the major components and their responsibilities:

| Component | Responsibility | Owns Data? |
|-----------|---------------|------------|
| [Component A] | [Single responsibility] | [Yes/No] |
| [Component B] | [Single responsibility] | [Yes/No] |

### 1.2 Data Flow

Describe how data moves through the system:

```
[Input Source] → [Processing Layer] → [Storage] → [Output/Interface]
```

### 1.3 External Dependencies

List third-party services/libraries and why they're chosen:

| Dependency | Purpose | Replaceable? |
|------------|---------|--------------|
| [Library X] | [What it does] | [Yes/No] |

**Remember:** Architecture is portable, tools are not. Document *why* you chose each tool so future you (or an agent) can evaluate alternatives.

---

## 2. TECHNOLOGY STACK PRINCIPLES

### 2.1 Language/Framework

- **Primary Language:** [Language]
- **Framework:** [Framework, if any]
- **Rationale:** [Why this choice]

### 2.2 Project-Specific Conventions

Beyond Universal Principles, this project follows:

- **File naming:** [convention]
- **Directory structure:** [description or reference]
- **Import ordering:** [convention]
- **Configuration management:** [approach]

### 2.3 Dependency Management

- **Package manager:** [npm/pip/cargo/etc.]
- **Version pinning policy:** [exact/range/latest]
- **Update cadence:** [how often dependencies are reviewed]

---

## 3. DOMAIN-SPECIFIC RULES

### 3.1 Business Logic Constraints

Document invariants that must never be violated:

- [ ] [Constraint 1: e.g., "User balance can never go negative"]
- [ ] [Constraint 2: e.g., "All timestamps must be UTC"]
- [ ] [Constraint 3]

### 3.2 Data Validation

- **Input validation:** [Where and how]
- **Output sanitization:** [Requirements]
- **Schema enforcement:** [Approach]

### 3.3 Security Principles

- **Authentication:** [Approach]
- **Authorization:** [Model - RBAC/ABAC/etc.]
- **Sensitive data handling:** [Encryption, masking, etc.]

---

## 4. TESTING STRATEGY

### 4.1 Test Pyramid for This Project

```
        /\
       /  \     E2E Tests (few, critical paths)
      /----\
     /      \   Integration Tests (component boundaries)
    /--------\
   /          \  Unit Tests (comprehensive)
  /------------\
```

### 4.2 What Must Be Tested

- [ ] All public API endpoints
- [ ] All business logic functions
- [ ] Error handling paths
- [ ] Boundary conditions
- [ ] [Project-specific requirements]

### 4.3 What May Skip Tests (justify each)

- Generated code
- Simple getters/setters (if truly trivial)
- [Other justified exceptions]

### 4.4 Test Data Strategy

- **Fixtures:** [How managed]
- **Factories:** [If used]
- **Mocking approach:** [When and how]

---

## 5. ERROR HANDLING STRATEGY

### 5.1 Error Categories

| Category | Handling | Example |
|----------|----------|---------|
| User Error | Return helpful message | Invalid input |
| System Error | Log + generic message | Database down |
| Programming Error | Fail fast + detailed log | Null dereference |

### 5.2 Logging Principles

- **Log levels:** [DEBUG/INFO/WARN/ERROR usage]
- **Structured logging:** [Yes/No, format]
- **Sensitive data:** [Never log these fields]
- **Correlation IDs:** [If used]

### 5.3 Recovery Strategies

- **Retry policy:** [Exponential backoff, max attempts]
- **Circuit breaker:** [If used, thresholds]
- **Graceful degradation:** [Fallback behaviors]

---

## 6. PERFORMANCE PRINCIPLES

### 6.1 Response Time Budgets

| Operation Type | Target | Max Acceptable |
|---------------|--------|----------------|
| API Response | [50ms] | [200ms] |
| Page Load | [1s] | [3s] |
| Background Job | [varies] | [varies] |

### 6.2 Resource Constraints

- **Memory limits:** [Per process/container]
- **Connection pools:** [Sizes and rationale]
- **Rate limits:** [If applicable]

### 6.3 Caching Strategy

- **What to cache:** [List]
- **Cache invalidation:** [Strategy]
- **TTLs:** [By data type]

---

## 7. DEPLOYMENT & OPERATIONS

### 7.1 Environment Principles

- **Dev/Staging/Prod parity:** [Approach]
- **Configuration management:** [12-factor compliant?]
- **Secrets management:** [Approach]

### 7.2 Monitoring & Observability

- **Metrics:** [What to track]
- **Alerts:** [Conditions]
- **Dashboards:** [Key views]

### 7.3 Incident Response

- **Runbooks location:** [Path/URL]
- **Escalation path:** [Who to contact]
- **Rollback procedure:** [Steps]

---

## 8. AGENT MAINTAINABILITY

> "If the agent builds it, the agent can maintain it." — Nate's Third Principle

### 8.1 Documentation Requirements

For AI agents (including Claude-Code) to maintain this system:

- [ ] README with setup instructions
- [ ] Architecture diagram (text-based, in repo)
- [ ] API documentation (OpenAPI/Swagger preferred)
- [ ] Decision log (why major choices were made)

### 8.2 Conversation Context

When building with AI, preserve:

- [ ] Initial requirements discussion
- [ ] Design decision conversations
- [ ] Troubleshooting sessions
- [ ] Configuration choices and rationale

### 8.3 Self-Healing Capabilities

Design for automated recovery:

- [ ] Health checks at all boundaries
- [ ] Automatic restart policies
- [ ] State recovery procedures
- [ ] Data consistency verification

---

## 9. PROJECT-SPECIFIC CODE SMELLS

Beyond universal smells, watch for:

- [ ] [Domain-specific anti-pattern 1]
- [ ] [Domain-specific anti-pattern 2]
- [ ] [Common mistake in this codebase]

---

## 10. DEFINITION OF DONE

A feature is complete when:

- [ ] Code follows Universal Principles
- [ ] Code follows these Project Principles
- [ ] Tests written and passing
- [ ] Documentation updated
- [ ] Code reviewed (if team)
- [ ] Deployed to staging and verified
- [ ] [Project-specific requirements]

---

## Usage Notes

1. **Copy this template** for each new project
2. **Fill in all sections** before major development begins
3. **Update as you learn** — principles should evolve
4. **Reference in PR reviews** — "Does this follow our principles?"
5. **Share with AI agents** — include this in context when debugging or extending

---

## Quick Reference: Nate's Four Principles

1. **Architecture is portable, tools are not.** Learn patterns, not just tools.
2. **Principles-based guidance scales better than rules.** Give room for judgment.
3. **If the agent builds it, the agent can maintain it.** Preserve context.
4. **Your system can be infrastructure, not just a tool.** Design for extensibility.

---

*Last Updated: [Date]*  
*Maintainer: [Name/Agent]*
