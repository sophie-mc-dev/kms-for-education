import { Button, Typography } from "@material-tailwind/react";
import { Link, useNavigate } from "react-router-dom";

export function HomePage() {
  const navigate = useNavigate();

  return (
    <section className="m-8 flex flex-col gap-4">
      <div className="w-full mt-24 text-center">
        <Typography variant="h2" className="font-bold mb-4">
          Welcome to Knowmia
        </Typography>

        <div className="mt-8 mb-2 mx-auto w-40 max-w-screen-lg lg:w-1/2">
          <Button
            onClick={() => navigate("/auth/sign-in")}
            type="button"
            className="mt-6 w-60"
          >
            Sign In
          </Button>

          <Typography className="text-center text-blue-gray-500 font-medium mt-4">
            Not registered?
            <Link to="/auth/sign-up" className="text-gray-900 ml-1 underline">
              Create account
            </Link>
          </Typography>
        </div>
      </div>

      {/* Image block at the bottom */}
      <div className="w-full mt-12 rounded-3xl overflow-hidden">
        <img
          src="/img/pattern.png"
          className="w-full object-cover rounded-3xl max-h-64 mx-auto"
          alt="Decorative background pattern"
        />
      </div>
    </section>
  );
}

export default HomePage;
