import { z } from "zod";

export const deleteFileSchema = z.object({ public_id: z.string().min(1) });
