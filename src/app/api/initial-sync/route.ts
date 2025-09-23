import { Account } from "@/lib/account";
import { db } from "@/server/db";
import { NextResponse, type NextRequest } from "next/server";

export const POST = async (req: NextRequest) => {
    const {accountId, userId} = await req.json()
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
    
    const emails = await performInitialSync()
    await syncEmailsToDatabase(emails)
}