# Using the Custom DaisyUI Theme in HealthApp

## Overview

Your project uses a custom DaisyUI theme with OKLCH color values, integrated with Tailwind CSS v3.4.0. This guide explains how to use the theme’s color classes and DaisyUI components in your React/Next.js app.

---

## Theme Colors

| Name                | Class Name             | Color Value (OKLCH)           | Usage Example                |
|---------------------|-----------------------|-------------------------------|------------------------------|
| Primary             | `bg-primary`          | `oklch(60% 0.126 221.723)`    | Main brand color             |
| Primary Content     | `text-primary-content`| `oklch(93% 0.034 272.788)`    | Text on primary backgrounds  |
| Secondary           | `bg-secondary`        | `oklch(58% 0.233 277.117)`    | Accent/secondary color       |
| Secondary Content   | `text-secondary-content`| `oklch(94% 0.028 342.258)`  | Text on secondary backgrounds|
| Accent              | `bg-accent`           | `oklch(70% 0.213 47.604)`     | Highlight/accent color       |
| Accent Content      | `text-accent-content` | `oklch(38% 0.063 188.416)`    | Text on accent backgrounds   |
| Base-100            | `bg-base-100`         | `oklch(100% 0 0)`             | Main background (white)      |
| Base-content        | `text-base-content`   | `oklch(21% 0.006 285.885)`    | Main text color              |

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
import NavBar from './NavBar'

export default function LandingPage() {
  return (
    <>
      <NavBar />
      <div className="container mx-auto p-4 space-y-4">
        <div className="bg-primary text-primary-content p-4 rounded-lg">
          Primary background with primary content text
        </div>
        <div className="bg-secondary text-secondary-content p-4 rounded-lg">
          Secondary background with secondary content text
        </div>
        <div className="bg-accent text-accent-content p-4 rounded-lg">
          Accent background with accent content text
        </div>
        <div className="flex gap-2 flex-wrap">
          <button className="btn btn-primary">Primary Button</button>
          <button className="btn btn-secondary">Secondary Button</button>
          <button className="btn btn-accent">Accent Button</button>
        </div>
      </div>
    </>
  )
}
```

---

## Tips

- Use DaisyUI utility classes (`btn`, `card`, `alert`, etc.) for consistent styling.
- Use the color classes (`bg-primary`, `text-primary-content`, etc.) to apply your custom theme colors.
- You can mix DaisyUI and Tailwind classes as needed.

---

**For more info:**  
- [DaisyUI documentation](https://daisyui.com/components/)  
- [Tailwind CSS documentation](https://tailwindcss.com/docs/utility-first) 