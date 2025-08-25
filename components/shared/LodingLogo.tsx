"use client";

import Image from "next/image";
import { motion } from "framer-motion";

type Props = {
  size?: number;
};

const LodingLogo = ({ size = 100 }: Props) => {
  return (
    <div className="h-full w-full flex justify-center items-center">
      <motion.div
        initial={{ opacity: 0.6, scale: 0.95 }}
        animate={{
          opacity: [0.6, 1, 0.6],
          scale: [0.95, 1.05, 0.95],
        }}
        transition={{
          duration: 0.8,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        style={{ width: size, height: size }}
      >
        <Image
          src="/logo.svg"
          alt="Logo"
          fill
          sizes="auto"
          className="object-contain"
          priority
        />
      </motion.div>
    </div>
  );
};

export default LodingLogo;
