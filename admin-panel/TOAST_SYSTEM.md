# Toast Notification System

## Overview

All popup messages in the admin panel now use a centralized toast notification system instead of native `alert()`, `confirm()`, or `prompt()` dialogs. Custom modal dialogs are used for operations requiring user confirmation or input.

## Components & Files

### Core System
- **`lib/toast.tsx`** - Context and hooks for managing toasts
- **`components/ToastContainer.tsx`** - UI component that renders toast notifications
- **`components/Providers.tsx`** - Wraps the app with necessary providers

### Modals & Dialogs
- **`components/SidebarNav.tsx`** - Contains logout confirmation modal
- **`components/AdminHeader.tsx`** - Contains logout confirmation modal
- **`app/products/ProductForm.tsx`** - Contains custom size input modal

### Integration
- **`app/layout.tsx`** - Root layout that includes the Providers

## Usage

### Toast Notifications (Simple Messages)

In any client component, import and use the toast hook for notifications:

```tsx
import { useToast } from "@/lib/toast";

export default function MyComponent() {
  const { showToast } = useToast();

  const handleClick = () => {
    showToast("Success!", "success");
  };

  return <button onClick={handleClick}>Show Toast</button>;
}
```

### Confirmation Modals

For operations requiring user confirmation (logout, delete, etc.), use a custom modal with state:

```tsx
import { useState } from "react";

export function LogoutButton({ onConfirm }: { onConfirm: () => void }) {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <button onClick={() => setShowModal(true)}>Logout</button>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white border border-[#E5E5E5] rounded-md shadow-lg max-w-sm w-full p-8">
            <h3 className="font-display text-lg font-bold text-[#0A0A0A] mb-3 uppercase">
              LOG OUT
            </h3>
            <p className="text-sm text-[#666666] mb-8 font-body">
              Are you sure you want to log out?
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowModal(false)}
                className="border border-[#E5E5E5] hover:border-[#0A0A0A] bg-white text-[#0A0A0A] px-6 py-2.5 font-label text-xs tracking-wider uppercase transition-colors rounded-none font-semibold"
              >
                CANCEL
              </button>
              <button
                onClick={() => {
                  setShowModal(false);
                  onConfirm();
                }}
                className="bg-red-500 hover:bg-red-600 text-white px-6 py-2.5 font-label text-xs tracking-wider uppercase font-bold transition-all rounded-none"
              >
                LOG OUT
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
```

### Input Modals

For operations requiring user input (custom sizes, etc.), use a form modal:

```tsx
import { useState } from "react";
import { useToast } from "@/lib/toast";

export function CustomSizeInput() {
  const { showToast } = useToast();
  const [showModal, setShowModal] = useState(false);
  const [input, setInput] = useState("");

  const handleSubmit = () => {
    if (!input.trim()) {
      showToast("Please enter a value", "error");
      return;
    }
    
    // Process input...
    showToast(`Added: ${input}`, "success");
    setShowModal(false);
    setInput("");
  };

  return (
    <>
      <button onClick={() => setShowModal(true)}>Add Custom Size</button>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white border border-[#E5E5E5] rounded-md shadow-lg max-w-sm w-full p-8">
            <h3 className="font-display text-lg font-bold text-[#0A0A0A] mb-4 uppercase">
              ADD CUSTOM SIZE
            </h3>
            <input
              autoFocus
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSubmit();
              }}
              placeholder="Enter size (e.g. 42.5, M, OS)..."
              className="w-full border border-[#E5E5E5] focus:border-[#0A0A0A] px-4 py-3 text-sm rounded-none focus:outline-none mb-6 font-mono"
            />
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowModal(false)}
                className="border border-[#E5E5E5] hover:border-[#0A0A0A] bg-white text-[#0A0A0A] px-6 py-2.5 font-label text-xs tracking-wider uppercase transition-colors rounded-none font-semibold"
              >
                CANCEL
              </button>
              <button
                onClick={handleSubmit}
                className="bg-[#0A0A0A] hover:bg-[#222222] text-white px-6 py-2.5 font-label text-xs tracking-wider uppercase font-bold transition-all rounded-none"
              >
                ADD
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
```

### Toast Types

```typescript
type ToastType = "success" | "error" | "info" | "warning";
```

### API

```typescript
showToast(message: string, type?: ToastType, duration?: number)
```

**Parameters:**
- `message` (required): The text to display in the toast
- `type` (optional): One of `"success"`, `"error"`, `"info"`, `"warning"` (default: `"info"`)
- `duration` (optional): How long to show the toast in milliseconds (default: `3000`). Set to `0` for persistent toasts

### Examples

```tsx
const { showToast } = useToast();

// Success notification (auto-dismisses after 3 seconds)
showToast("Product created successfully.", "success");

// Error notification
showToast("Failed to update stock.", "error");

// Warning notification
showToast("Size already exists.", "warning");

// Info notification
showToast("Creating a new drop...", "info");

// Persistent notification (requires manual close)
showToast("Important announcement", "info", 0);
```

## Styling

Toasts use Tailwind CSS classes:
- **Success**: Green background (`bg-green-500`)
- **Error**: Red background (`bg-red-500`)
- **Warning**: Yellow background (`bg-yellow-500`)
- **Info**: Blue background (`bg-blue-500`)

All toasts appear in the bottom-right corner of the screen with smooth animations.

## Replaced Components

### Toast Replacements (alert calls)

The following components have been updated to use the toast notification system:

1. **SidebarNav.tsx** - "Creating a new drop..." notification
2. **ProductForm.tsx** - Size validation messages
3. **InquiriesClient.tsx** - Status update notifications
4. **ProductsClient.tsx** - Product deletion confirmations
5. **InventoryClient.tsx** - Stock update notifications

### Modal Replacements (confirm & prompt calls)

The following dialogs have been replaced with custom modals:

1. **SidebarNav.tsx** - Logout confirmation modal
2. **AdminHeader.tsx** - Logout confirmation modal (in profile dropdown)
3. **ProductForm.tsx** - Custom size input modal (replaces `prompt()`)

## Migration from alert()

If you find any remaining `alert()` calls in the admin panel, replace them with:

```tsx
// Before
alert("Something happened");

// After
const { showToast } = useToast();
showToast("Something happened", "info");
```

For error cases, use `"error"`:
```tsx
// Before
alert("Failed to save");

// After
showToast("Failed to save", "error");
```

## Important Notes

- The `useToast()` hook can only be used in client components (add `"use client"` at the top)
- Toasts are automatically dismissed after their duration expires
- Multiple toasts can be displayed at the same time (they stack vertically)
- Each toast has a close button (✕) for manual dismissal
