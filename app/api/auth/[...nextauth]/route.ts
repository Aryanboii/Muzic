import { prismaClient } from "@/app/lib/db";
import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";


const handler = NextAuth({
  // add providers code which is given by nextauth

    providers: [
      GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? ""
    })
],

secret: process.env.NEXTAUTH_SECRET ?? "yourStrongRandomSecretKey",

callbacks:{
async signIn(params){
  if(!params.user.email){
    return false;
  }


  try{
    await prismaClient.user.create({
         data:{
          email: params.user.email,
          provider: "Google"
         }
    })
  }
  catch(e){
    console.log(e);
    

  }

  return true
}
}


})

export {handler as GET , handler as POST}