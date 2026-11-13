import { useSearchParams } from "react-router-dom";
import { SignIn } from "@clerk/clerk-react";
import { ROUTES } from "@/constants/routes";
import { AuthLayout } from "@/components/AuthLayout";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { REDIRECT_PARAM, getSafeRedirect, withRedirect } from "@/routes/redirect";

const SignInPage = () => {
  useDocumentTitle("Sign in");
  const [searchParams] = useSearchParams();
  // Where the user was headed before being asked to sign in
  const destination = getSafeRedirect(searchParams.get(REDIRECT_PARAM));

  return (
    <AuthLayout>
      <SignIn
        signUpUrl={withRedirect(ROUTES.AUTH.SIGN_UP, destination)}
        forceRedirectUrl={destination}
      />
    </AuthLayout>
  );
};

export default SignInPage;
