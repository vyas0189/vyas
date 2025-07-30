"use client";

import { Button } from "@/components/ui/button";
import { Github, Linkedin, Mail } from "lucide-react";
import Link from "next/link";
import { ProfileImage } from "@/components/profile-image";

export function Hero() {
  return (
    <div className="flex flex-col items-center text-center">
      <div className="mb-8">
        <ProfileImage />
      </div>
      <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
        Hi, I'm <span className="text-primary">Vyas Ramankulangara</span>
      </h1>
      <p className="mt-6 text-xl text-muted-foreground max-w-2xl">
        Software Engineer II at JPMorgan Chase & Co. | Full Stack Developer | AWS Certified Cloud Practitioner
      </p>
      <div className="mt-8 flex gap-4">
        <Button asChild>
          <Link href="/contact">
            <Mail className="mr-2 h-4 w-4" />
            Contact Me
          </Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/about">Learn More</Link>
        </Button>
      </div>
      <div className="mt-6 flex gap-4">
        <Button variant="ghost" size="icon" asChild>
          <a href="https://github.com/vyas0189" target="_blank" rel="noopener noreferrer">
            <Github className="h-5 w-5" />
          </a>
        </Button>
        <Button variant="ghost" size="icon" asChild>
          <a href="https://www.linkedin.com/in/vyas0189/" target="_blank" rel="noopener noreferrer">
            <Linkedin className="h-5 w-5" />
          </a>
        </Button>
      </div>
    </div>
  );
}