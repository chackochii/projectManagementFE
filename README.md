This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.


Project Management & Employee Tracking System
----------------------------------------------
A robust, enterprise-level management suite built with Next.js. This application facilitates project tracking, employee task management, leave requests, financial cost estimation, and administrative reporting.

🚀 Features
🔐 Authentication & Authorization
Role-Based Access Control (RBAC): Separate portals for Admins and Employees using withAuth and withAdminAuth High-Order Components (HOCs).
Secure Login: Features password visibility toggles and secure token retrieval for API requests.
Session Management: Custom logout redirection logic and persistent user state management.

📊 Project & Task Management
Kanban Board & Backlog: Manage workflow with dedicated views for active tickets and backlogs.
Project Context: Centralized state management for project data.
Task Assignment: Detailed employee task tracking and time logging (Hours/HMS format).

💼 Admin & HR Tools
Employee Management: Track employee details and performance.
Leave System: Comprehensive leave management and approval workflow.
Client Management: Dedicated portal for managing client relationships and project assignments.

💰 Finance & Reporting
Cost Estimation: Tools for calculating project costs and budgets.
Accounting: Financial tracking and invoice management.
PDF Generation: Exportable reports using jspdf and jspdf-autotable.

🛠 Tech Stack
----------------
Framework: Next.js 14/15 (App Router)
Language: TypeScript
Styling: Tailwind CSS / PostCSS
State Management: React Context API
Reporting: jsPDF & jsPDF-AutoTable
Linting: ESLint

├── app/
│   ├── (admin)/           # Admin-specific routes (Reports, Accounting, Clients)
│   ├── (dashboard)/       # User/Employee dashboard
│   ├── activeTickets/     # Ticket tracking system
│   ├── login/             # Authentication pages
│   ├── projects/          # Project list and details
│   └── layout.js          # Main application layout
├── components/            # Reusable UI components
├── context/               # ProjectContext & Global State
├── lib/                   # HOCs (withAuth), Utilities, and API helpers
└── public/                # Static assets
