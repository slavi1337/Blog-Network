import { SignIn } from "@clerk/clerk-react";

const SignInPage = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#e6e6e6]">
      <SignIn path="/sign-in" routing="path" />
    </div>
  );
};

export default SignInPage;
