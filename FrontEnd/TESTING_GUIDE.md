# Smart Finance Tracker Frontend

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Backend server running on http://localhost:3001

## Installation & Setup

### 1. Install Dependencies

```bash
cd FrontEnd
npm install
```

### 2. Create `.env` file

Create a `.env` file in the `FrontEnd` directory:

```
VITE_API_URL=http://localhost:3001
```

### 3. Start the Development Server

```bash
npm run dev
```

The app will automatically open at `http://localhost:3000`

## Project Structure

```
FrontEnd/
├── components/
│   ├── NotifPanel.jsx          # Notification panel
│   ├── Sidebar.jsx             # Navigation sidebar
│   ├── TxModal.jsx             # Transaction modal
│   └── charts/
│       ├── BarChart.jsx        # Bar chart component
│       └── PieChart.jsx        # Pie chart component
├── constants/
│   └── cateories.js            # Category definitions
├── pages/                      # (Optional - components in FinanceApp.jsx)
├── services/
│   └── api.js                  # API service layer
├── utils/
│   └── format.js               # Formatting utilities
├── FinanceApp.jsx              # Main app component
├── main.jsx                    # React entry point
├── index.html                  # HTML entry point
├── vite.config.js              # Vite configuration
├── package.json                # Dependencies
└── .env                        # Environment variables
```

## Testing Locally

### Option 1: Full Stack Testing (Recommended)

#### Step 1: Start Backend Server

```bash
cd BackEnd
npm install
npm run dev
# or
node server.js
```

The backend should run on `http://localhost:3001`

#### Step 2: Start Frontend Development Server

In a new terminal:

```bash
cd FrontEnd
npm install
npm run dev
```

The frontend will open at `http://localhost:3000`

#### Step 3: Test the App

1. **Navigate**: Use the sidebar to navigate between:
   - Dashboard (⊞) - Main overview with AI insights
   - Grafik (📊) - Charts and analytics
   - Budgeting (📋) - Budget management
   - Catatan (📝) - Transaction history

2. **Add Transactions**: 
   - Click "+ Transaksi" button
   - Select income or expense
   - Fill in amount, date, description, and category
   - Click "Simpan"

3. **Manage Budgets**:
   - Go to Budgeting page
   - Add budget limits by category
   - Monitor spending against budgets

4. **View Analytics**:
   - Dashboard shows AI insights and spending patterns
   - Grafik page shows detailed charts and predictions
   - Pie charts show category breakdown

5. **Recurring Transactions**:
   - In Catatan page, switch to "🔄 Rutin" tab
   - Add recurring expenses
   - Mark as active/inactive

6. **Notifications**:
   - Click bell icon to view notifications
   - Mark notifications as read
   - Get alerted for over-budget categories

### Option 2: Frontend Only Testing (Mock Data)

If you don't have the backend running yet, the app will use mock API data:

```bash
cd FrontEnd
npm install
npm run dev
```

The app will work with predefined mock transactions and analytics data.

### Option 3: Build for Production

```bash
npm run build
npm run preview
```

This creates an optimized build in the `dist/` folder.

## Key Features to Test

### 1. Dashboard
- ✅ Welcome message with user name
- ✅ Sisa Budget (budget remaining) card
- ✅ Today's Insight from AI
- ✅ Monthly financial analysis chart
- ✅ Category spending breakdown
- ✅ Add transaction button

### 2. Grafik (Charts)
- ✅ 6-month, 3-month, 1-year trend views
- ✅ Category-wise spending pie chart
- ✅ Income pie chart
- ✅ Recent transactions list
- ✅ Next month spending prediction (AI)

### 3. Budgeting
- ✅ View monthly budgets
- ✅ Add new budget categories
- ✅ Edit budget limits
- ✅ Delete budgets
- ✅ Overbudget alerts
- ✅ AI budget recommendations
- ✅ Budget distribution pie chart

### 4. Catatan (Notes/Transactions)
- ✅ Toggle between Income/Expense/Recurring views
- ✅ View all transactions
- ✅ Delete transactions
- ✅ Add/manage recurring transactions
- ✅ View transaction history

### 5. Notifications
- ✅ Bell icon with unread count
- ✅ Notification panel
- ✅ Overbudget alerts
- ✅ Recurring payment reminders
- ✅ Mark all as read

## API Integration

The frontend communicates with the backend via `/api` endpoints:

- `GET /api/users/me` - Get user profile
- `GET /api/analytics/summary` - Dashboard summary
- `GET /api/analytics/chart/*` - Chart data
- `GET /api/transactions` - List transactions
- `POST /api/transactions` - Create transaction
- `GET /api/budgets` - List budgets
- `POST /api/budgets` - Create budget
- `GET /api/recurring` - List recurring transactions
- `GET /api/notifications` - List notifications
- `GET /api/ai/*` - AI endpoints

See `FrontEnd/services/api.js` for all available endpoints.

## Troubleshooting

### Port Already in Use
- Frontend default: `3000`
- Backend default: `3001`

If ports are occupied, modify `vite.config.js` (frontend) or `server.js` (backend)

### CORS Errors
Ensure backend has CORS enabled for `http://localhost:3000`

### API Not Responding
Check that:
1. Backend is running on `http://localhost:3001`
2. `.env` has correct `VITE_API_URL`
3. Backend routes match the API calls in `api.js`

### Mock Data Not Showing
The mock API is built into `FinanceApp.jsx`. If backend is unavailable, uncomment the mock API section.

## Development Tips

1. **React DevTools**: Install React Developer Tools browser extension
2. **Network Inspector**: Check browser DevTools > Network tab for API calls
3. **Console Logs**: Check browser console for errors
4. **Hot Reload**: Vite provides instant hot module reload during development
5. **Component Inspection**: All components are inline or imported from separate files

## Next Steps

1. ✅ Install dependencies
2. ✅ Setup `.env` file
3. ✅ Start backend and frontend servers
4. ✅ Test all features
5. Optional: Split components into separate files for better organization
6. Optional: Add more styling/CSS modules
7. Optional: Setup authentication with Supabase

## Building for Production

```bash
npm run build
# Creates optimized build in dist/ folder
```

Deploy the `dist/` folder to your hosting service (Vercel, Netlify, etc.)

---

**Need Help?** Check the console logs and network requests in your browser's DevTools.
