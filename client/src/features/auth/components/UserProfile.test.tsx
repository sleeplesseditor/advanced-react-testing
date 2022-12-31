import { App } from "../../../App";
import { render, screen } from "../../../test-utils";
import { UserProfile } from "./UserProfile";

const testUser = {
  email: "booking@bandbooker.com",
};

test("greeting displayed", () => {
  render(<UserProfile />, {
    preLoadedState: { user: { userDetails: testUser } },
  });
  expect(screen.getByText(/hi, booking@bandbooker.com/i)).toBeInTheDocument();
});

test("redirects if user is falsy", () => {
  const { history } = render(<UserProfile />);
  expect(history.location.pathname).toBe("/signin");
});

test("view sign-in page when loading profile while not logged in", () => {
  render(<App />, { routeHistory: ["/profile"] });
  const heading = screen.getByRole("heading", {
    name: /Sign in to your account/i,
  });
  expect(heading).toBeInTheDocument();
});
