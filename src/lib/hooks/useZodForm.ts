import z from "zod";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  useForm as useHookForm,
  UseFormProps,
  FieldValues,
} from "react-hook-form";

export function useZodForm<TFieldValues extends FieldValues = FieldValues>(
  props: Omit<UseFormProps<TFieldValues>, "resolver"> & {
    schema: z.ZodType<TFieldValues>;
  },
) {
  const form = useHookForm<TFieldValues>({
    ...props,
    resolver: zodResolver(props.schema, undefined),
  });

  return form;
}
