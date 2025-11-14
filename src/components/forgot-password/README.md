# Forgot Password Components

This folder contains the refactored components for the forgot password functionality, split into smaller, focused components for better maintainability and reusability.

## Components

### `EmailStep.tsx`

- Handles the email input step
- Props: `onSubmit`, `isLoading`, `form`
- Responsible for collecting user's email address

### `OtpStep.tsx`

- Handles both OTP verification and password reset in a single step
- Props: `onSubmit`, `isLoading`, `form`, `email`, `onResend`
- Includes OTP input, new password input, and password confirmation
- Calls a single API that handles both verification and password reset

### `SuccessStep.tsx`

- Displays success message after password reset
- Props: `onBackToLogin`
- Clean success state handling

### `BackButton.tsx`

- Reusable back navigation button
- Props: `onClick`
- Consistent styling across steps

## Types

### `types.ts`

- Contains all Zod schemas and TypeScript types
- Shared across all components
- Ensures type consistency

## Flow

1. **Email Step**: User enters email address
2. **OTP + Password Step**: User enters OTP and new password (single API call)
3. **Success Step**: Password reset confirmation

## Usage

```tsx
import {
  EmailStep,
  OtpStep,
  SuccessStep,
  BackButton,
  forgotPasswordSchema,
  otpAndPasswordResetSchema,
  type ForgotPasswordFormData,
  type OtpAndPasswordResetFormData,
} from "@/components/forgot-password";
```

## Benefits

- **Maintainability**: Each component has a single responsibility
- **Reusability**: Components can be used in other parts of the app
- **Testing**: Easier to unit test individual components
- **Type Safety**: Shared types ensure consistency
- **Clean Architecture**: Clear separation of concerns
- **Simplified Flow**: Single API call for OTP verification and password reset
