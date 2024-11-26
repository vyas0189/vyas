"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User } from "lucide-react";

export function ProfileImage() {
  return (
    <div className="relative">
      <Avatar className="h-32 w-32 border-4 border-primary shadow-lg">
        <AvatarImage
          src="/profile.jpeg"
          alt="Vyas Ramankulangara"
          className="object-cover"
        />
        <AvatarFallback>
          <User className="h-16 w-16" />
        </AvatarFallback>
      </Avatar>
    </div>
  );
}