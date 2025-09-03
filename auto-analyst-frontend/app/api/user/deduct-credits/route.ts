import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import redis, { KEYS } from '@/lib/redis'
import { CreditConfig } from '@/lib/credits-config'

export async function POST(request: NextRequest) {
  try {
    // Get the user token to verify authorization
    const token = await getToken({ req: request })
    if (!token?.sub) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = token.sub
    const body = await request.json()
    const { credits = 1, description = 'Chat usage' } = body
    
    // Get current credit data
    const creditsHash = await redis.hgetall(KEYS.USER_CREDITS(userId))
    
    if (!creditsHash || !creditsHash.total) {
      const defaultCredits = 20
      await redis.hset(KEYS.USER_CREDITS(userId), {
        total: '20',
        used: '0',
        resetDate: CreditConfig.getNextResetDate(),
        lastUpdate: new Date().toISOString()
      })
       return NextResponse.json({
        success: true,
        remaining: 20,
        deducted: 0
      })
     }
      // No credits for users without subscription - require upgrade
    //   return NextResponse.json({
    //     success: false,
    //     error: 'UPGRADE_REQUIRED',
    //     message: 'Please start your trial or upgrade your plan to continue.',
    //     remaining: 0,
    //     needsUpgrade: true
    //   }, { status: 402 }) // Payment Required status code
    // 
   

    // Calculate new used amount
    const total = parseInt(creditsHash.total as string)
    const currentUsed = creditsHash.used ? parseInt(creditsHash.used as string) : 0
    const remaining = total - currentUsed
    
    // Check if user has enough credits
    if (remaining < credits) {
      return NextResponse.json({
        success: false,
        error: 'INSUFFICIENT_CREDITS',
        message: 'Not enough credits remaining. Please upgrade your plan.',
        remaining: remaining,
        required: credits,
        needsUpgrade: true
      }, { status: 402 }) // Payment Required status code
    }
    
    const newUsed = currentUsed + credits
    
    // Update the credits hash
    await redis.hset(KEYS.USER_CREDITS(userId), {
      used: newUsed.toString(),
      lastUpdate: new Date().toISOString()
    })
    
    console.log(`Deducted ${credits} credits for user ${userId}. Remaining: ${total - newUsed}`)
    
    // Return updated credit information
    return NextResponse.json({
      success: true,
      remaining: total - newUsed,
      deducted: credits,
      description
    })
  } catch (error: any) {
    console.error('Error deducting credits:', error)
    return NextResponse.json({ error: error.message || 'Failed to deduct credits' }, { status: 500 })
  }
} 
