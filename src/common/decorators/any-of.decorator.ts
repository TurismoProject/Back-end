import { applyDecorators } from '@nestjs/common';
import { ValidateIf } from 'class-validator';

export function AnyOf(properties: string[]) {
  return function (target: any) {
    for (const property of properties) {
      const otherProps = properties.filter((prop) => prop !== property);
      const decorators = [
        // Validates if all other properties are undefined.
        ValidateIf(
          (obj: any) =>
            obj[property] !== undefined ||
            otherProps.reduce(
              (acc, prop) => acc && obj[prop] === undefined,
              true,
            ),
        ),
      ];

      for (const decorator of decorators) {
        applyDecorators(decorator)(target.prototype, property);
      }
    }
  };
}
