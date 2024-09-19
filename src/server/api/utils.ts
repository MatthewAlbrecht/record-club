export class ActionError extends Error {}

export const PGErrorCodes = {
  UniqueConstraintViolation: "23505",
} as const;

export class DatabaseError extends Error {
  constructor(
    public errorMap: Partial<
      Record<(typeof PGErrorCodes)[keyof typeof PGErrorCodes], string>
    >,
    options?: ErrorOptions,
  ) {
    const pgErrorCode =
      options?.cause instanceof Error ? (options.cause as any).code : undefined;

    const message =
      pgErrorCode && pgErrorCode in errorMap
        ? errorMap[pgErrorCode as keyof typeof errorMap]
        : "An unknown database error occurred";

    super(message, options);
    this.name = "DatabaseError";
  }
}
