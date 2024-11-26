import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Code2, Database, GitBranch, Server } from "lucide-react";

export default function About() {
  const skills = {
    languages: ["Java", "TypeScript", "JavaScript", "Python", "C++", "SQL"],
    technologies: ["Spring Boot", "React.js", "Node.js", "Express.js", "Next.js", "GraphQL", "REST"],
    cloud: ["AWS", "PCF", "Docker", "Jenkins", "GitHub Actions", "Microservices"],
    databases: ["PostgreSQL", "MongoDB", "Redis", "MySQL"]
  };

  const experience = [
    {
      title: "Software Engineer II",
      company: "JPMorgan Chase & Co.",
      period: "Jan 2023 - Present",
      description: "Leading development of enterprise applications using Java Spring Boot and React."
    },
    {
      title: "Software Engineer",
      company: "JPMorgan Chase & Co.",
      period: "Feb 2021 - Jan 2023",
      description: "Developed and maintained enterprise applications in an Agile environment."
    },
    {
      title: "Software Engineer Intern",
      company: "JPMorgan Chase & Co.",
      period: "Jun 2020 - Aug 2020",
      description: "Developed a full-stack application for a non-profit organization."
    }
  ];

  const education = [
    {
      degree: "Bachelor of Science in Computer Science",
      school: "University of Houston",
      period: "2017 - 2020",
      activities: "IEEE, CougarCS"
    }
  ];

  const certifications = [
    {
      name: "AWS Certified Cloud Practitioner",
      issuer: "Amazon Web Services (AWS)",
      issued: "Nov 2022",
      expires: "Nov 2025"
    }
  ];

  return (
    <div className="flex flex-col items-center">
      <div className="w-full">
        <h1 className="text-4xl font-bold mb-8 text-center">About Me</h1>
        <div className="grid gap-8 md:grid-cols-2">
          <div>
            <h2 className="text-2xl font-semibold mb-4">Professional Experience</h2>
            {experience.map((job, index) => (
              <Card key={index} className="p-6 mb-4">
                <h3 className="font-semibold">{job.title}</h3>
                <p className="text-primary">{job.company}</p>
                <p className="text-sm text-muted-foreground mb-2">{job.period}</p>
                <p className="text-muted-foreground">{job.description}</p>
              </Card>
            ))}
            
            <h2 className="text-2xl font-semibold mb-4">Education</h2>
            {education.map((edu, index) => (
              <Card key={index} className="p-6 mb-4">
                <h3 className="font-semibold">{edu.degree}</h3>
                <p className="text-muted-foreground">{edu.school}</p>
                <p className="text-sm text-muted-foreground">{edu.period}</p>
                <p className="text-sm text-muted-foreground">Activities: {edu.activities}</p>
              </Card>
            ))}

            <h2 className="text-2xl font-semibold mb-4">Certifications</h2>
            {certifications.map((cert, index) => (
              <Card key={index} className="p-6 mb-4">
                <h3 className="font-semibold">{cert.name}</h3>
                <p className="text-muted-foreground">{cert.issuer}</p>
                <p className="text-sm text-muted-foreground">Issued: {cert.issued} · Expires: {cert.expires}</p>
              </Card>
            ))}
          </div>
          <div>
            <h2 className="text-2xl font-semibold mb-4">Technical Skills</h2>
            <div className="grid gap-4">
              <Card className="p-6">
                <div className="flex items-center mb-3">
                  <Code2 className="h-5 w-5 mr-2 text-primary" />
                  <h3 className="font-semibold">Programming Languages</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {skills.languages.map((skill) => (
                    <Badge key={skill} variant="secondary">{skill}</Badge>
                  ))}
                </div>
              </Card>
              <Card className="p-6">
                <div className="flex items-center mb-3">
                  <Server className="h-5 w-5 mr-2 text-primary" />
                  <h3 className="font-semibold">Technologies & Frameworks</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {skills.technologies.map((skill) => (
                    <Badge key={skill} variant="secondary">{skill}</Badge>
                  ))}
                </div>
              </Card>
              <Card className="p-6">
                <div className="flex items-center mb-3">
                  <GitBranch className="h-5 w-5 mr-2 text-primary" />
                  <h3 className="font-semibold">Cloud & DevOps</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {skills.cloud.map((skill) => (
                    <Badge key={skill} variant="secondary">{skill}</Badge>
                  ))}
                </div>
              </Card>
              <Card className="p-6">
                <div className="flex items-center mb-3">
                  <Database className="h-5 w-5 mr-2 text-primary" />
                  <h3 className="font-semibold">Databases</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {skills.databases.map((skill) => (
                    <Badge key={skill} variant="secondary">{skill}</Badge>
                  ))}
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}