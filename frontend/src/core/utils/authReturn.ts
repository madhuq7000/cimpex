export const AUTH_RETURN_TO_KEY = "authReturnTo";

export const getSafeReturnPath = (value: string | null | undefined) => {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "";
  }

  return value;
};
