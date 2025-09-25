# 🎯 Voice AI Widget Setup Instructions

## ❌ Problem Solved: Duplicate Widgets

You were seeing **two different widgets** because:

1. **Theme Extension Widget** - From `star_rating.liquid` (theme settings)
2. **Admin Dashboard Widget** - From `/embed` route (admin settings)

## ✅ Solution Applied

I've **disabled the theme extension widget** to prevent duplicates. Now only the **admin dashboard widget** will show.

## 🚀 How to Use Your Widget Now

### Step 1: Admin Dashboard Control
1. Go to your **Shopify Admin Panel**
2. Navigate to **Voice AI App**
3. Go to **Widget Settings**
4. Customize your widget:
   - Background Color
   - Icon Color  
   - Position (Left/Right)
   - Enable/Disable

### Step 2: Publish to Live Store
1. Click **"🚀 Publish to Live Store"**
2. Settings will be applied to your live website
3. Widget will appear with your customizations

### Step 3: Verify on Live Store
1. Go to your live store website
2. Look for the floating widget
3. It should match your admin dashboard settings

## 🔧 Technical Details

### What Changed:
- **Theme Extension**: Disabled to prevent duplicate widgets
- **Admin Dashboard**: Now the only source of widget control
- **Database**: Stores all widget settings
- **Embed Script**: Loads settings from database

### Widget Flow:
```
Admin Dashboard → Database → Embed Script → Live Store
     ↓              ↓           ↓            ↓
  Change Color → Save Settings → Publish → Widget Updates
```

## 🎨 Customization Options

### Available Settings:
- ✅ **Background Color** - Choose any color
- ✅ **Icon Color** - Choose any color  
- ✅ **Position** - Left or Right side
- ✅ **Enable/Disable** - Turn widget on/off
- ✅ **Real-time Updates** - Changes apply immediately

### How It Works:
1. **Admin changes** widget settings
2. **Settings saved** to database
3. **Publish button** marks settings as live
4. **Embed script** loads latest settings
5. **Widget updates** on live store

## 🚨 Important Notes

### Theme Extension:
- **Status**: Disabled (to prevent duplicates)
- **Control**: Use admin dashboard instead
- **Settings**: Ignored (admin dashboard takes priority)

### Admin Dashboard:
- **Status**: Active (primary control)
- **Control**: Full customization available
- **Settings**: Applied to live store

## 🧪 Testing Your Setup

### Test Steps:
1. **Change color** in admin dashboard
2. **Save settings** 
3. **Publish to live store**
4. **Check live website** - widget should be new color
5. **Hard refresh** if needed (Ctrl+F5)

### Expected Result:
- ✅ **Only one widget** appears
- ✅ **Widget matches** admin settings
- ✅ **Changes apply** immediately after publish
- ✅ **No duplicate widgets**

## 🎉 Benefits

### Single Source of Truth:
- ✅ **Admin dashboard** controls everything
- ✅ **No confusion** between theme/admin settings
- ✅ **Consistent behavior** across all pages
- ✅ **Easy customization** from one place

### Real-time Updates:
- ✅ **Instant publishing** to live store
- ✅ **No theme editing** required
- ✅ **Database-driven** settings
- ✅ **Automatic widget** updates

## 🔍 Troubleshooting

### If Widget Doesn't Show:
1. Check **admin dashboard** - is widget enabled?
2. Click **"Publish to Live Store"**
3. **Hard refresh** your live store (Ctrl+F5)
4. Check **browser console** for errors

### If Settings Don't Apply:
1. **Save settings** in admin dashboard first
2. Click **"Publish to Live Store"**
3. Wait a few seconds for database update
4. **Refresh live store** page

### If Duplicate Widgets:
1. **Theme extension** should be disabled (already done)
2. Only **admin dashboard widget** should show
3. If still seeing duplicates, clear browser cache

## 📞 Support

If you need help:
1. Check this instruction file
2. Test with the provided steps
3. Verify admin dashboard settings
4. Check live store after publishing

---

**🎯 Result: One widget, controlled by admin dashboard, with real-time customization!**
