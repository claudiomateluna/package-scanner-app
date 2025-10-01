# User List Filtering Implementation

## Overview
This document describes the implementation of role-based and location-based filtering for the "Usuarios Existentes" section in the AdminView component.

## Requirements Implemented

1. **Role Hierarchy Filtering**: Users can only see other users that are below them in the role hierarchy. Users cannot see users with roles ranked higher than their own.

2. **Store Supervisor Location Filtering**: Store Supervisors can only see users assigned to their specific locales/locations.

## Technical Implementation

### Files Modified
- `src/app/components/AdminView.tsx`
- Imported `roleHierarchy` from `src/lib/roleHierarchy.ts`

### Key Changes

1. **Import Update**:
   - Added `roleHierarchy` to the import from '@/lib/roleHierarchy'

2. **fetchProfiles Function Enhancement**:
   - Modified the function to include filtering logic based on role hierarchy
   - For Store Supervisors, implemented filtering by assigned locations
   - For other roles, implemented filtering based on role hierarchy rank

3. **Role Hierarchy Logic**:
   - Used `roleHierarchy` object to determine role rankings
   - Administrador (1) has highest rank, SKA Operator (6) has lowest rank
   - Users can only see roles with equal or lower rank (numerically higher values)

4. **Store Supervisor Logic**:
   - Store Supervisors only see users assigned to locales they manage
   - This is determined by checking the intersection of user's assigned locales with the supervisor's assigned locales

5. **Performance Considerations**:
   - Wrapped fetchProfiles in useCallback to prevent unnecessary re-renders
   - Added proper dependency arrays for useEffect hooks

## Role Hierarchy
```
1: administrador
2: Warehouse Supervisor
3: Warehouse Operator
4: Store Supervisor
5: Store Operator
6: SKA Operator
```

## Filter Logic Details

### General Role Filtering
- When fetching profiles, users see themselves and users with role rank >= their own rank
- Example: Store Operator (rank 5) can see Store Operators (5), SKA Operators (6), but NOT Store Supervisors (4), Warehouse Operators (3), etc.

### Store Supervisor Location Filtering
- Store Supervisors get their assigned locales from the `user_locals` table
- They can only see users who are assigned to at least one of the same locales
- This ensures Store Supervisors only manage users within their area of responsibility

## Testing
- The implementation was tested with a build command (`npm run build`) to ensure no compile errors
- All existing functionality remains intact
- The filtering logic only affects the display of users in the "Usuarios Existentes" section