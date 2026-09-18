import { z } from "zod";
import { ACTIVITY_ACTIONS, ACTIVITY_ENTITY_TYPES } from "@/lib/constants/activity";
import { uuidField } from "./common";

const dateParam = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .optional()
  .catch(undefined);

/** FR-M11-02 filters. Invalid values are dropped instead of failing the page. */
export const activityListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1).catch(1),
  entity_type: z.enum(ACTIVITY_ENTITY_TYPES).optional().catch(undefined),
  action: z.enum(ACTIVITY_ACTIONS).optional().catch(undefined),
  actor: uuidField.optional().catch(undefined),
  from: dateParam,
  to: dateParam,
});

export type ActivityListQuery = z.infer<typeof activityListQuerySchema>;
