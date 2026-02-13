import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { logError, handleApiError } from '@/lib/error-handler'

// GET - Get all quick codes
export async function GET() {
  try {
    await requireAuth()
    
    const codes = await prisma.quickCode.findMany({
      orderBy: {
        code: 'asc'
      }
    })
    
    return NextResponse.json({ data: codes })
  } catch (error) {
    logError(error, 'Quick Codes API')
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const { error: errorMessage, status: errorStatus } = handleApiError(error, 'Quick Codes API')
    return NextResponse.json({ error: errorMessage }, { status: errorStatus })
  }
}

