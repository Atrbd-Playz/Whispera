"use client";

import { Navigation } from "@/components/ui/navigation";
import { Card } from "@/components/ui/card";
import { TooltipTrigger, Tooltip, TooltipContent } from "@/components/ui/tooltip";
import { useChat } from "@/hooks/useChat";
import { useNavigation } from "@/hooks/useNavigation";
import Link from "next/link";
import { Settings } from "../setting/setting";
import { UserButton } from "@clerk/nextjs";

const MobileNav = () => {
  const path = useNavigation();

  if (useChat().isActive) return null;

  return (
    <Card className="fixed bottom-0 rounded-lg w-full z-30 flex items-center p-2 sm:hidden dark:bg-zinc-800">
      <nav className="w-full">
        <ul className="flex justify-around items-center">
          {path.map((path, id) => (
            <li key={id} className="relative">
              <Link href={path.href}>
                <Tooltip>
                  <TooltipTrigger>
                    <Navigation size="icon" variant={path.active ? "mobilenav" : "mobile_nav_outline"}>
                      {path.icon && <path.icon />}
                    </Navigation>
                  </TooltipTrigger>
                  <TooltipContent>{path.name}</TooltipContent>
                </Tooltip>
              </Link>
            </li>
          ))}
          <li className="flex flex-col item-center gap-4">
            <Settings/>
          </li>
          <li className="flex flex-col item-center gap-4">
            <UserButton/>
          </li>
        </ul>
      </nav>
    </Card>
  );
};

export default MobileNav;