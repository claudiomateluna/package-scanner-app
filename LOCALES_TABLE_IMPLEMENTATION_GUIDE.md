# Locales Table Implementation Guide

## Overview
This document explains how to implement and use a separate `locales` table that references the `Local` column in the `data` table. This implementation provides better data normalization, improved filtering capabilities, and enhanced reporting features.

## Benefits of the Locales Table

1. **Data Integrity**: Ensures consistency in local names across the system
2. **Easy Filtering**: Provides clean filtering by local type or name
3. **Maintainability**: Easier to update local information in one place
4. **Reporting**: Better reporting capabilities by local type
5. **Performance**: Can improve query performance with proper indexing

## Implementation Steps

### 1. Create the Locales Table
Run the migration script `LOCALES_TABLE_MIGRATION.sql` to create the table:

```sql
CREATE TABLE IF NOT EXISTS locales (
  id SERIAL PRIMARY KEY,
  tipo_local VARCHAR(3) NOT NULL CHECK (tipo_local IN ('FRA', 'RTL', 'SKA', 'WHS')),
  nombre_local VARCHAR(50) NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### 2. Populate the Table
Extract and categorize existing local data from the `data` table:

```sql
-- If your local names follow a pattern:
INSERT INTO locales (tipo_local, nombre_local)
SELECT 
  CASE 
    WHEN "Local" LIKE '%_FRA_%' THEN 'FRA'
    WHEN "Local" LIKE '%_RTL_%' THEN 'RTL'
    WHEN "Local" LIKE '%_SKA_%' THEN 'SKA'
    WHEN "Local" LIKE '%_WHS_%' THEN 'WHS'
    ELSE 'RTL' -- default to retail
  END as tipo_local,
  "Local" as nombre_local
FROM (SELECT DISTINCT "Local" FROM data WHERE "Local" IS NOT NULL) as unique_locals
ON CONFLICT (nombre_local) DO NOTHING;
```

### 3. Update Foreign Key References (Optional)
Add foreign key constraints to maintain referential integrity:

```sql
ALTER TABLE data ADD CONSTRAINT fk_data_local FOREIGN KEY ("Local") REFERENCES locales(nombre_local);
ALTER TABLE recepciones_completadas ADD CONSTRAINT fk_recepciones_local FOREIGN KEY (local) REFERENCES locales(nombre_local);
```

## Local Types

The system supports four types of locals:

1. **FRA** - Franchise stores
2. **RTL** - Retail stores
3. **SKA** - Skape stores (specialized skate shops)
4. **WHS** - Wholesale stores

## Updated Components

### SelectionScreenWithLocales.tsx
This updated component provides:
- Filtering by local type
- Better display of local information with type indicators
- Improved user experience with categorized locals

### ReceptionStatisticsWithLocales.tsx
This updated component provides:
- Advanced filtering by local type and name
- Enhanced statistics display with type-based grouping
- Better reporting capabilities

## Database Queries

### Get All Locals
```sql
SELECT tipo_local, nombre_local FROM locales ORDER BY tipo_local, nombre_local;
```

### Get Locals by Type
```sql
SELECT nombre_local FROM locales WHERE tipo_local = 'FRA' ORDER BY nombre_local;
```

### Get Statistics by Local Type
This would require a custom PostgreSQL function or a complex query that joins the locales table with reception data.

## Migration Process

1. **Backup**: Always backup your database before making structural changes
2. **Create Table**: Run the migration script to create the locales table
3. **Populate Data**: Extract and insert data from existing tables
4. **Update Components**: Replace or update components to use the new table
5. **Test**: Verify that all functionality works correctly
6. **Deploy**: Deploy the changes to production

## Considerations

### Performance
- Indexes on `tipo_local` and `nombre_local` columns improve query performance
- Foreign key constraints help maintain data integrity but may impact insert performance

### Data Migration
- Ensure all existing local names in the `data` table are present in the `locales` table
- Handle any discrepancies in local naming conventions

### Backward Compatibility
- The updated components maintain the same interface as the original ones
- Existing data and functionality should continue to work without changes

## Future Enhancements

1. **Additional Local Information**: Add address, contact information, etc.
2. **Regional Grouping**: Add regions or zones for better organization
3. **Active Status**: Track whether a local is currently active
4. **Custom Attributes**: Add custom attributes for different local types

## Testing

Before deploying to production, test:
1. Data migration accuracy
2. Component functionality with the new table
3. Performance impact
4. User experience with the new filtering options

## Support

For implementation questions or issues, consult the development team or refer to the existing code examples in the repository.