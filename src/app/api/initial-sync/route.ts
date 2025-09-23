import { Account } from "@/lib/account";
import { db } from "@/server/db";
import { NextResponse, type NextRequest } from "next/server";

export const POST = async (req: NextRequest) => {
    const body = await req.json()
    const {accountId, userId} = body
    if(!accountId || !userId) {
        return NextResponse.json({error: 'Missing account or user id'}, {status: 400})
    }

    const dbAccount = await db.account.findUnique({
        where: {
            id: accountId,
            userId
        }
    })
    if(!dbAccount) return NextResponse.json({error: 'Account not found'}, {status: 404})

    const account = new Account(dbAccount.accessToken)
    
    const response = await account.performInitialSync()
    if(!response){
        return NextResponse.json({error: 'Failed to perform initial sync'}, {status: 500})
    }

    const {emails, deltaToken} = response
    console.log('emails', emails)
    // await db.account.update({
    //     where: {
    //         id: accountId
    //     },
    //     data: {
    //         nextDeltaToken:  deltaToken
    //     }
    // })
    console.log('Sync completed')
    return NextResponse.json({success: true}, {status: 200})
}