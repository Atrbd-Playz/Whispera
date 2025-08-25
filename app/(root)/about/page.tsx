import React from "react";
import { FaReact } from "react-icons/fa";
import { SiNextdotjs, SiTypescript, SiTailwindcss, SiVercel, SiShadcnui, SiClerk } from "react-icons/si";

const techStack = [
    { name: "Next.js", url: "https://nextjs.org/", icon: <SiNextdotjs className="text-black text-4xl mb-2" /> },
    { name: "TypeScript", url: "https://www.typescriptlang.org/", icon: <SiTypescript className="text-blue-600 text-4xl mb-2" /> },
    { name: "React", url: "https://react.dev/", icon: <FaReact className="text-cyan-500 text-4xl mb-2" /> },
    { name: "Tailwind CSS", url: "https://tailwindcss.com/", icon: <SiTailwindcss className="text-teal-400 text-4xl mb-2" /> },
    { name: "Vercel", url: "https://vercel.com/", icon: <SiVercel className="text-black text-4xl mb-2" /> },
    { name: "ShadCN", url: "https://ui.shadcn.com/", icon: <SiShadcnui className="text-gray-800 text-4xl mb-2" /> },
    { name: "Clerk", url: "https://clerk.com/", icon: <SiClerk className="text-indigo-600 text-4xl mb-2" /> },
];

export default function AboutPage() {
    return (
        <main className="max-w-xl mx-auto py-12 px-6 overflow-y-auto w-full">
            <section className="bg-yellow-100 border-l-4 border-yellow-500 p-4 rounded mb-8">
                <h2 className="text-xl font-semibold text-yellow-800 mb-2">⚠️ Warning</h2>
                <p className="text-yellow-700">
                    This is a half-baked project and is not finished yet. Features may be incomplete or unstable.
                </p>
            </section>

            <section>
                <h1 className="text-3xl font-bold mb-4">About Whispera</h1>
                <p className="mb-6 text-gray-600">
                    Whispera is an experimental project built to explore modern web technologies. Please note that the project is still under development.
                </p>

                <h2 className="text-xl font-semibold mb-3">Main Technologies Used</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
                    {techStack.map((tech) => (
                        <div
                            key={tech.name}
                            className="bg-white border rounded-lg shadow-sm flex flex-col items-center p-4 hover:shadow-md transition"
                        >
                            <a
                                href={tech.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex flex-col items-center"
                            >
                                {tech.icon}
                                <span className="mt-2 text-base font-medium text-gray-800 text-center hover:underline">
                                    {tech.name}
                                </span>
                            </a>
                        </div>
                    ))}
                </div>
            </section>
        </main>
    );
}