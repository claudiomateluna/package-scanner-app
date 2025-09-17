// Script para diagnosticar la búsqueda de tickets
// Este script se puede ejecutar en el cliente o en un endpoint de API para verificar los datos

import { createClient } from '@supabase/supabase-js'

// Configura tu cliente de Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Faltan las variables de entorno de Supabase')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function diagnosticarTicket(ticketId) {
  console.log(`Diagnosticando ticket: ${ticketId}`)
  console.log('========================')
  
  try {
    // Verificar en la tabla de faltantes
    console.log('1. Buscando en tabla faltantes...')
    const { data: faltantesData, error: faltantesError } = await supabase
      .from('faltantes')
      .select('*')
      .eq('ticket_id', ticketId)
    
    if (faltantesError) {
      console.error('Error en búsqueda de faltantes:', faltantesError)
    } else {
      console.log(`Faltantes encontrados: ${faltantesData?.length || 0}`)
      if (faltantesData && faltantesData.length > 0) {
        console.log('Primer registro de faltantes:', JSON.stringify(faltantesData[0], null, 2))
      }
    }
    
    // Verificar en la tabla de rechazos
    console.log('\n2. Buscando en tabla rechazos...')
    const { data: rechazosData, error: rechazosError } = await supabase
      .from('rechazos')
      .select('*')
      .eq('ticket_id', ticketId)
    
    if (rechazosError) {
      console.error('Error en búsqueda de rechazos:', rechazosError)
    } else {
      console.log(`Rechazos encontrados: ${rechazosData?.length || 0}`)
      if (rechazosData && rechazosData.length > 0) {
        console.log('Primer registro de rechazos:', JSON.stringify(rechazosData[0], null, 2))
      }
    }
    
    // Verificar si hay registros en las tablas
    console.log('\n3. Verificando existencia de registros...')
    const { count: faltantesCount, error: countFaltantesError } = await supabase
      .from('faltantes')
      .select('*', { count: 'exact', head: true })
    
    if (countFaltantesError) {
      console.error('Error contando faltantes:', countFaltantesError)
    } else {
      console.log(`Total de registros en faltantes: ${faltantesCount}`)
    }
    
    const { count: rechazosCount, error: countRechazosError } = await supabase
      .from('rechazos')
      .select('*', { count: 'exact', head: true })
    
    if (countRechazosError) {
      console.error('Error contando rechazos:', countRechazosError)
    } else {
      console.log(`Total de registros en rechazos: ${rechazosCount}`)
    }
    
    // Mostrar algunos registros de ejemplo
    console.log('\n4. Mostrando registros de ejemplo...')
    const { data: sampleFaltantes, error: sampleFaltantesError } = await supabase
      .from('faltantes')
      .select('ticket_id')
      .limit(5)
    
    if (sampleFaltantesError) {
      console.error('Error obteniendo muestra de faltantes:', sampleFaltantesError)
    } else if (sampleFaltantes && sampleFaltantes.length > 0) {
      console.log('Muestra de ticket_ids en faltantes:')
      sampleFaltantes.forEach((item, index) => {
        console.log(`  ${index + 1}. ${item.ticket_id}`)
      })
    }
    
    const { data: sampleRechazos, error: sampleRechazosError } = await supabase
      .from('rechazos')
      .select('ticket_id')
      .limit(5)
    
    if (sampleRechazosError) {
      console.error('Error obteniendo muestra de rechazos:', sampleRechazosError)
    } else if (sampleRechazos && sampleRechazos.length > 0) {
      console.log('Muestra de ticket_ids en rechazos:')
      sampleRechazos.forEach((item, index) => {
        console.log(`  ${index + 1}. ${item.ticket_id}`)
      })
    }
    
  } catch (error) {
    console.error('Error general en diagnóstico:', error)
  }
}

// Ejecutar diagnóstico con un ticket ID específico
const ticketIdToTest = process.argv[2] || 'RTL000000001'
diagnosticarTicket(ticketIdToTest)