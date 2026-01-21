# Inconvo Demo

A demonstration of a data agent built with [Inconvo](https://inconvo.com) and integrated with an in-app assistant.

## What is this?

This demo showcases how Inconvo can be used to build an AI-powered data agent that connects to your application's database and answers questions in natural language. The demo uses a multi-tenant ecommerce database with three organizations (Apple, Tesla, and Logitech) to demonstrate data isolation and scoped queries.

**Key features:**
- Natural language queries to SQL using Inconvo
- Multi-tenant data isolation (queries are automatically scoped to the selected organization)
- Real-time data visualization with charts and tables
- Built with Next.js and the assistant-ui React components

## What is Inconvo?

Inconvo is a platform that connects your database to AI assistants safely and reliably. It provides:
- Semantic data modeling
- Verified SQL generation from natural language
- Query logging and monitoring
- Multi-tenant data isolation
- Deploy via MCP (Model Context Protocol) or API

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn or bun

### Installation

1. Clone the repository:
```bash
git clone https://github.com/ten-dev/inconvo-hosted-demo.git
cd inconvo-hosted-demo
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## How it works

The demo connects to a PostgreSQL database with a multi-tenant ecommerce schema:
- **Organizations** - The top-level tenant (Apple, Tesla, Logitech)
- **Products** - Products belonging to each organization
- **Orders** - Customer orders
- **Users** - Customer accounts
- **Reviews** - Product reviews

All data is connected through `organisation_id`, ensuring complete data isolation between tenants.

When you ask a question like "What's my revenue this year?", Inconvo:
1. Understands the semantic meaning of your question
2. Generates safe SQL queries scoped to the selected organization
3. Executes the query and formats the results
4. Returns data visualizations (tables, charts, etc.)

## Try the security

The demo includes a "Test data isolation" suggestion that attempts to access data from other organizations. This demonstrates Inconvo's built-in security - queries are automatically restricted to the selected organization's data.

## Build your own

Want to build your own data agent? [Start free at Inconvo](https://app.inconvo.ai) - no credit card required.

## Tech Stack

- [Next.js](https://nextjs.org) - React framework
- [Inconvo](https://inconvo.com) - AI data agent platform
- [assistant-ui](https://github.com/assistant-ui/assistant-ui) - React components for AI assistants
- [Mantine](https://mantine.dev) - React component library
- [Tailwind CSS](https://tailwindcss.com) - CSS framework
- [PostgreSQL](https://www.postgresql.org) - Database

## License

MIT
