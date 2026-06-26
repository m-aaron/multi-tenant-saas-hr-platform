import { type ZodType } from "zod";

export interface ValidationConfig {
    body?: ZodType<any>;
    query?: ZodType<any>;
    params?: ZodType<any>;
}