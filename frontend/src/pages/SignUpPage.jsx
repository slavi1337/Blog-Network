import { SignUp } from "@clerk/clerk-react";

const SignUpPage = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#e6e6e6]">
      <SignUp path="/sign-up" routing="path" />
    </div>
  );
};

export default SignUpPage;
