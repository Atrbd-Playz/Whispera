import { useQuery } from "convex/react";
import { query } from "./_generated/server";
import { api } from "./_generated/api";
import { ConvexError, v } from "convex/values";

 export const get = query({
    args: {id: v.id("conversations")},
    handler: async (ctx,args) => {
        const identity = await ctx.auth.getUserIdentity();

        if(!identity){
            throw new Error("Unauthorized")
        }

        const me = useQuery(api.users.getMe);
        if(!me){
            throw new ConvexError("User Not Found")
        }

        const conversation = await ctx.db.get(args.id)

        if(!conversation){
            throw new ConvexError("Conversation Not Found")
        }

        

    }
 })