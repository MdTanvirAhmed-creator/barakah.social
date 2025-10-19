# Trusted Publisher Partnerships - Testing Guide

## 🧪 **How to Test the Trusted Publisher System**

The server is running successfully on **http://localhost:3007**. Here's how to test all the features we've implemented:

## 📱 **Testing URLs**

### **1. Publisher Management Admin**
**URL:** `http://localhost:3007/admin/publishers`

**What to Test:**
- ✅ **View Publisher Dashboard** - See all trusted publishers
- ✅ **Filter Publishers** - Filter by status (pending/approved/rejected) and quality
- ✅ **Search Publishers** - Search by name, website, or description
- ✅ **Publisher Details** - Click on any publisher to see detailed information
- ✅ **Approve/Reject Publishers** - Test the approval workflow
- ✅ **Import Content** - Click "Import Now" for approved publishers
- ✅ **Quality Scores** - View publisher quality metrics

### **2. Content Review Interface**
**URL:** `http://localhost:3007/admin/content-review`

**What to Test:**
- ✅ **Content Review Queue** - See imported content waiting for review
- ✅ **Filter Content** - Filter by status and content type
- ✅ **Content Details** - Click on any content item to see full details
- ✅ **Approve/Reject Content** - Test the content review workflow
- ✅ **Review Notes** - Add notes when reviewing content
- ✅ **Content Analytics** - View engagement metrics

### **3. Scholar Management (Previous Implementation)**
**URL:** `http://localhost:3007/admin/scholars`

**What to Test:**
- ✅ **Scholar Applications** - View scholar verification requests
- ✅ **Approval Workflow** - Approve/reject scholar applications
- ✅ **Verification Levels** - Gold, Silver, Bronze, Student levels
- ✅ **Scholar Details** - View comprehensive application details

### **4. Scholar Portal (Previous Implementation)**
**URL:** `http://localhost:3007/scholar-portal`

**What to Test:**
- ✅ **Content Management** - Upload and manage scholarly content
- ✅ **Community Questions** - Answer questions in expertise areas
- ✅ **Live Sessions** - Schedule and manage teaching sessions
- ✅ **Analytics Dashboard** - View performance metrics

## 🔍 **Step-by-Step Testing Process**

### **Phase 1: Publisher Management Testing**

1. **Navigate to Publisher Admin**
   ```
   http://localhost:3007/admin/publishers
   ```

2. **Test Publisher Dashboard**
   - You should see 3 sample publishers:
     - Islamic Research Foundation (95/100 quality, approved)
     - Al-Azhar Online (98/100 quality, approved)
     - Islamic Book Trust (0/100 quality, pending)
   - Test filtering by status and quality
   - Test search functionality

3. **Test Publisher Details**
   - Click the eye icon on any publisher card
   - View detailed publisher information
   - Check performance statistics
   - Review specializations and social media

4. **Test Publisher Actions**
   - For pending publishers: Test approve/reject buttons
   - For approved publishers: Test "Import Now" button
   - Verify status updates and notifications

### **Phase 2: Content Review Testing**

1. **Navigate to Content Review**
   ```
   http://localhost:3007/admin/content-review
   ```

2. **Test Content Queue**
   - You should see 3 sample content items:
     - "Understanding the Quran" (pending review)
     - "Sciences of Hadith" (auto-approved)
     - "Prophet Biography" (rejected)
   - Test filtering by status and content type
   - Test search functionality

3. **Test Content Review**
   - Click on "Understanding the Quran" content
   - View detailed content information
   - Add review notes
   - Test approve/reject functionality
   - Verify status updates

4. **Test Content Analytics**
   - View content metrics (word count, reading time, views)
   - Check engagement statistics
   - Review publisher attribution

### **Phase 3: Scholar System Testing**

1. **Navigate to Scholar Admin**
   ```
   http://localhost:3007/admin/scholars
   ```

2. **Test Scholar Applications**
   - View scholar application dashboard
   - Test filtering and search
   - Review application details
   - Test approval/rejection workflow

3. **Navigate to Scholar Portal**
   ```
   http://localhost:3007/scholar-portal
   ```

4. **Test Scholar Features**
   - Content management interface
   - Community questions
   - Live session scheduling
   - Analytics dashboard

## 🎯 **Expected Test Results**

### **Publisher Management:**
- ✅ **3 Publishers Visible** - Islamic Research Foundation, Al-Azhar Online, Islamic Book Trust
- ✅ **Quality Scores Displayed** - 95, 98, and 0 respectively
- ✅ **Status Indicators** - Approved, Approved, Pending
- ✅ **Filtering Works** - Status and quality filters functional
- ✅ **Search Works** - Name and description search functional
- ✅ **Details Modal** - Publisher information displays correctly
- ✅ **Actions Work** - Approve/reject and import buttons functional

### **Content Review:**
- ✅ **3 Content Items Visible** - Quran article, Hadith video, Prophet biography
- ✅ **Status Indicators** - Pending, Auto-approved, Rejected
- ✅ **Content Types** - Article, Video, Book
- ✅ **Filtering Works** - Status and type filters functional
- ✅ **Details Modal** - Content information displays correctly
- ✅ **Review Actions** - Approve/reject with notes functional

### **Scholar System:**
- ✅ **Scholar Applications** - 3 sample applications visible
- ✅ **Verification Levels** - Gold, Silver, Bronze, Student
- ✅ **Application Review** - Detailed review process functional
- ✅ **Scholar Portal** - Content management interface functional

## 🐛 **Common Issues & Solutions**

### **If Pages Don't Load:**
1. **Check Server Status**
   ```bash
   curl -s http://localhost:3007 | head -5
   ```
   Should return HTML content

2. **Clear Cache and Restart**
   ```bash
   rm -rf .next node_modules/.cache
   npm run dev
   ```

3. **Check Console Errors**
   - Open browser developer tools
   - Check for JavaScript errors
   - Look for network request failures

### **If Components Don't Display:**
1. **Check Import Paths** - Ensure all components are properly imported
2. **Check TypeScript Errors** - Run `npm run build` to check for type errors
3. **Check Dependencies** - Ensure all required packages are installed

### **If Database Operations Fail:**
1. **Check Supabase Connection** - Verify environment variables
2. **Check RLS Policies** - Ensure proper permissions are set
3. **Check Database Schema** - Verify migrations have been applied

## 📊 **Testing Checklist**

### **Publisher Management:**
- [ ] Publisher dashboard loads correctly
- [ ] All 3 sample publishers are visible
- [ ] Quality scores display properly
- [ ] Status indicators work correctly
- [ ] Filtering by status works
- [ ] Filtering by quality works
- [ ] Search functionality works
- [ ] Publisher details modal opens
- [ ] Approve/reject buttons work
- [ ] Import now button works
- [ ] Notifications appear correctly

### **Content Review:**
- [ ] Content review queue loads correctly
- [ ] All 3 sample content items are visible
- [ ] Content types display correctly
- [ ] Status indicators work properly
- [ ] Filtering by status works
- [ ] Filtering by type works
- [ ] Search functionality works
- [ ] Content details modal opens
- [ ] Review actions work correctly
- [ ] Review notes can be added
- [ ] Status updates work properly

### **Scholar System:**
- [ ] Scholar admin dashboard loads
- [ ] Scholar applications are visible
- [ ] Verification levels display correctly
- [ ] Application review process works
- [ ] Scholar portal loads correctly
- [ ] Content management interface works
- [ ] Analytics dashboard displays

## 🚀 **Advanced Testing**

### **Test API Integration:**
1. **Check Network Tab** - Look for API calls in browser dev tools
2. **Test Error Handling** - Try invalid operations
3. **Test Loading States** - Verify loading indicators work
4. **Test Responsive Design** - Test on different screen sizes

### **Test Database Operations:**
1. **Check Supabase Dashboard** - Verify data is being stored
2. **Test Real-time Updates** - Check if changes reflect immediately
3. **Test Permissions** - Verify RLS policies work correctly

## 📱 **Mobile Testing**

### **Test on Mobile Devices:**
1. **Open on Mobile Browser** - `http://localhost:3007`
2. **Test Responsive Design** - Check layout on different screen sizes
3. **Test Touch Interactions** - Verify buttons and modals work on touch
4. **Test Performance** - Check loading times on mobile

## 🎉 **Success Criteria**

The system is working correctly if:
- ✅ All pages load without errors
- ✅ All sample data displays correctly
- ✅ Filtering and search work properly
- ✅ Modal dialogs open and close correctly
- ✅ Action buttons respond appropriately
- ✅ Status updates work correctly
- ✅ Notifications appear when expected
- ✅ Responsive design works on mobile
- ✅ No console errors in browser dev tools

---

**Server Status:** ✅ Running on http://localhost:3007
**Database:** ✅ Supabase with sample data
**Components:** ✅ All interfaces implemented
**Testing:** ✅ Ready for comprehensive testing
