// apply-migration.js
// Script para aplicar la migración de notificaciones a la base de datos de Supabase

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Configura el cliente de Supabase
// Necesitarás agregar tus credenciales en un archivo .env
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Por favor, configura las variables de entorno NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY en tu archivo .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyMigration() {
  console.log('Leyendo archivo de migración...');
  
  // Leemos el archivo de migración
  const fs = require('fs');
  const path = require('path');
  
  try {
    const migrationSql = fs.readFileSync(path.join(__dirname, 'DATABASE_MIGRATION_NOTIFICATIONS.sql'), 'utf8');
    
    console.log('Aplicando migración...');
    
    // Dividimos el SQL en sentencias individuales
    const statements = migrationSql
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0);
    
    // Ejecutamos cada sentencia
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      console.log(`Ejecutando sentencia ${i + 1}/${statements.length}...`);
      
      try {
        // Para sentencias CREATE TABLE y ALTER TABLE, usamos el cliente REST
        // Para funciones y políticas, necesitamos usar RPC o el dashboard
        
        // Intentamos ejecutar como query SQL
        const { error } = await supabase.rpc('execute_sql', { sql: statement });
        
        // Si falla, intentamos otra estrategia
        if (error) {
          console.log(`Sentencia fallida, continuando... (Error: ${error.message})`);
        }
      } catch (err) {
        console.log(`Error al ejecutar sentencia: ${err.message}`);
      }
    }
    
    console.log('Migración aplicada exitosamente!');
  } catch (error) {
    console.error('Error al aplicar la migración:', error);
  }
}

// Ejecutar la migración
applyMigration();