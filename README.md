# Financial Receipts Management System

A comprehensive web application for managing and analyzing financial receipts by assigning transactions to specific agents using uploaded Word, PDF, or Excel files. The app extracts key transaction data directly from file contents, organizes them per agent, and provides dashboards and analytics.

## 🚀 Features

### Core Functionality
- **Agent Management**: Create, view, and manage financial agents
- **Receipt Upload**: Upload Word (.docx), PDF, or Excel (.xls, .xlsx) files
- **Table Extraction**: Automatically extract transaction data from uploaded files
- **Transaction Management**: View, edit, and delete individual transactions
- **Multi-Agent Assignment**: Handle multiple transactions per file with agent selection

### Analytics & Insights
- **Dashboard**: Overview of all agents with performance rankings
- **Visual Analytics**: Bar charts, pie charts, and trend lines
- **Agent Performance**: Detailed metrics per agent
- **Monthly Trends**: Track financial performance over time
- **Search & Filter**: Find transactions by reference, description, or agent

### Data Management
- **Real-time Updates**: Live data synchronization across components
- **Secure Storage**: User-specific data with Row Level Security (RLS)
- **File Storage**: Secure cloud storage for uploaded receipt files
- **Data Validation**: Comprehensive validation of extracted transaction data

## 🛠️ Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS** for styling
- **shadcn/ui** for modern UI components
- **Recharts** for data visualization
- **React Query** for state management and caching

### Backend & Database
- **Supabase** for backend services
- **PostgreSQL** database with RLS policies
- **Supabase Storage** for file management
- **Supabase Auth** for user authentication

### File Processing
- **pdf-parse** for PDF text extraction
- **mammoth** for Word document processing
- **xlsx** for Excel file handling

## 📁 Project Structure

```
src/
├── components/           # React components
│   ├── ui/              # shadcn/ui components
│   ├── AppNavigation.tsx # Main navigation
│   ├── Dashboard.tsx    # Dashboard overview
│   ├── AgentManager.tsx # Agent management
│   ├── AgentDetails.tsx # Individual agent view
│   ├── ReceiptUpload.tsx # File upload & processing
│   ├── Analytics.tsx    # Charts and analytics
│   └── Search.tsx       # Transaction search
├── services/            # Business logic services
│   ├── fileParsingService.ts    # File parsing logic
│   ├── transactionService.ts    # Transaction management
│   └── analyticsService.ts      # Analytics calculations
├── integrations/        # External service integrations
│   └── supabase/        # Supabase client & types
├── pages/               # Page components
├── hooks/               # Custom React hooks
└── lib/                 # Utility functions
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Supabase account

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd receipt-agent
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Supabase**
   - Create a new Supabase project
   - Run the migration file: `supabase/migrations/20250914101752_395f36a7-adb3-49b6-a73a-8e32a1ef0ef3.sql`
   - Get your project URL and anon key

4. **Configure environment variables**
   Create a `.env.local` file:
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:5173](http://localhost:5173)

## 📊 Database Schema

### Tables
- **agents**: Store agent information (code_name, agent_id, real_name)
- **receipts**: Store uploaded file metadata
- **transactions**: Store extracted transaction data with relationships

### Key Features
- Row Level Security (RLS) for user data isolation
- Automatic timestamp updates
- Foreign key relationships with cascade deletes
- Optimized indexes for performance

## 🔧 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## 📱 Usage Guide

### 1. Authentication
- Sign up or sign in to access the application
- All data is user-specific and secure

### 2. Agent Management
- Create agents with code names, IDs, and real names
- View agent performance rankings
- Access detailed agent views

### 3. Receipt Upload
- Upload Word, PDF, or Excel files
- Preview extracted transaction data
- Assign transactions to specific agents
- Handle multiple transactions per file

### 4. Analytics
- View comprehensive financial overview
- Analyze agent performance with charts
- Track monthly trends and patterns
- Export data for external analysis

### 5. Search & Filter
- Search by reference number, description, or agent
- Filter by date ranges and transaction types
- View real-time search results with statistics

## 🎨 Design System

### Theme
- **Dark Mode**: Modern dark theme with Ethiopian-inspired green accents
- **Colors**: HSL-based color system with consistent theming
- **Typography**: Clean, readable fonts with proper hierarchy
- **Components**: Consistent shadcn/ui components with custom styling

### Key Design Elements
- Gradient cards with subtle shadows
- Primary green color (#4ade80) for success states
- Responsive grid layouts
- Smooth animations and transitions

## 🔒 Security Features

- **Authentication**: Supabase Auth with email/password
- **Authorization**: Row Level Security (RLS) policies
- **Data Isolation**: User-specific data access
- **File Security**: Secure file storage with access controls
- **Input Validation**: Comprehensive data validation

## 🚀 Deployment

### Vercel (Recommended)
1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Other Platforms
- **Netlify**: Similar to Vercel, supports environment variables
- **Railway**: Full-stack deployment with database
- **Supabase**: Host frontend on Supabase Edge Functions

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support, email support@example.com or create an issue in the GitHub repository.

## 🔮 Future Enhancements

- **Mobile App**: React Native version for mobile devices
- **Advanced Analytics**: Machine learning insights
- **API Integration**: Connect with banking APIs
- **Multi-currency Support**: Handle different currencies
- **Automated Categorization**: AI-powered transaction categorization
- **Export Features**: PDF reports and Excel exports
- **Team Collaboration**: Multi-user workspaces