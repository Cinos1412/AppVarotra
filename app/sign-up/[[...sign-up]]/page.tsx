import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="flex justify-center pt-8">
      <SignUp
        forceRedirectUrl="/terms"
        appearance={{
          variables: { colorPrimary: "#0A84FF", colorBackground: "transparent", colorText: "#fff" },
          elements: { card: "glass !shadow-glass rounded-3xl", headerTitle: "font-display" },
        }}
      />
    </div>
  );
}
