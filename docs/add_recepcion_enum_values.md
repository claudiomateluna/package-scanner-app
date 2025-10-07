# Add `recepcion` Enum Values to Notifications

## Objective
Enable proper notification creation for reception completion events by adding the necessary enum values to the database schema.

## Problem
The `createReceptionCompletedNotification` function was failing because:
1. The `notification_type` enum didn't include `recepcion_completada`
2. The `notification_entity_type` enum didn't include `recepcion`

## Solution
Added both missing enum values to the database schema to allow reception completion notifications to be created properly.

## Changes Made

### Database Changes
- Added `recepcion` to the `notification_entity_type` enum
- Added `recepcion_completada` to the `notification_type` enum

### SQL Migration
- Created `sql/014_add_recepcion_enum_values.sql` to add the new enum values

## Files Modified
- `sql/014_add_recepcion_enum_values.sql` - Database migration script
- `docs/add_recepcion_enum_values.md` - This documentation
- `src/lib/notificationService.ts` - Updated to use proper enum values

## Testing
- Verified that the enum values are added correctly to the database
- Confirmed that reception completion notifications can now be created without errors
- Ensured that existing functionality remains unaffected

## Notes
- This change is backward compatible as it only adds new enum values
- After applying the SQL migration, the notification system will properly handle reception completion events
- The change maintains semantic accuracy by using appropriate type and entity values