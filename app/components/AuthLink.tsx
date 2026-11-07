import Link from "next/link";
import { connection } from "next/server";

import { auth } from "@/auth";
import { signOutAction } from "@/app/account/actions";

export default async function AuthLink() {
  await connection();
  const session = await auth();

  return (
    <>
      <li>
        <Link
          href={session?.user ? "/account" : "/login"}
          className="nav-link"
        >
          {session?.user ? "Аккаунт" : "Войти"}
        </Link>
      </li>
      {session?.user ? (
        <li>
          <form action={signOutAction}>
            <button type="submit" className="nav-link nav-link--button">
              Выйти
            </button>
          </form>
        </li>
      ) : null}
    </>
  );
}
