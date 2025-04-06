import { NextResponse } from 'next/server'
import { getRefundSummary } from '@/services/order/complete/getOrdersWithProducts'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const orderId = searchParams.get('orderId')

    if (!orderId) {
      return NextResponse.json(
        { error: 'Order ID is required' },
        { status: 400 }
      )
    }

    // Convert orderId to number and validate
    const orderIdNum = parseInt(orderId)
    if (isNaN(orderIdNum)) {
      return NextResponse.json(
        { error: 'Invalid order ID format' },
        { status: 400 }
      )
    }

    const refundSummary = await getRefundSummary(orderIdNum)
    
    return NextResponse.json({
      success: true,
      data: refundSummary
    })
  } catch (error) {
    console.error('Error processing refund summary request:', error)
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Internal server error'
      },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { orderId } = body

    if (!orderId) {
      return NextResponse.json(
        { error: 'Order ID is required in request body' },
        { status: 400 }
      )
    }

    // Convert orderId to number and validate
    const orderIdNum = parseInt(orderId)
    if (isNaN(orderIdNum)) {
      return NextResponse.json(
        { error: 'Invalid order ID format' },
        { status: 400 }
      )
    }

    const refundSummary = await getRefundSummary(orderIdNum)
    
    return NextResponse.json({
      success: true,
      data: refundSummary
    })
  } catch (error) {
    console.error('Error processing refund summary request:', error)
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Internal server error'
      },
      { status: 500 }
    )
  }
} 