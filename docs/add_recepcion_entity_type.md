# Add `recepcion` Entity Type to Notifications

## Objective
Allow the application to send notifications for reception completion events.

## Problem
The `createReceptionCompletedNotification` function was failing because the `notification_entity_type` enum did not include a `recepcion` value, causing an error when trying to insert notifications related to reception completion.

## Solution
Added the `recepcion` value to the `notification_entity_type` enum and added `recepcion_completada` to the `notification_type` enum to properly support reception completion notifications.

## Changes Made

### Database Changes
- Updated `notification_entity_type` enum to include `recepcion`
- Updated `notification_type` enum to include `recepcion_completada`

### SQL Migration
- Created `sql/014_add_recepcion_entity_type.sql` to add the new enum values

## Files Modified
- `sql/014_add_recepcion_entity_type.sql` - Database migration script
- `docs/add_recepcion_entity_type.md` - This documentation

## Testing
- Verified the notification service can now create reception completion notifications without errors
- Confirmed that reception completion workflow works as expected

## Notes
- This change is backward compatible as it only adds new enum values
- Existing functionality remains unaffected