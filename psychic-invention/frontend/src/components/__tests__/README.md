# Pricing Form Validation Tests

## Overview

This directory contains unit tests for the PricingWorkspace component's form validation functionality, implementing task 6.2 from the pricing engine enhancements specification.

## Test Coverage

### Requirements 4.2 Validation

The tests validate the following aspects of the pricing form:

#### Input Validation
- ✅ **Valid numerical inputs**: Tests that valid numbers are accepted and stored correctly
- ✅ **Invalid text inputs**: Tests that non-numeric text is handled gracefully (converted to 0)
- ✅ **Negative values**: Tests that negative numbers are accepted (backend validation will catch business logic issues)
- ✅ **Zero values**: Tests that zero values are accepted for parameters like volatility
- ✅ **Decimal inputs**: Tests that decimal numbers are handled correctly

#### Error Message Display
- ✅ **API error display**: Tests that API errors are shown to users (mocked scenarios)
- ✅ **Loading states**: Tests that loading indicators are displayed during calculations
- ✅ **Form structure**: Tests that error messages appear in the correct locations

#### Form Structure and Accessibility
- ✅ **Required fields**: Tests that all required input fields are rendered
- ✅ **Field labels**: Tests that proper labels are displayed for all inputs
- ✅ **Input attributes**: Tests that inputs have correct type, step, and constraint attributes
- ✅ **Button accessibility**: Tests that form buttons are properly accessible

#### Real-time Validation Behavior
- ✅ **Input field updates**: Tests that form state updates immediately when users type
- ✅ **Tab switching**: Tests that separate state is maintained between Black-Scholes and FFT tabs
- ✅ **Parameter constraints**: Tests that FFT-specific parameters have appropriate bounds

## Test Structure

### Black-Scholes Form Validation
- Input field rendering (S, K, TAU, R, SIGMA)
- Numerical input handling
- Form submission behavior
- Input field attributes and constraints

### FFT Form Validation  
- FFT-specific parameter fields (alpha, delta_v, n)
- Parameter bounds validation
- Grid size selection options
- Derived parameter display (read-only)

### Tab Switching Validation
- Navigation between pricing models
- State isolation between tabs
- UI consistency across tabs

### Form Structure Validation
- Accessibility compliance
- Proper form element structure
- Label associations

## Testing Framework

- **Framework**: Vitest with React Testing Library
- **Mocking**: Vi.js for API hooks and utilities
- **User Interaction**: @testing-library/user-event for realistic user interactions
- **Assertions**: Vitest expect API with jest-dom matchers

## Running Tests

```bash
# Run all tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run with UI
npm run test:ui
```

## Manual Testing

The test file also includes a `testPricingFormValidation()` function that can be called in the browser console for manual validation scenarios.

## Implementation Notes

### Validation Logic
The component uses a simple validation approach:
- `Number(value) || 0` converts invalid inputs to 0
- HTML5 input attributes provide basic constraints
- Backend validation handles business logic validation

### Error Handling
- API errors are displayed with "Error: " prefix
- Loading states show appropriate messages ("Pricing...", "Generating surface...")
- Form prevents default submission and calls API hooks

### Accessibility
- All inputs have proper `type="number"` attributes
- Step values are appropriate for each parameter type
- Labels are clearly associated with inputs
- Form structure follows semantic HTML patterns

## Coverage Summary

| Test Category | Test Count | Coverage |
|---------------|------------|----------|
| Black-Scholes Form | 8 tests | Input validation, attributes, submission |
| FFT Form | 6 tests | FFT parameters, constraints, derived fields |
| Tab Switching | 2 tests | Navigation, state management |
| Form Structure | 3 tests | Accessibility, labels, form elements |
| **Total** | **19 tests** | **Complete Requirements 4.2 coverage** |

## Validation Scenarios Covered

1. **Valid Inputs**: 105.50, 0.25, 0.05, etc.
2. **Invalid Inputs**: "invalid", non-numeric strings
3. **Edge Cases**: Negative values, zero values, very small decimals
4. **Parameter Bounds**: Alpha (0.5-2.0), Delta_v (0.001+), Grid sizes
5. **State Management**: Tab switching, form isolation
6. **Error Display**: API errors, loading states
7. **Accessibility**: Labels, input types, form structure

This comprehensive test suite ensures that the pricing form validation meets all requirements specified in task 6.2 and provides a solid foundation for maintaining form quality as the application evolves.