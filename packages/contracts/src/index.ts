import { z } from "zod";
// Shared contract used by api, web and mobile.
export const CreateUsageOrder = z.object({
  vehicleId: z.string().uuid(),
  driverId: z.string().uuid(),
  destination: z.string().min(1),
  purpose: z.string().min(1),
  startMileage: z.number().int().nonnegative(),
});
export type CreateUsageOrder = z.infer<typeof CreateUsageOrder>;
