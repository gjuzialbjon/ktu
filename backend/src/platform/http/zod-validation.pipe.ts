import { BadRequestException, type PipeTransform } from '@nestjs/common';
import type { z } from 'zod';

/**
 * Validates and parses a request part with a zod schema:
 * `@Body(new ZodValidationPipe(createEventBody)) body: CreateEventBody`.
 * The schemas live with the module (`http/*.dto.ts`) or in @ktu/shared when the app uses them too.
 */
export class ZodValidationPipe<S extends z.ZodType> implements PipeTransform<unknown, z.infer<S>> {
  constructor(private readonly schema: S) {}

  transform(value: unknown): z.infer<S> {
    const result = this.schema.safeParse(value);
    if (result.success) return result.data;
    throw new BadRequestException({
      code: 'validation_failed',
      message: 'Some fields are missing or invalid.',
      details: result.error.issues.map((i) => ({ path: i.path.join('.'), message: i.message })),
    });
  }
}
