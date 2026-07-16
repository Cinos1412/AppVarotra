import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="flex justify-center pt-8">
      <SignIn
        appearance={{
          variables: { colorPrimary: "#0A84FF", colorBackground: "transparent",},
          elements: { card: "glass !shadow-glass rounded-3xl", headerTitle: "font-display" },
        }}
      />
    </div>
  );
}
