"use client";

import { Card } from "@/components/ui/card";
import { Navigation } from "@/components/ui/navigation";
import { TooltipTrigger, Tooltip, TooltipContent } from "@/components/ui/tooltip";
import { useNavigation } from "@/hooks/useNavigation";
import { UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { Settings } from "../setting/setting";

const DesktopNav = () => {

    const path = useNavigation();


    return (
        <Card className="hidden sm:flex bg-background sm:flex-col sm:justify-between sm:items-center sm:h-screen sm:w-14  sm:pt-0 sm:py-4">
            <nav className="w-full">
                <ul className="flex flex-col items-center gap-4 w-full">{
                    path.map((path, id) => (
                        <li key={id} className="relative w-[80%]">
                            <Link href={path.href}>
                                <Tooltip>
                                    <TooltipTrigger>
                                        <Navigation size="icon" variant={path.active ? "default" : "outline"}>
                                            {path.icon && <path.icon />}
                                        </Navigation>
                                    </TooltipTrigger>
                                    <TooltipContent>{path.name}</TooltipContent>
                                </Tooltip>
                            </Link>
                        </li>
                    ))
                }</ul>
            </nav>

            <div className="flex flex-col item-center gap-4 justify-center ">
                <Settings/>
                <UserButton />
            </div>
        </Card>
    );
}

export default DesktopNav;
