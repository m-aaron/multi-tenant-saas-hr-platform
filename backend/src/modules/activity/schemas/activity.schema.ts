import { z } from 'zod';

import { ACTIVITY_EVENTS, type ActivityEvent } from '../constants/activity.constant.js';

const activityEventSchema = z.enum(
    Object.values(ACTIVITY_EVENTS) as [ActivityEvent, ...ActivityEvent[]],
    {
        message: 'Invalid activity event type.',
    },
);

export const createActivityLogSchema = z.object({
    organizationId: z
        .uuid('Invalid organization ID.'),

    actorId: z
        .uuid('Invalid actor ID.')
        .optional()
        .nullable(),

    eventType: activityEventSchema,
    
    metadata: z
        .record(z.string(), z.unknown())
        .default({}),
});


export const listActivityLogsQuerySchema = z.object({
    page: z.coerce
        .number()
        .int('Page must be an integer.')
        .min(1, 'Page must be at least 1.')
        .default(1),

    limit: z.coerce
        .number()
        .int('Limit must be an integer.')
        .min(1, 'Limit must be at least 1.')
        .max(100, 'Limit must not exceed 100.')
        .default(20),
});


export type CreateActivityLogInput = z.infer<typeof createActivityLogSchema>;
export type ListActivityLogsQuery = z.infer<typeof listActivityLogsQuerySchema>;
