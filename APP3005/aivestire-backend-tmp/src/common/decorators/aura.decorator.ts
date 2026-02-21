import { SetMetadata } from '@nestjs/common';
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * Decorator to require Aura validation
 * Apply to controller methods that need Aura
 */
export const RequireAura = () => SetMetadata('requireAura', true);

/**
 * Parameter decorator to extract Aura from request
 * Use after @RequireAura() guard has validated and attached Aura
 */
export const CurrentAura = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.aura;
  },
);
