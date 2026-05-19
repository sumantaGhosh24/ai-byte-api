import { z } from "zod";

export const deleteImageSchema = z.object({ public_id: z.string().min(1) });
