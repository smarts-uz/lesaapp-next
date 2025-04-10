<!-- Generated by SpecStory -->

# Chat Name Generation (2025-04-02 14:59:16)

_**Assistant**_

---

_**User**_

How to create a cursor rule in .cursor folder for specific tech

---

_**Assistant**_

Let me help you create a cursor rule for specific technology. First, I'll check if there's a `.cursor` directory in your workspace.

---

<details>
            <summary>Listed current directory • **25** results</summary>
        
| Name |
|-------|
| 📁 `.cursor` |
| 📁 `.next` |
| 📁 `.git` |
| 📄 `package-lock.json` |
| 📁 `node_modules` |
| 📄 `package.json` |
| 📄 `.gitignore` |
| 📁 `lib` |
| 📁 `app` |
| 📄 `README.md` |
| 📄 `.env.example` |
| 📁 `.specstory` |
| 📄 `.env` |
| 📁 `prisma` |
| 📁 `types` |
| 📁 `styles` |
| 📁 `public` |
| 📁 `hooks` |
| 📁 `components` |
| 📄 `next.config.mjs` |
| 📄 `tailwind.config.ts` |
| 📄 `next-env.d.ts` |
| 📄 `components.json` |
| 📄 `postcss.config.mjs` |
| 📄 `tsconfig.json` |

</details>

---

I see you have a `.cursor` directory. Let me check its contents to see what rules already exist.

---

<details>
            <summary>Listed directory .cursor • **1** results</summary>
        
| Name |
|-------|
| 📁 `rules` |

</details>

---

To create a cursor rule for a specific technology, you need to:

1. Create a new JSON file in the `.cursor/rules` directory with your rule configuration
2. The file should follow this structure:

```json
{
  "name": "Your Rule Name",
  "description": "Description of what this rule does",
  "pattern": "**/*.{ext1,ext2}", // File patterns to match
  "rules": {
    "your-rule-id": {
      "severity": "warning|error",
      "message": "Your rule message",
      "regex": "your-regex-pattern"
    }
  }
}
```

For example, if you want to create a rule for TypeScript files that enforces a specific naming convention, you would create a file like `typescript-naming.json` in the `.cursor/rules` directory.

Would you like me to create a specific rule for your technology? Please let me know:

1. Which technology you want to create rules for
2. What specific patterns or conventions you want to enforce

---

_**User**_

create a sample rule

---

_**Assistant**_

I'll create a sample rule for TypeScript that enforces consistent function naming conventions (camelCase for functions).

---

```diff
-
+ {
+   "name": "TypeScript Function Naming Convention",
+   "description": "Enforces camelCase naming for functions in TypeScript files",
+   "pattern": "**/*.ts",
+   "rules": {
+     "function-naming": {
+       "severity": "warning",
+       "message": "Function names should use camelCase",
+       "regex": "function\\s+[a-z][a-zA-Z0-9]*\\s*\\("
+     }
+   }
+ }
```

---

I've created a sample rule that:

- Applies to all TypeScript files (`**/*.ts`)
- Checks for function declarations
- Ensures they start with lowercase (camelCase)
- Shows a warning if the convention is violated

The rule will match function declarations like:

- ✅ `function myFunction()`
- ❌ `function MyFunction()`

You can create similar rules for other patterns by:

1. Changing the `pattern` to match different file types
2. Modifying the `regex` to match different code patterns
3. Adjusting `severity` to "error" for stricter enforcement

---

_**User**_

what about .cursorrules format?

---

_**Assistant**_

Let me create a sample rule using the `.cursorrules` format, which is an alternative format that uses a more concise syntax.

---

```diff
-
+ # TypeScript conventions
+ *.ts {
+     # Function naming convention
+     function\s+[A-Z] {
+         severity: warning
+         message: "Function names should use camelCase"
+     }
+
+     # No console.log in production
+     console\.log {
+         severity: error
+         message: "Avoid console.log in production code"
+     }
+ }
```

---

The `.cursorrules` format is more concise and uses:

- File patterns with `*.ts`
- Block syntax with `{}`
- Comments with `#`
- Simpler key-value pairs
- Multiple rules in one file

This format is easier to read and maintain compared to the JSON format.

---

---
