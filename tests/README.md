# Daily Voice - Tests

## Structure

```
tests/
├── unit/              # Unit tests for individual modules
├── integration/       # End-to-end workflow tests
└── fixtures/          # Test input data
```

## Running Tests

### All Integration Tests
```bash
node tests/integration/edge-cases.test.js
node tests/integration/expansion-control.test.js
node tests/integration/thread-generation.test.js
```

### Unit Tests
```bash
node tests/unit/thread-optimizer.test.js
node tests/unit/generator.test.js
node tests/unit/storage.test.js
```

### Quick Validation
```bash
node tests/integration/verify-all.test.js
```

## Test Coverage

- **Unit Tests:** Core modules (optimizer, generator, storage)
- **Integration Tests:** Full generation pipeline with real API calls
- **Edge Cases:** Short inputs, long inputs, special chars, code snippets

## Notes

- Integration tests call Claude API (costs tokens)
- Add 2-second delays between tests to avoid rate limits
- Fixtures in `fixtures/` for reusable test inputs
