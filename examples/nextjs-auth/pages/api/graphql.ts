import { createServer } from '@graphql-yoga/node'
import type { NextApiRequest, NextApiResponse } from 'next'
import type { Session } from 'next-auth'
import  { getServerSession } from "next-auth/next"
import  { authOptions } from './api/auth/[...nextauth]'
 
export const config = {
  api: {
    // Disable body parsing (required for file uploads)
    bodyParser: false
  }
}
 
export default createServer<
  {
    req: NextApiRequest
    res: NextApiResponse
  },
  {
    session: Session | null
  }
>({
  context: async ({ req,res }) => {
    
    return { session: await getServerSession(req,res,authOptions)}
    
  }
})
