# AI Clearance

A modern, AI-powered campaign management application built with Next.js, TypeScript, and shadcn/ui. Create campaigns, classify content using AI, and manage your clearance workflow efficiently.

## Features

### 🚀 Core Functionality

- **Campaign Management**: Create and manage campaigns with a streamlined multi-step process
- **AI-Powered Classification**: Upload PDFs or images and get AI-powered category classification
- **Category Selection**: Choose from available categories and let AI verify the match
- **Manual Review**: Request manual review when AI predictions don't match your selection
- **Campaign Tracking**: View all your campaigns with status, category matching, and review information

### 📱 User Experience

- **Responsive Design**: Optimized for both mobile and desktop devices
- **Modern UI**: Beautiful, intuitive interface built with Tailwind CSS and shadcn/ui
- **Multi-step Authentication**: Secure signup process with OTP verification

- **Protected Routes**: Secure access to authenticated pages

### 🎯 Key Features

1. **Authentication Flow**
   - Login with email/password
   - Signup with email verification
   - Forgot password with OTP verification

2. **Campaign Creation Flow**
   - Step 1: Create Campaign
   - Step 2: Select Category
   - Step 3: Upload & Classify (PDF or Image)
   - Step 4: Category Mismatch Handling (if needed)
   - Step 5: Programs Selection

3. **AI Classification**
   - Upload PDF or image files
   - AI predicts the category
   - Compare with selected category
   - Handle mismatches with manual review option

4. **Campaign Dashboard**
   - View all campaigns
   - See category matching status
   - Track review status
   - View creation and update timestamps

## Technology Stack

- **Frontend**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4
- **UI Components**: shadcn/ui (Radix UI primitives)
- **State Management**: Jotai
- **Forms**: React Hook Form with Zod validation
- **API Client**: use-hook-api
- **Icons**: Lucide React
- **Notifications**: React Toastify

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd ai_clearance
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up environment variables**

   Create a `.env` file in the root directory:

   ```env
   NEXT_PUBLIC_API_URL=your_api_url_here
   ```

4. **Run the development server**

   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

### Building for Production

```bash
npm run build
npm start
```

## Project Structure

```
ai_clearance/
├── api/                          # API client functions
│   ├── auth.ts                   # Authentication APIs
│   ├── campaigns.ts              # Campaign APIs
│   └── categories.ts             # Category APIs
├── src/
│   ├── app/                      # Next.js app router pages
│   │   ├── page.tsx              # Homepage (campaigns list)
│   │   ├── login/                # Login page
│   │   ├── signup/                # Signup page
│   │   ├── forgot-password/       # Forgot password flow
│   │   ├── verify-otp/           # OTP verification
│   │   └── create-campaign/      # Campaign creation flow
│   ├── components/
│   │   ├── campaign/              # Campaign-related components
│   │   │   ├── steps/             # Campaign creation steps
│   │   │   │   ├── CreateCampaignStep.tsx
│   │   │   │   ├── CategorySelectionStep.tsx
│   │   │   │   ├── UploadAndClassifyStep.tsx
│   │   │   │   ├── CategoryMismatchStep.tsx
│   │   │   │   └── ProgramsSelectionStep.tsx
│   │   │   └── ProgressBar.tsx
│   │   ├── common/                # Shared components
│   │   │   ├── AuthLayout.tsx
│   │   │   ├── DashboardNavbar.tsx
│   │   │   └── ProtectedRoute.tsx
│   │   ├── ui/                    # shadcn/ui components
│   │   └── utils/                 # Utility wrappers
│   ├── hooks/                     # Custom React hooks
│   ├── lib/                       # Utility functions
│   ├── store/                     # Jotai state management
│   │   └── campaign.ts           # Campaign state atoms
│   └── types/                     # TypeScript type definitions
├── public/                        # Static assets
├── components.json                # shadcn/ui configuration
├── tailwind.config.ts            # Tailwind CSS configuration
└── package.json                   # Dependencies and scripts
```

## Key Components

### Campaign Creation Flow

#### CreateCampaignStep
- Initial step to create a new campaign
- Stores campaign ID in Jotai for the entire flow

#### CategorySelectionStep
- Fetches and displays available categories
- Allows user to select a category
- Stores selected category in Jotai

#### UploadAndClassifyStep
- File upload (PDF or images)
- AI classification of uploaded file
- Shows classification results
- Handles category matching

#### CategoryMismatchStep
- Displays when AI prediction doesn't match selection
- Options to accept predicted category
- Request manual review
- Choose category to proceed with

#### ProgramsSelectionStep
- Final step for program selection
- Placeholder for future implementation

### State Management

The application uses Jotai for state management:

- `campaignIdAtom`: Stores the current campaign ID
- `selectedCategoryAtom`: Stores the user-selected category
- `classificationResultAtom`: Stores AI classification results

All state is cleared when the campaign creation flow is completed.

## API Integration

The application integrates with a REST API for:

- **Authentication**: Login, signup, password reset, OTP verification
- **Campaigns**: Create, fetch, update campaigns
- **Categories**: Fetch available categories
- **Classification**: AI-powered category prediction
- **Manual Reviews**: Request and manage manual reviews

API functions are located in the `api/` directory and use the `use-hook-api` library for HTTP requests.

## Environment Variables

Create a `.env` file with the following variables:

```env
NEXT_PUBLIC_API_URL=your_api_base_url
```

## Development

### Running the Development Server

```bash
npm run dev
```

### Building for Production

```bash
npm run build
npm start
```

### Linting

```bash
npm run lint
```

## Features in Detail

### Authentication
- Email/password authentication
- OTP-based email verification
- Password reset flow
- Protected routes with automatic redirect

### Campaign Management
- Multi-step campaign creation
- Category selection from taxonomy
- File upload (PDF, JPG, PNG, WEBP, GIF)
- AI-powered category classification
- Category mismatch handling
- Manual review requests
- Campaign status tracking

### UI/UX
- Responsive design
- Loading states with animations
- Error handling and feedback
- Progress indicators
- Toast notifications
- Form validation

## Customization

### Styling

The application uses Tailwind CSS for styling. You can customize:

- Color scheme in `src/app/globals.css`
- Component variants in `src/components/ui/`
- Global styles in `src/app/globals.css`

### Components

All UI components are built with shadcn/ui and can be customized:

- Modify component variants
- Add new component types
- Customize animations and transitions

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy automatically on push

### Other Platforms

- **Netlify**: Build and deploy from Git
- **Railway**: Full-stack deployment
- **AWS Amplify**: AWS-powered hosting

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support and questions:

- Create an issue in the repository
- Check the documentation
- Review the code examples

---

Built with ❤️ using Next.js, TypeScript, Tailwind CSS, and shadcn/ui
