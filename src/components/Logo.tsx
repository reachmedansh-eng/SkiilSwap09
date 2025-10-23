import { Link } from "react-router-dom";

export const Logo = () => {
  return (
    <Link to="/" className="select-none">
      <span className="text-4xl md:text-5xl font-retropix text-deep-indigo">
        Skillswap
      </span>
    </Link>
  );
};
