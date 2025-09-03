import { NextResponse } from 'next/server'

export async function DELETE(request: Request) {
  const { id } = await request.json()

  // Simplemente registrar la llamada para fines de depuración
  console.log('Llamada DELETE recibida en API de prueba con ID:', id)
  
  // Devolver una respuesta de éxito para pruebas
  return NextResponse.json({ 
    message: 'Llamada DELETE recibida correctamente', 
    receivedId: id 
  })
}