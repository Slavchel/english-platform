export const PRO_TEST_EMAIL = "test02@example.com";

export function canUseProTestActivation(
  email: string | null | undefined,
  isAdmin: boolean,
): boolean {
  return isAdmin || email === PRO_TEST_EMAIL;
}

export function canResetTestAccount(email: string | null | undefined): boolean {
  return email === PRO_TEST_EMAIL;
}
