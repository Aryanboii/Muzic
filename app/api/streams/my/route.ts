import { prismaClient } from "@/app/lib/db";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";



export async function GET(req: NextRequest){
    const session = await getServerSession();          // get users details on the backend
     
    
    const user = await prismaClient.user.findFirst({
        where:{
            email: session?.user?.email ?? ""
        }
    })
        


    if(!user){
        return NextResponse.json({
            message: "Unauthenticated"
        },{
            status: 403
        }
    )};

    const streams = await prismaClient.stream.findMany({
  where: {
    UserID: user.id
  },
  include: {
    _count: {
      select: {
        upvotes: true
      }
    }
  }
});

return NextResponse.json({
  streams: streams.map(({ _count, ...rest }) => ({
    ...rest,
    upvotes: _count.upvotes
  }))
});

}