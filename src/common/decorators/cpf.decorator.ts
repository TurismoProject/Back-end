import { Matches, ValidationOptions } from 'class-validator';

const cpfRegex = /^\d{3}\.\d{3}\.\d{3}-\d{2}$|^\d{11}$/;
const formatMessag = 'CPF deve estar no formato 000.000.000-00 ou 00000000000';

function buildCpfValidator(validationOptions?: ValidationOptions) {
  return Matches(cpfRegex, {
    message: formatMessag,
    ...validationOptions,
  });
}

export function IsCPF(validationOptions?: ValidationOptions) {
  return buildCpfValidator(validationOptions);
}
