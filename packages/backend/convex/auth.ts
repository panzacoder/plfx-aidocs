import Google from "@auth/core/providers/google";
import { convexAuth } from "@convex-dev/auth/server";
import { internal } from "./_generated/api";

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [Google],
  hooks: {
    // Hook that runs when a new user is created
    onUserCreation: async ({ db, userId }) => {
      // Trigger the user onboarding process
      await db.runMutation(internal.users.auth.onUserCreation, { userId });
    },
  },
});
