import {
  convexAuthNextjsMiddleware,
  createRouteMatcher,
  isAuthenticatedNextjs,
  nextjsMiddlewareRedirect,
} from "@convex-dev/auth/nextjs/server";
import { createI18nMiddleware } from "next-international/middleware";

const I18nMiddleware = createI18nMiddleware({
  locales: ["en", "fr", "es"],
  defaultLocale: "en",
  urlMappingStrategy: "rewrite",
});

const isSignInPage = createRouteMatcher(["/login"]);
const isSignOut = createRouteMatcher(["/logout"]);

export default convexAuthNextjsMiddleware(async (request) => {
  const isAuthenticated = await isAuthenticatedNextjs();
  if (!isSignOut(request)) {
    if (isSignInPage(request) && isAuthenticated) {
      return nextjsMiddlewareRedirect(request, "/");
    }
    if (!isSignInPage(request) && !isAuthenticated) {
      return nextjsMiddlewareRedirect(request, "/login");
    }
  }

  return I18nMiddleware(request);
});

export const config = {
  matcher: [
    "/((?!_next/static|api|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",

    // all routes except static assets
    "/((?!.*\\..*|_next).*)",
    "/",
    "/(api|trpc)(.*)",
  ],
};
