import { Suspense } from "react";
import AuthGuard from "./components/AuthGuard";
import { FullScreenLoader } from "./components/FullScreenLoader";
import { AppRoutes } from "./routes/AppRoutes";
import { ScrollToTop } from "./components/ScrollToTop";

function App() {
  return (
    <AuthGuard>
      <ScrollToTop />
      <Suspense fallback={<FullScreenLoader />}>
        <AppRoutes />
      </Suspense>
    </AuthGuard>
  );
}

export default App;
