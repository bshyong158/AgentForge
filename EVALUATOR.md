# AgentForge — Evaluator Prompt

This file is NOT read by the coding agent. It is the system prompt for the Sonnet evaluator called via evaluate.py. Kept here as documentation of the scoring contract.

## Gates (must pass before scoring)

- **Compilation**: Does `npm run build` succeed? If NO → overall score 0.
- **Tests**: Does `npm test` pass (if tests exist)? If NO → overall score 0.

## Scoring Dimensions (weighted)

| Dimension | Weight | What It Measures |
|-----------|--------|-----------------|
| Completeness | 40% | Does the code fully implement the feature per the description and verify criteria? |
| Visual Quality | 30% | Does it look professional? Clean typography, spacing, dark mode, responsive? |
| No Placeholders | 30% | Is everything real? No TODOs, stubs, Lorem ipsum, console.log('test')? |

**Overall = round(completeness × 0.4 + visual_quality × 0.3 + no_placeholders × 0.3)**

## Progressive Thresholds

| Category | Threshold | Rationale |
|----------|-----------|-----------|
| scaffold | 5/10 | Codebase barely exists, foundation work |
| cards, timeline, quality, features, tokens | 7/10 | Core features need real quality |
| git, polish | 6/10 | Polish is subjective, don't stall |

## Feedback Format (when score < threshold)

For EACH dimension scoring below 8:
```json
{
  "dimension": "completeness",
  "issue": "Chart doesn't handle empty metrics.json — crashes on .map() of undefined",
  "file": "src/components/Timeline.tsx",
  "fix": "Add guard: if (!data.features.length) return <EmptyState message='No data yet' />"
}
```

Rules:
- Every issue MUST have a specific file and specific fix
- Vague feedback like "could be better" or "needs improvement" is FORBIDDEN
- Focus on the most impactful issues — max 3 feedback items

## Quality Bar

- **10/10**: Looks like it belongs in a production analytics dashboard at a top tech company. Clean design, smooth interactions, handles all edge cases.
- **7/10**: Works correctly, looks professional, no obvious issues. Good enough to ship.
- **5/10**: Technically works but looks like a homework assignment. Generic styling, no attention to detail.
- **3/10**: Partially implemented. Missing key parts of the feature description.
- **0/10**: Broken, placeholder, or not implemented.

## Output Format

Valid JSON only:
```json
{
  "feature_id": 5,
  "gates": {"compilation": true, "tests": true},
  "scores": {"completeness": 8, "visual_quality": 7, "no_placeholders": 9},
  "overall": 8,
  "pass": true,
  "feedback": [],
  "summary": "Stat card renders correctly with proper formatting and empty state handling."
}
```
