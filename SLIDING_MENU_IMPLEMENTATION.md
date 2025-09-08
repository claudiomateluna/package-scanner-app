# Sliding Menu Implementation

## Overview
This document summarizes the implementation of a sliding menu that appears from the left when clicking the adidas_shp.svg image. The menu contains all the buttons that were previously in the header, with the same restrictions and limitations.

## Changes Made

### 1. Created SlidingMenu Component
**File:** `src/app/components/SlidingMenu.tsx`

Created a new component with the following features:
- Slides in from the left with smooth animation
- Contains all the buttons from the previous header
- Each menu item has an associated icon
- Menu items are arranged vertically
- Includes the same restrictions and limitations as the original buttons
- Closes when clicking outside the menu or on a menu item

### 2. Updated AppLayout Component
**File:** `src/app/components/AppLayout.tsx`

Modified the main layout component to:
- Remove the buttons from the header
- Add state to control menu visibility
- Add click handler to the adidas_shp.svg image to toggle the menu
- Integrate the new SlidingMenu component

### 3. Added Custom SVG Icons
Created custom SVG icons for all menu items:
- ScannerIcon: For the "Recepción" button
- AdminIcon: For the "Administración" button
- KeyIcon: For the "Cambiar Contraseña" button
- LogoutIcon: For the "Cerrar Sesión" button
- BackIcon: For the "Volver" button

## Features Implemented

### Menu Behavior
1. **Activation**: Clicking the adidas_shp.svg image opens the sliding menu
2. **Animation**: Smooth slide-in/slide-out animation (0.3s duration)
3. **Overlay**: Semi-transparent overlay appears when menu is open
4. **Closing**: Menu closes when:
   - Clicking outside the menu
   - Clicking on any menu item
   - Clicking the menu button again

### Menu Content
The sliding menu contains all the buttons that were previously in the header:
1. **Volver** (Back) - Conditional, only shown when onBack prop is provided
2. **Recepción** (Scanner) - Conditional, only for warehouse/admin roles
3. **Administración** (Administration) - Conditional, only for warehouse/admin roles
4. **Cambiar Contraseña** (Change Password) - Available to all users
5. **Cerrar Sesión** (Logout) - Available to all users

### Visual Design
- Width: 280px
- Background color: #233D4D (matches app theme)
- Header with Adidas logo and "Recepciones" title in #FE7F2D accent color
- Menu items with hover effects and active state highlighting
- Icons for each menu item for better visual recognition
- Box shadow for depth effect
- Responsive design that works on all screen sizes

### Restrictions and Limitations Preserved
- **Role-based access**: Warehouse/admin buttons only visible to authorized users
- **Active state highlighting**: Current view is highlighted in the menu
- **Same functionality**: All buttons maintain their original behavior
- **Password form integration**: Change password functionality still works through the menu

## Files Modified
1. `src/app/components/SlidingMenu.tsx` - New component (created)
2. `src/app/components/AppLayout.tsx` - Updated to use sliding menu

## Testing
The implementation has been tested with a successful build, ensuring no compilation errors. The sliding menu provides a cleaner header while maintaining all the functionality of the original button layout.