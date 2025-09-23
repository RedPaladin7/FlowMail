import { type SyncUpdatedResponse, type SyncResponse, type EmailMessage } from "@/types"
import axios from "axios"

export class Account {
    private token: string 

    constructor(token: string) {
        this.token = token
    }

    private async startSync(){
        const response = await axios.post<SyncResponse>('https://api.aurinko.io/v1/email/sync', {}, {
            headers: {
                'Authorization': `Bearer ${this.token}`
            }, 
            params: {
                daysWithin: 5,
                bodyType: 'html'
            }
        })
        return response.data
    }

    async getUpdatedEmails({deltaToken, pageToken}: {deltaToken?: string, pageToken?: string}) {
        let params: Record<string, string> = {}
        if(deltaToken) params.deltaToken = deltaToken
        if(pageToken) params.pageToken = pageToken

        const response = await axios.get<SyncUpdatedResponse>('https://api.aurinko.io/v1/email/sync/updated', {
            headers: {
                Authorization: `Bearer ${this.token}`
            },
            params
        })
        return response.data
    }

    async performInitialSync() {
        try {
            let syncResponse = await this.startSync()
            while(!syncResponse.ready){
                await new Promise(resolve => setTimeout(resolve, 1000))
                syncResponse = await this.startSync()
            }

            let storedDeltaToken: string = syncResponse.syncUpdatedToken
            let updatedResposne = await this.getUpdatedEmails({deltaToken: syncResponse.syncUpdatedToken})

            if(updatedResposne.nextDeltaToken) {
                // sync has completed
                storedDeltaToken = updatedResposne.nextDeltaToken
            }
            let allEmails: EmailMessage[] = updatedResposne.records

            // fetch the rest of the pages if there are more
            while(updatedResposne.nextPageToken){
                updatedResposne = await this.getUpdatedEmails({pageToken: updatedResposne.nextPageToken
                })
                allEmails = allEmails.concat(updatedResposne.records)
                if(updatedResposne.nextDeltaToken){
                    storedDeltaToken = updatedResposne.nextDeltaToken
                }
            }

            console.log('Initial sync completed')
            // store the latest delta token for future incremental syncs

            return {
                emails: allEmails,
                deltaToken: storedDeltaToken
            }
        } catch (error) {
            if(axios.isAxiosError(error)){
                console.error('Error during sync: ', JSON.stringify(error.response?.data, null, 2))
            } else {
                console.error('Error during sync: ', error)
            }
        }
    }
}