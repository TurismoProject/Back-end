import { Transform } from 'class-transformer';

export function TransformDate() {
  return Transform(({ value }) => {
    const [day, month, year] = value.split('/');
    return new Date(year, month - 1, day).toISOString();
  });
}
