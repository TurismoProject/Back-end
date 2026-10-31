import {
    registerDecorator,
    ValidationOptions,
    ValidationArguments,
} from 'class-validator';

export function Match(
    property: string,
    validationOptions?: ValidationOptions,
): PropertyDecorator {
    return (object: Record<string, any>, propertyName: string) => {
        registerDecorator({
            name: 'Match',
            target: object.constructor,
            propertyName,
            constraints: [property],
            options: validationOptions,
            validator: {
                validate(value: any, args: ValidationArguments): boolean {
                    const [relatedPropertyName] = args.constraints;
                    const relatedValue = (args.object as any)[relatedPropertyName];
                    return value === relatedValue;
                },
                defaultMessage(args: ValidationArguments): string {
                    const [relatedPropertyName] = args.constraints;
                    return `${args.property} deve ser igual a ${relatedPropertyName}`;
                },
            },
        });
    };
}
