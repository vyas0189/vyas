import { z } from "zod";

export const formSchema = z.object({
  name: z.string().min(2, "String must contain at least 2 character(s)").max(50),
  email: z.string().email("Invalid email"),
  message: z.string().min(10, "String must contain at least 10 character(s)").max(1000),
});
