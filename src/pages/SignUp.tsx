import { useSearchParams } from "react-router-dom";
import { SignUp } from "@clerk/clerk-react";
import { ROUTES } from "@/constants/routes";
import { AuthLayout } from "@/components/AuthLayout";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { REDIRECT_PARAM, getSafeRedirect, withRedirect } from "@/routes/redirect";

export const SignUpPage = () => {
  useDocumentTitle("Create an account");
  const [searchParams] = useSearchParams();
  // New accounts go through profile setup first (AuthGuard); this is where
  // they end up when that's not needed
  const destination = getSafeRedirect(searchParams.get(REDIRECT_PARAM));

  return (
    <AuthLayout>
      <SignUp
        signInUrl={withRedirect(ROUTES.AUTH.SIGN_IN, destination)}
        forceRedirectUrl={destination}
      />
    </AuthLayout>
  );
};

export default SignUpPage;
