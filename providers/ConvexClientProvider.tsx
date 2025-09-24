"use client";

import React from "react";
import { ClerkProvider, useAuth } from "@clerk/nextjs";
import { ConvexReactClient } from "convex/react";
import { Authenticated, AuthLoading } from "convex/react";  // ✅ from convex/react
import { ConvexProviderWithClerk } from "convex/react-clerk"; // ✅ from convex/react-clerk
import LodingLogo from "@/components/shared/LodingLogo";
import { AnimatePresence, motion } from "framer-motion";

type Props = {
  children: React.ReactNode;
};

const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL || "";
const convex = new ConvexReactClient(CONVEX_URL);

const ConvexClientProvider = ({ children }: Props) => (
  <ClerkProvider>
    <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
  <AnimatePresence initial={false}>
        {/* Show children when authenticated */}
        <Authenticated key="auth">
          {children}
        </Authenticated>

        {/* Smooth loading transition */}
        <AuthLoading key="loading">
          <motion.div
            className="flex items-center justify-center h-full"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            <LodingLogo />
          </motion.div>
        </AuthLoading>

      </AnimatePresence>
    </ConvexProviderWithClerk>
  </ClerkProvider>
);

export default ConvexClientProvider;
