# Watermarker Web

A modern web application for adding text and image watermarks to images and videos.

## Features

- Add text or image watermarks to your media
- Drag and position watermarks with intuitive controls
- Customize opacity, size, and rotation
- Save watermarks for future use
- Support for both images and videos
- Secure and private - processing happens in your browser
- User authentication with Google or email/password
- Admin panel for user management and analytics
- Completely free to use

## Tech Stack

- **Frontend**: Next.js, React, TypeScript, Tailwind CSS, HeroUI
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js with Google and Credentials providers
- **Styling**: Tailwind CSS with custom animations
- **State Management**: React Hooks
- **Media Processing**: Client-side JavaScript

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL database

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/watermarker-web.git
   cd watermarker-web
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   Create a `.env` file in the root directory with the following variables:
   ```env
   DATABASE_URL="postgresql://user:password@localhost:5432/watermarker_db"
   NEXTAUTH_URL="http://localhost:3000"
   NEXTAUTH_SECRET="your-secret-key"
   GOOGLE_CLIENT_ID="your-google-client-id"
   GOOGLE_CLIENT_SECRET="your-google-client-secret"
   STRIPE_SECRET_KEY="your-stripe-secret-key"
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="your-stripe-publishable-key"
   STRIPE_PRICE_ID="your-stripe-price-id"
   STRIPE_WEBHOOK_SECRET="your-stripe-webhook-secret"
   NEXT_PUBLIC_MAINTENANCE_MODE="false"
   ```

4. Set up the database:
   ```bash
   npx prisma migrate dev
   ```

5. Run the development server:
   ```bash
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Testing

The application includes a comprehensive test suite. For more information on running and writing tests, see [TESTING.md](TESTING.md).

## Deployment

This application can be deployed to any platform that supports Next.js applications, such as Vercel, Netlify, or a VPS with Coolify.

### VPS Deployment with Coolify

1. Set up a VPS with Coolify installed
2. Connect your Git repository
3. Configure the build settings:
   - Build command: `npm run build`
   - Output directory: `.next`
4. Set up the environment variables
5. Deploy the application

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgements

- [HeroUI](https://heroui.com) for the UI components
- [Next.js](https://nextjs.org) for the React framework
- [Prisma](https://prisma.io) for the database ORM
- [NextAuth.js](https://next-auth.js.org) for authentication
- [Tailwind CSS](https://tailwindcss.com) for styling
