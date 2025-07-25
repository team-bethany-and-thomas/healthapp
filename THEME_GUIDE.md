# HealthApp Theme Guide

## Overview

This project uses a custom DaisyUI theme with OKLCH color values, integrated with **Tailwind CSS v4.1.11** and **DaisyUI v5.0.46**. The theme is implemented using the modern CSS custom properties approach.

---

## Technology Stack

- **Tailwind CSS**: v4.1.11
- **DaisyUI**: v5.0.46
- **Next.js**: 15.4.1
- **React**: 19.1.0

---

## Theme Colors

| Name                | Class Name             | Color Value (OKLCH)           | Usage Example                |
|---------------------|-----------------------|-------------------------------|------------------------------|
| Primary (TEAL)      | `bg-primary`          | `oklch(60% 0.15 180)`         | Main brand color             |
| Primary Content     | `text-primary-content`| `oklch(95% 0.02 180)`         | Text on primary backgrounds  |
| Secondary (PURPLE)  | `bg-secondary`        | `oklch(58% 0.25 280)`         | Accent/secondary color       |
| Secondary Content   | `text-secondary-content`| `oklch(95% 0.02 280)`       | Text on secondary backgrounds|
| Accent (ORANGE)     | `bg-accent`           | `oklch(70% 0.25 45)`          | Highlight/accent color       |
| Accent Content      | `text-accent-content` | `oklch(95% 0.02 45)`          | Text on accent backgrounds   |
| Base-100            | `bg-base-100`         | `oklch(100% 0 0)`             | Main background (white)      |
| Base-200            | `bg-base-200`         | `oklch(98% 0 0)`              | Secondary background         |
| Base-300            | `bg-base-300`         | `oklch(95% 0 0)`              | Tertiary background          |
| Base-content        | `text-base-content`   | `oklch(21% 0.006 285.885)`    | Main text color              |

---

## Theme Implementation

### CSS Custom Properties (app/globals.css)

```css
@import "tailwindcss";
@plugin "daisyui";

@plugin "daisyui/theme" {
  name: "healthapp";
  default: true;
  prefersdark: false;
  color-scheme: "light";
  --color-base-100: oklch(100% 0 0);
  --color-base-200: oklch(98% 0 0);
  --color-base-300: oklch(95% 0 0);
  --color-base-content: oklch(21% 0.006 285.885);
  --color-primary: oklch(60% 0.15 180);
  --color-primary-content: oklch(95% 0.02 180);
  --color-secondary: oklch(58% 0.25 280);
  --color-secondary-content: oklch(95% 0.02 280);
  --color-accent: oklch(70% 0.25 45);
  --color-accent-content: oklch(95% 0.02 45);
  --color-neutral: oklch(14% 0.005 285.823);
  --color-neutral-content: oklch(92% 0.004 286.32);
  --color-info: oklch(74% 0.16 232.661);
  --color-info-content: oklch(29% 0.066 243.157);
  --color-success: oklch(76% 0.177 163.223);
  --color-success-content: oklch(37% 0.077 168.94);
  --color-warning: oklch(82% 0.189 84.429);
  --color-warning-content: oklch(41% 0.112 45.904);
  --color-error: oklch(71% 0.194 13.428);
  --color-error-content: oklch(27% 0.105 12.094);
  --radius-selector: 0.5rem;
  --radius-field: 0.25rem;
  --radius-box: 0.5rem;
  --size-selector: 0.25rem;
  --size-field: 0.25rem;
  --border: 1px;
  --depth: 1;
  --noise: 0;
}
```

### Tailwind Configuration (tailwind.config.js)

```js
import daisyui from 'daisyui';

/** @type {import('tailwindcss').Config} */
const config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {},
  },
  plugins: [daisyui],
  daisyui: {
    themes: false, // Disable themes since we're using CSS custom properties
  },
};

export default config;
```

---

## How to Use the Theme

### 1. **Background and Text Colors**

```jsx
<div className="bg-primary text-primary-content">Primary section</div>
<div className="bg-secondary text-secondary-content">Secondary section</div>
<div className="bg-accent text-accent-content">Accent section</div>
<div className="bg-base-100 text-base-content">Base section</div>
```

### 2. **Buttons**

```jsx
<button className="btn btn-primary">Primary Button</button>
<button className="btn btn-secondary">Secondary Button</button>
<button className="btn btn-accent">Accent Button</button>
<button className="btn btn-ghost">Ghost Button</button>
```

### 3. **Cards**

```jsx
<div className="card bg-base-100 shadow-xl">
  <div className="card-body">
    <h2 className="card-title">Card Title</h2>
    <p>Card content</p>
  </div>
</div>
```

### 4. **Alerts**

```jsx
<div className="alert alert-info">Info alert</div>
<div className="alert alert-success">Success alert</div>
<div className="alert alert-warning">Warning alert</div>
<div className="alert alert-error">Error alert</div>
```

### 5. **Badges**

```jsx
<span className="badge badge-primary">Primary</span>
<span className="badge badge-secondary">Secondary</span>
<span className="badge badge-accent">Accent</span>
```

---

## Example: Landing Page Section

```jsx
import React from 'react'

const LandingPage = () => {
  return (
    <div className="container mx-auto p-4 space-y-6">
      {/* Theme Color Examples */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-base-content">Theme Colors</h2>
        <div className="bg-primary text-primary-content p-4 rounded-lg">
          Primary background with primary content text
        </div>
        <div className="bg-secondary text-secondary-content p-4 rounded-lg">
          Secondary background with secondary content text
        </div>
        <div className="bg-accent text-accent-content p-4 rounded-lg">
          Accent background with accent content text
        </div>
      </section>

      {/* Button Examples */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-base-content">Buttons</h2>
        <div className="flex gap-2 flex-wrap">
          <button className="btn btn-primary">Primary Button</button>
          <button className="btn btn-secondary">Secondary Button</button>
          <button className="btn btn-accent">Accent Button</button>
          <button className="btn btn-ghost">Ghost Button</button>
        </div>
      </section>
    </div>
  )
}

export default LandingPage
```

---

## Key Features

### ✅ **Modern CSS Custom Properties**
- Uses the latest DaisyUI v5.0.46 theme syntax
- CSS custom properties for better performance
- OKLCH color space for better color accuracy

### ✅ **No Theme Attribute Required**
- Theme is set as default in CSS
- No need for `data-theme` attribute on HTML element
- Automatic theme application

### ✅ **Complete Color Palette**
- Primary (TEAL), Secondary (PURPLE), Accent (ORANGE)
- Semantic colors (info, success, warning, error)
- Neutral colors for text and backgrounds

---

## Troubleshooting

### If colors aren't showing correctly:

1. **Restart the development server**: `npm run dev`
2. **Clear browser cache**: Hard refresh (Ctrl+F5 / Cmd+Shift+R)
3. **Check browser console** for any CSS errors
4. **Verify CSS is loading**: Check Network tab in DevTools

### If components aren't styled:

1. **Ensure DaisyUI plugin is loaded** in `app/globals.css`
2. **Check Tailwind configuration** includes all content paths
3. **Verify component classes** match DaisyUI syntax

---

## Resources

- [DaisyUI Documentation](https://daisyui.com/components/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs/utility-first)
- [OKLCH Color Space](https://developer.mozilla.org/en-US/docs/Web/CSS/color_value/oklch)

---

**Last Updated**: Based on Tailwind CSS v4.1.11 and DaisyUI v5.0.46 