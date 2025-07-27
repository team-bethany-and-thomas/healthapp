# DaisyUI Theme Implementation Guide

## App Router (Current Setup)

Your project uses Next.js App Router. The theme is implemented in `app/layout.tsx`:

```tsx
export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" data-theme="healthapp">  {/* ← THEME ATTRIBUTE HERE */}
      <body>
        {children}
      </body>
    </html>
  )
}
```

## Pages Router (Alternative)

If using Next.js Pages Router, implement the theme in `pages/_app.tsx`:

```tsx
import type { AppProps } from 'next/app'

export default function MyApp({ Component, pageProps }: AppProps) {
  return (
    <div data-theme="healthapp">  {/* ← THEME ATTRIBUTE HERE */}
      <Component {...pageProps} />
    </div>
  )
}
```

## Key Differences

- **App Router**: `data-theme` goes on the `<html>` element in `layout.tsx`
- **Pages Router**: `data-theme` goes on a `<div>` wrapper in `_app.tsx`

## Current Theme Configuration

Your theme is defined in `tailwind.config.js`:

```js
daisyui: {
  themes: [
    {
      "healthapp": {
        "primary": "oklch(60% 0.15 180)", // TEAL
        "primary-content": "oklch(95% 0.02 180)",
        "secondary": "oklch(58% 0.25 280)", // PURPLE
        "secondary-content": "oklch(95% 0.02 280)",
        "accent": "oklch(70% 0.25 45)", // ORANGE
        "accent-content": "oklch(95% 0.02 45)",
        "base-100": "oklch(100% 0 0)",
        "base-content": "oklch(21% 0.006 285.885)",
      }
    }
  ],
}
```

## Troubleshooting

If the theme isn't working:

1. **Restart the development server**: `npm run dev`
2. **Clear browser cache**: Hard refresh (Ctrl+F5 / Cmd+Shift+R)
3. **Check browser console** for any CSS errors
4. **Verify theme name matches**: `data-theme="healthapp"` must match the theme name in config 