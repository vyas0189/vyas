"use client";

import { Card } from "@/components/ui/card";
import { Cloud, Laptop, ServerIcon } from "lucide-react";

export function Skills() {
  return (
    <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3 w-full">
      <Card className="p-6">
        <div className="mb-4 flex justify-center">
          <Laptop className="h-8 w-8 text-primary" />
        </div>
        <h3 className="font-semibold text-lg mb-2">Full Stack Development</h3>
        <p className="text-muted-foreground">
          Expertise in Java, TypeScript, and React for building enterprise-scale applications.
        </p>
      </Card>
      <Card className="p-6">
        <div className="mb-4 flex justify-center">
          <Cloud className="h-8 w-8 text-primary" />
        </div>
        <h3 className="font-semibold text-lg mb-2">Cloud & DevOps</h3>
        <p className="text-muted-foreground">
          AWS Certified Cloud Practitioner with experience in PCF, Docker, and CI/CD pipelines.
        </p>
      </Card>
      <Card className="p-6">
        <div className="mb-4 flex justify-center">
          <ServerIcon className="h-8 w-8 text-primary" />
        </div>
        <h3 className="font-semibold text-lg mb-2">Backend Development</h3>
        <p className="text-muted-foreground">
          Building robust microservices and APIs using Java Spring Boot and modern best practices.
        </p>
      </Card>
    </div>
  );
}