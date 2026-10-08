import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST() {
  try {
    const cookieStore = cookies();
    cookieStore.delete('auth_session');
    return NextResponse.json({ success: true, message: 'Sesión cerrada exitosamente' });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Error cerrando sesión' }, { status: 500 });
  }
}
